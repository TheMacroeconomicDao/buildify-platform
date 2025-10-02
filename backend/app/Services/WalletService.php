<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Throwable;

class WalletService
{
    /**
     * Пополнение кошелька (после подтверждения Stripe)
     * @throws Throwable
     */
    public function deposit(User $user, int $amountCents, string $currency = 'aed', ?string $paymentIntentId = null, ?string $sessionId = null, array $meta = []): WalletTransaction
    {
        return DB::transaction(function () use ($user, $amountCents, $currency, $paymentIntentId, $sessionId, $meta) {
            $balanceBefore = $user->wallet_balance;
            $balanceAfter = $balanceBefore + $amountCents;

            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'amount' => $amountCents,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => $currency,
                'stripe_payment_intent_id' => $paymentIntentId,
                'stripe_session_id' => $sessionId,
                'meta' => $meta,
            ]);

            $user->update([
                'wallet_balance' => $balanceAfter,
                'wallet_currency' => $currency,
            ]);

            // Обрабатываем реферальный кэшбэк
            try {
                $referralService = app(ReferralService::class);
                $referralService->processCashback($transaction);
            } catch (\Exception $e) {
                // Логируем ошибку, но не прерываем основную транзакцию
                \Log::error('Error processing referral cashback', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage()
                ]);
            }

            return $transaction;
        });
    }

    /**
     * Списание средств с кошелька (оплата подписки/услуг)
     * @throws Throwable
     */
    public function charge(User $user, int $amountCents, string $type = 'charge', array $meta = []): WalletTransaction
    {
        return DB::transaction(function () use ($user, $amountCents, $type, $meta) {
            $balanceBefore = $user->wallet_balance;
            
            // Проверяем достаточность средств
            if ($balanceBefore < $amountCents) {
                throw new \Exception('Insufficient wallet balance');
            }
            
            $balanceAfter = $balanceBefore - $amountCents;

            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'type' => $type,
                'amount' => $amountCents,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => $user->wallet_currency ?? 'aed',
                'meta' => $meta,
            ]);

            $user->update([
                'wallet_balance' => $balanceAfter,
            ]);

            return $transaction;
        });
    }

    /**
     * Проверка достаточности средств на кошельке
     */
    public function hasBalance(User $user, int $amountCents): bool
    {
        return ($user->wallet_balance ?? 0) >= $amountCents;
    }

    /**
     * Удержать средства в escrow
     */
    public function holdFunds(User $user, int $amountCents, int $orderId): bool
    {
        return DB::transaction(function () use ($user, $amountCents, $orderId) {
            // Проверяем достаточность средств
            if (!$this->hasBalance($user, $amountCents)) {
                throw new \Exception('Insufficient wallet balance for escrow');
            }

            $balanceBefore = $user->wallet_balance;
            $balanceAfter = $balanceBefore - $amountCents;

            // Создаем hold транзакцию
            WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'escrow_hold',
                'amount' => $amountCents,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => $user->wallet_currency ?? 'aed',
                'meta' => [
                    'order_id' => $orderId,
                    'status' => 'held',
                    'held_at' => now()->toISOString()
                ],
            ]);

            $user->update(['wallet_balance' => $balanceAfter]);

            \Log::info('Funds held in escrow', [
                'user_id' => $user->id,
                'order_id' => $orderId,
                'amount' => $amountCents
            ]);

            return true;
        });
    }

    /**
     * Освободить средства из escrow исполнителю
     */
    public function releaseFunds(Order $order): bool
    {
        return DB::transaction(function () use ($order) {
            if (!$order->executor || !$order->payment_held) {
                return false;
            }

            $amountCents = $order->payment_held * 100;

            // Рассчитываем комиссию платформы (10%)
            $platformCommission = $amountCents * 0.10;
            $executorPayout = $amountCents - $platformCommission;

            // Зачисляем исполнителю
            $balanceBefore = $order->executor->wallet_balance ?? 0;
            $balanceAfter = $balanceBefore + $executorPayout;

            WalletTransaction::create([
                'user_id' => $order->executor->id,
                'type' => 'escrow_release',
                'amount' => $executorPayout,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => 'aed',
                'meta' => [
                    'order_id' => $order->id,
                    'original_amount' => $amountCents,
                    'platform_commission' => $platformCommission,
                    'released_at' => now()->toISOString()
                ],
            ]);

            $order->executor->update(['wallet_balance' => $balanceAfter]);

            // Обновляем заказ
            $order->update([
                'escrow_status' => 'released',
                'payment_held' => 0,
                'executor_cost' => $executorPayout / 100, // В AED
            ]);

            \Log::info('Funds released from escrow', [
                'order_id' => $order->id,
                'executor_id' => $order->executor->id,
                'amount' => $executorPayout,
                'commission' => $platformCommission
            ]);

            return true;
        });
    }

    /**
     * Вернуть средства из escrow заказчику
     */
    public function refundFunds(Order $order, float $refundPercentage = 100): bool
    {
        return DB::transaction(function () use ($order, $refundPercentage) {
            if (!$order->author || !$order->payment_held) {
                return false;
            }

            $amountCents = $order->payment_held * 100;
            $refundAmount = $amountCents * ($refundPercentage / 100);

            // Возвращаем средства заказчику
            $balanceBefore = $order->author->wallet_balance ?? 0;
            $balanceAfter = $balanceBefore + $refundAmount;

            WalletTransaction::create([
                'user_id' => $order->author->id,
                'type' => 'escrow_refund',
                'amount' => $refundAmount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => 'aed',
                'meta' => [
                    'order_id' => $order->id,
                    'refund_percentage' => $refundPercentage,
                    'original_amount' => $amountCents,
                    'refunded_at' => now()->toISOString()
                ],
            ]);

            $order->author->update(['wallet_balance' => $balanceAfter]);

            // Обновляем заказ
            $order->update([
                'escrow_status' => 'refunded',
                'payment_held' => 0,
            ]);

            \Log::info('Funds refunded from escrow', [
                'order_id' => $order->id,
                'customer_id' => $order->author->id,
                'amount' => $refundAmount,
                'percentage' => $refundPercentage
            ]);

            return true;
        });
    }
}

