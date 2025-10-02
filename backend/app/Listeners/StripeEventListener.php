<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\WalletService;
use App\Services\SubscriptionTransactionService;
use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    /**
     * Handle received Stripe webhooks.
     */
    public function handle(WebhookReceived $event): void
    {
        ['type' => $type, 'data' => $data] = $event->payload;

        // checkout.session.completed
        if ($type === 'checkout.session.completed') {
            $session = $data['object'] ?? [];
            $metadata = $session['metadata'] ?? [];
            
            // Пополнение кошелька
            if (($metadata['wallet_topup'] ?? null) === true || ($metadata['wallet_topup'] ?? '') === 'true') {
                $userId = (int) ($metadata['user_id'] ?? 0);
                $amount = (int) ($metadata['amount'] ?? 0);
                $currency = (string) ($metadata['currency'] ?? 'aed');
                if ($userId > 0 && $amount > 0) {
                    $user = User::find($userId);
                    if ($user instanceof User) {
                        app(WalletService::class)->deposit(
                            $user,
                            $amount,
                            $currency,
                            $session['payment_intent'] ?? null,
                            $session['id'] ?? null,
                            $metadata
                        );
                    }
                }
            }
            
            // Покупка подписки
            if (($metadata['subscription_purchase'] ?? null) === true || ($metadata['subscription_purchase'] ?? '') === 'true') {
                $userId = (int) ($metadata['user_id'] ?? 0);
                $tariffId = (int) ($metadata['tariff_id'] ?? 0);
                if ($userId > 0 && $tariffId > 0) {
                    $user = User::find($userId);
                    $tariff = \App\Models\Tariff::find($tariffId);
                    if ($user instanceof User && $tariff) {
                        // Активируем подписку пользователя с датами
                        $user->activateSubscription($tariff);
                        
                        // Записываем транзакцию в историю платежей
                        $transactionService = new SubscriptionTransactionService();
                        $sessionId = $session['id'] ?? null;
                        $paymentIntentId = $session['payment_intent'] ?? null;
                        
                        if ($sessionId) {
                            $transactionService->recordSubscriptionPayment(
                                $user, 
                                $tariff, 
                                $sessionId, 
                                $paymentIntentId
                            );
                        }
                    }
                }
            }
        }
    }
}
