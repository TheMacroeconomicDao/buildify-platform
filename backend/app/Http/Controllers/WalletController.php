<?php

namespace App\Http\Controllers;

use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Cashier\Cashier;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class WalletController extends Controller
{
    public function me(): JsonResponse
    {
        $user = auth()->user();
        return response()->json([
            'success' => true,
            'wallet' => [
                'balance' => $user->wallet_balance,
                'currency' => $user->wallet_currency,
            ],
        ]);
    }

    /**
     * Создать Stripe Checkout для пополнения кошелька
     */
    public function topup(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|integer|min:100', // min 1.00 AED
            'currency' => 'nullable|string|in:aed',
        ]);

        $user = $request->user();
        $amount = (int) $request->integer('amount');
        $currency = $request->get('currency', 'aed');

        // Готовим базовый payload
        $payload = [
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'success_url' => config('app.success_url') . '?type=wallet_topup&session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => config('app.cancel_url') . '?type=wallet_topup',
            'line_items' => [[
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => 'Wallet top-up',
                    ],
                    'unit_amount' => $amount,
                ],
                'quantity' => 1,
            ]],
            'metadata' => [
                'wallet_topup' => true,
                'user_id' => (string) $user->id,
                'currency' => $currency,
                'amount' => (string) $amount,
            ],
        ];

        // Добавляем customer только если он валиден; иначе пытаемся создать
        $customerId = $user->stripe_id ?? null;
        if (empty($customerId)) {
            try {
                if (method_exists($user, 'createOrGetStripeCustomer')) {
                    $user->createOrGetStripeCustomer();
                    $customerId = $user->stripe_id;
                }
            } catch (\Throwable $e) {
                $customerId = null; // просто не указываем customer в сессии
            }
        }
        if (!empty($customerId)) {
            $payload['customer'] = $customerId;
        }

        // Создаём Checkout Session
        $session = Cashier::stripe()->checkout->sessions->create($payload);

        return response()->json([
            'success' => true,
            'checkout_url' => $session->url,
        ]);
    }

    /**
     * Получить список транзакций кошелька пользователя
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $transactions = WalletTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(50) // Последние 50 транзакций
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'balance_before' => $transaction->balance_before,
                    'balance_after' => $transaction->balance_after,
                    'currency' => $transaction->currency,
                    'created_at' => $transaction->created_at,
                    'meta' => $transaction->meta,
                ];
            });

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
        ]);
    }
}

