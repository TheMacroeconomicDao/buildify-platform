<?php

namespace App\Services;

use App\Models\Tariff;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class SubscriptionTransactionService
{
    /**
     * Создает запись о транзакции подписки после успешной оплаты
     */
    public function recordSubscriptionPayment(
        User $user, 
        Tariff $tariff, 
        string $sessionId, 
        ?string $paymentIntentId = null
    ): WalletTransaction {
        return DB::transaction(function () use ($user, $tariff, $sessionId, $paymentIntentId) {
            // Создаем запись в wallet_transactions для истории платежей
            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'subscription_payment',
                'amount' => $tariff->price * 100, // Конвертируем в центы
                'balance_before' => $user->wallet_balance ?? 0,
                'balance_after' => $user->wallet_balance ?? 0, // Баланс не изменяется при покупке подписки
                'currency' => 'aed',
                'stripe_payment_intent_id' => $paymentIntentId,
                'stripe_session_id' => $sessionId,
                'meta' => [
                    'tariff_id' => $tariff->id,
                    'tariff_name' => $tariff->name,
                    'duration_days' => $tariff->duration_days,
                    'is_test' => $tariff->is_test ?? false,
                    'transaction_type' => 'subscription_purchase'
                ],
            ]);

            return $transaction;
        });
    }

    /**
     * Создает запись в старой системе транзакций (для совместимости)
     */
    public function recordLegacyTransaction(
        User $user, 
        Tariff $tariff, 
        string $sessionId
    ): ?Transaction {
        // Проверяем, есть ли запись в старой таблице subscription
        $legacySubscription = DB::table('subscription')
            ->where('name', $tariff->name)
            ->first();

        if (!$legacySubscription) {
            // Если нет записи в старой таблице, не создаем транзакцию
            return null;
        }

        return Transaction::create([
            'subscription_id' => $legacySubscription->id,
            'amount' => $tariff->price,
            'user_discount' => 0,
            'user_id' => $user->id,
            'promo_code_id' => null,
            'status' => 1, // Успешно оплачено
            'payment_id' => $sessionId,
        ]);
    }
}
