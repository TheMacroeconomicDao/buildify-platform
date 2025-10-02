<?php
// app/Http/Controllers/SubscriptionController.php

namespace App\Http\Controllers;

use App\Models\Tariff;
use App\Services\SubscriptionTransactionService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Cashier\Cashier;

class SubscriptionController extends Controller
{
    // Получение списка всех подписок
    public function index()
    {
        $subscriptions = Tariff::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'subscriptions' => $subscriptions
        ]);
    }

    public function mySubscription(Request $request)
    {
        $user = $request->user();
        $tariff = $user->currentTariff();

        // Теперь у всех пользователей всегда есть тариф (минимум Free)
        // поэтому не возвращаем 404
        $subscription = null;
        if ($user->subscribed()) {
            $subscription = $user->subscription();
        }

        $nextTariff = $user->next_tariff_id ? Tariff::find($user->next_tariff_id) : null;

        return response()->json([
            'success' => true,
            'subscription' => $subscription,
            'tariff' => $tariff,
            'subscription_started_at' => $user->subscription_started_at,
            'subscription_ends_at' => $user->subscription_ends_at,
            'is_active' => $user->hasActiveSubscription(),
            'days_until_expiration' => $user->getDaysUntilSubscriptionExpires(),
            // Информация об использовании лимитов
            'used_orders_count' => $user->used_orders_count,
            'used_contacts_count' => $user->used_contacts_count,
            'remaining_orders' => $tariff ? max(0, $tariff->max_orders - $user->used_orders_count) : 0,
            'remaining_contacts' => $tariff ? max(0, $tariff->max_contacts - $user->used_contacts_count) : 0,
            // Информация о следующей подписке
            'next_tariff' => $nextTariff,
            'next_subscription_starts_at' => $user->next_subscription_starts_at,
            'next_subscription_ends_at' => $user->next_subscription_ends_at,
        ]);
    }

    // Создание ссылки на оплату подписки
    public function checkout(Request $request, Tariff $tariff)
    {
        $user = $request->user();

        // Все подписки теперь идут через процесс оплаты, включая 0 AED

        // Для платных тарифов создаем одноразовый платеж (как в wallet)
        try {
            // Убираем проверки активных подписок - теперь разрешаем продление

            // Создаем Stripe Checkout Session для одноразового платежа
            $payload = [
                'mode' => 'payment',
                'payment_method_types' => ['card'],
                'success_url' => route('subscription.success') . '?session_id={CHECKOUT_SESSION_ID}&tariff_id=' . $tariff->id,
                'cancel_url' => route('subscription.cancel'),
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'aed',
                        'product_data' => [
                            'name' => $tariff->name,
                            'description' => "Subscription for {$tariff->duration_days} days",
                        ],
                        'unit_amount' => $tariff->price * 100, // в центах
                    ],
                    'quantity' => 1,
                ]],
                'metadata' => [
                    'subscription_purchase' => true,
                    'tariff_id' => (string) $tariff->id,
                    'user_id' => (string) $user->id,
                    'duration_days' => (string) $tariff->duration_days,
                ],
            ];

            // Добавляем customer если возможно
            $customerId = $user->stripe_id ?? null;
            if (empty($customerId)) {
                try {
                    if (method_exists($user, 'createOrGetStripeCustomer')) {
                        $user->createOrGetStripeCustomer();
                        $customerId = $user->stripe_id;
                    }
                } catch (\Throwable $e) {
                    $customerId = null;
                }
            }
            if (!empty($customerId)) {
                $payload['customer'] = $customerId;
            }

            // Создаём Checkout Session
            $session = \Laravel\Cashier\Cashier::stripe()->checkout->sessions->create($payload);

            return response()->json([
                'success' => true,
                'checkout_url' => $session->url,
                'is_free' => false
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment session. Please try again or contact support.'
            ], 500);
        }
    }

    // Отмена подписки
    public function unsubscribe(Request $request)
    {
        $user = $request->user();

        // Проверяем есть ли активная подписка (простая или Stripe)
        $hasStripeSubscription = $user->subscribed();
        $hasSimpleSubscription = $user->hasActiveSubscription();

        if (!$hasStripeSubscription && !$hasSimpleSubscription) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have an active subscription to cancel'
            ], 404);
        }

        try {
            // Если есть Stripe подписка - отменяем ее
            if ($hasStripeSubscription) {
                $subscription = $user->subscription('default');
                $subscription->cancel();
            }

            // Для простых подписок - планируем переход на Free после истечения текущей
            if ($hasSimpleSubscription) {
                $freeTariff = Tariff::where('name', 'Free')->first();
                if ($freeTariff) {
                    // Устанавливаем Free тариф как следующий
                    $user->update([
                        'next_tariff_id' => $freeTariff->id,
                        'next_subscription_starts_at' => $user->subscription_ends_at,
                        'next_subscription_ends_at' => null, // Free тариф бессрочный
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Subscription will be cancelled at the end of the current period. You will be switched to the Free plan.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while cancelling the subscription. Please contact support.'
            ], 500);
        }
    }

    // Метод для успешной оплаты
    public function success(Request $request)
    {
        \Log::info('SubscriptionController@success called', [
            'all_params' => $request->all(),
            'session_id' => $request->get('session_id'),
            'tariff_id' => $request->get('tariff_id'),
            'url' => $request->fullUrl()
        ]);

        $sessionId = $request->get('session_id');
        $tariffId = $request->get('tariff_id');
        
        if (!$sessionId || !$tariffId) {
            \Log::error('SubscriptionController@success: Missing parameters', [
                'session_id' => $sessionId,
                'tariff_id' => $tariffId
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Insufficient data to activate subscription'
            ], 400);
        }

        try {
            // Получаем информацию о сессии из Stripe
            $session = \Laravel\Cashier\Cashier::stripe()->checkout->sessions->retrieve($sessionId);
            
            // Проверяем, что платеж успешен
            if ($session->payment_status !== 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment was not completed'
                ], 400);
            }

            // Получаем тариф и пользователя из метаданных Stripe
            $tariff = Tariff::findOrFail($tariffId);
            
            // Получаем user_id из метаданных сессии Stripe
            $userId = $session->metadata->user_id ?? null;
            if (!$userId) {
                \Log::error('SubscriptionController@success: No user_id in session metadata', [
                    'session_metadata' => $session->metadata ?? 'null'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to identify user'
                ], 400);
            }
            
            $user = \App\Models\User::find($userId);
            if (!$user) {
                \Log::error('SubscriptionController@success: User not found', [
                    'user_id' => $userId
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            \Log::info('SubscriptionController@success: Activating subscription', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'tariff_id' => $tariff->id,
                'tariff_name' => $tariff->name,
                'tariff_price' => $tariff->price,
                'session_payment_status' => $session->payment_status
            ]);

            // Активируем подписку
            $user->activateSubscription($tariff);

            \Log::info('SubscriptionController@success: Subscription activated', [
                'user_id' => $user->id,
                'current_tariff_id' => $user->current_tariff_id,
                'subscription_started_at' => $user->subscription_started_at,
                'subscription_ends_at' => $user->subscription_ends_at
            ]);

            // Записываем транзакцию в историю платежей
            $transactionService = new SubscriptionTransactionService();
            $paymentIntentId = $session->payment_intent ?? null;
            
            // Создаем запись в новой системе транзакций
            $transaction = $transactionService->recordSubscriptionPayment(
                $user, 
                $tariff, 
                $sessionId, 
                $paymentIntentId
            );

            // Создаем запись в старой системе (для совместимости)
            $transactionService->recordLegacyTransaction($user, $tariff, $sessionId);

            \Log::info('SubscriptionController@success: Success response', [
                'transaction_id' => $transaction->id,
                'user_id' => $user->id,
                'tariff_id' => $tariff->id
            ]);

            // Возвращаем HTML-ответ с редиректом для мобильного приложения
            return response()->view('subscription.success', [
                'success' => true,
                'message' => 'Subscription successfully activated',
                'tariff' => $tariff,
                'session_id' => $sessionId,
                'transaction_id' => $transaction->id
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error activating subscription: ' . $e->getMessage()
            ], 500);
        }
    }

    // Метод для отмены оплаты
    public function cancel(Request $request)
    {
        \Log::info('SubscriptionController@cancel called', [
            'all_params' => $request->all(),
            'url' => $request->fullUrl()
        ]);

        return response()->view('subscription.cancel', [
            'success' => false,
            'message' => 'Payment cancelled'
        ]);
    }

    /**
     * Оплата подписки из кошелька
     */
    public function payFromWallet(Request $request, Tariff $tariff)
    {
        $request->validate([
            'payment_method' => 'required|string|in:wallet',
        ]);

        $user = $request->user();
        $walletService = app(WalletService::class);
        $subscriptionService = app(SubscriptionTransactionService::class);

        try {
            // Убираем проверки активных подписок - теперь разрешаем продление

            $amountCents = $tariff->price * 100; // Convert to cents

            // Проверяем достаточность средств
            if (!$walletService->hasBalance($user, $amountCents)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient wallet balance'
                ], 400);
            }

            // Списываем средства с кошелька
            $transaction = $walletService->charge($user, $amountCents, 'subscription_payment', [
                'tariff_id' => $tariff->id,
                'tariff_name' => $tariff->name,
                'duration_days' => $tariff->duration_days,
                'payment_method' => 'wallet'
            ]);

            // Активируем подписку через метод модели (с учетом активной подписки)
            $user->activateSubscription($tariff);

            return response()->json([
                'success' => true,
                'message' => 'Subscription successfully activated',
                'transaction_id' => $transaction->id,
                'new_balance' => $user->wallet_balance,
                'subscription' => [
                    'tariff_name' => $tariff->name,
                    'start_date' => $user->subscription_started_at,
                    'end_date' => $user->subscription_ends_at,
                    'starts_immediately' => $user->subscription_started_at->equalTo(now()),
                    'days_until_start' => $user->subscription_started_at->equalTo(now()) ? 0 : now()->diffInDays($user->subscription_started_at, false)
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Wallet subscription payment error', [
                'user_id' => $user->id,
                'tariff_id' => $tariff->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error processing wallet payment: ' . $e->getMessage()
            ], 500);
        }
    }
}
