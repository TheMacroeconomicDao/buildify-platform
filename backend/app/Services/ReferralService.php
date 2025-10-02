<?php

namespace App\Services;

use App\Models\User;
use App\Models\ReferralCode;
use App\Models\Referral;
use App\Models\ReferralTransaction;
use App\Models\ReferralSetting;
use App\Models\WalletTransaction;
use App\Enums\Users\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class ReferralService
{
    /**
     * Создать промокод для пользователя
     */
    public function createReferralCode(User $user): ReferralCode
    {
        // Проверяем, что у пользователя ещё нет промокода
        if ($user->referralCode) {
            return $user->referralCode;
        }

        return ReferralCode::createForUser($user);
    }

    /**
     * Обработать регистрацию с промокодом
     */
    public function processReferralRegistration(User $newUser, string $referralCode): ?Referral
    {
        try {
            // Проверяем, включена ли партнёрская программа
            if (!ReferralSetting::isProgramEnabled()) {
                Log::info('Referral program is disabled');
                return null;
            }

            // Находим промокод
            $referralCodeModel = ReferralCode::findActiveByCode($referralCode);
            if (!$referralCodeModel) {
                Log::info("Referral code not found: {$referralCode}");
                return null;
            }

            // Проверяем, что пользователь не пытается использовать свой собственный промокод
            if ($referralCodeModel->user_id === $newUser->id) {
                Log::warning("User {$newUser->id} tried to use own referral code");
                return null;
            }

            // Проверяем, что новый пользователь - исполнитель или заказчик (посредники не могут быть рефералами)
            if (!in_array($newUser->type, [Type::Executor->value, Type::Customer->value])) {
                Log::info("User {$newUser->id} with type {$newUser->type} tried to use referral code");
                return null;
            }

            // Создаём реферальную связь
            $referral = Referral::create([
                'referrer_id' => $referralCodeModel->user_id,
                'referred_id' => $newUser->id,
                'referral_code_id' => $referralCodeModel->id,
                'status' => 'active'
            ]);

            // Обновляем счётчики у реферрера
            $referrer = $referralCodeModel->user;
            $referrer->increment('total_referrals_count');
            $referrer->increment('active_referrals_count');

            Log::info("Referral created", [
                'referrer_id' => $referrer->id,
                'referred_id' => $newUser->id,
                'referral_code' => $referralCode
            ]);

            return $referral;

        } catch (Exception $e) {
            Log::error('Error processing referral registration', [
                'user_id' => $newUser->id,
                'referral_code' => $referralCode,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Обработать кэшбэк с пополнения кошелька
     */
    public function processCashback(WalletTransaction $walletTransaction): ?ReferralTransaction
    {
        try {
            // Проверяем, что это пополнение кошелька
            if ($walletTransaction->type !== 'deposit') {
                return null;
            }

            // Проверяем, включена ли партнёрская программа
            if (!ReferralSetting::isProgramEnabled()) {
                return null;
            }

            // Находим активную реферальную связь для пользователя
            $referral = Referral::where('referred_id', $walletTransaction->user_id)
                ->where('status', 'active')
                ->first();

            if (!$referral) {
                return null;
            }

            // Получаем настройки кэшбэка
            $cashbackPercentage = ReferralSetting::getCashbackPercentage();
            $minCashbackAmount = ReferralSetting::getMinCashbackAmount();
            $maxCashbackPerTransaction = ReferralSetting::getMaxCashbackPerTransaction();

            // Рассчитываем сумму кэшбэка
            $cashbackAmount = $this->calculateCashback(
                $walletTransaction->amount,
                $cashbackPercentage
            );

            // Проверяем минимальную сумму
            if ($cashbackAmount < $minCashbackAmount) {
                Log::info("Cashback amount too small", [
                    'amount' => $cashbackAmount,
                    'min_required' => $minCashbackAmount
                ]);
                return null;
            }

            // Применяем максимальный лимит
            $cashbackAmount = min($cashbackAmount, $maxCashbackPerTransaction);

            return DB::transaction(function () use (
                $referral,
                $walletTransaction,
                $cashbackAmount,
                $cashbackPercentage
            ) {
                // Создаём транзакцию кэшбэка
                $referralTransaction = ReferralTransaction::create([
                    'referral_id' => $referral->id,
                    'referrer_id' => $referral->referrer_id,
                    'referred_id' => $referral->referred_id,
                    'wallet_transaction_id' => $walletTransaction->id,
                    'cashback_amount' => $cashbackAmount,
                    'cashback_percentage' => $cashbackPercentage,
                    'status' => 'pending'
                ]);

                // Обрабатываем кэшбэк
                $referralTransaction->process();

                Log::info("Cashback processed", [
                    'referrer_id' => $referral->referrer_id,
                    'referred_id' => $referral->referred_id,
                    'cashback_amount' => $cashbackAmount,
                    'percentage' => $cashbackPercentage
                ]);

                return $referralTransaction;
            });

        } catch (Exception $e) {
            Log::error('Error processing cashback', [
                'wallet_transaction_id' => $walletTransaction->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Рассчитать сумму кэшбэка
     */
    private function calculateCashback(int $amount, float $percentage): int
    {
        return (int) round($amount * $percentage / 100);
    }

    /**
     * Получить статистику рефералов для пользователя
     */
    public function getReferralStats(User $user): array
    {
        $referralCode = $user->referralCode;
        
        return [
            'referral_code' => $referralCode?->code,
            'total_referrals' => $user->total_referrals_count ?? 0,
            'active_referrals' => $user->active_referrals_count ?? 0,
            'referral_balance' => $user->referral_balance ?? 0,
            'referral_balance_aed' => $user->referral_balance_aed,
            'total_earnings' => $user->total_referral_earnings ?? 0,
            'total_earnings_aed' => $user->total_referral_earnings_aed,
            'cashback_percentage' => ReferralSetting::getCashbackPercentage(),
            'program_enabled' => ReferralSetting::isProgramEnabled()
        ];
    }

    /**
     * Получить список рефералов пользователя
     */
    public function getUserReferrals(User $user, int $page = 1, int $perPage = 20): array
    {
        $referrals = $user->referrals()
            ->with(['referred', 'transactions'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        $referralsList = $referrals->map(function ($referral) {
            $totalEarned = $referral->transactions()
                ->where('status', 'processed')
                ->sum('cashback_amount');

            return [
                'id' => $referral->id,
                'referred_user' => [
                    'id' => $referral->referred->id,
                    'name' => $referral->referred->name,
                    'email' => $referral->referred->email,
                ],
                'status' => $referral->status,
                'total_earned' => $totalEarned,
                'total_earned_aed' => $totalEarned / 100,
                'registered_at' => $referral->created_at,
                'transactions_count' => $referral->transactions()->count()
            ];
        });

        return [
            'referrals' => $referralsList,
            'pagination' => [
                'current_page' => $referrals->currentPage(),
                'last_page' => $referrals->lastPage(),
                'per_page' => $referrals->perPage(),
                'total' => $referrals->total()
            ]
        ];
    }

    /**
     * Использовать реферальный баланс
     */
    public function useReferralBalance(User $user, int $amountCents, string $reason = 'service_payment'): bool
    {
        try {
            return DB::transaction(function () use ($user, $amountCents, $reason) {
                // Проверяем достаточность средств
                if (!$user->hasReferralBalance($amountCents)) {
                    return false;
                }

                // Списываем средства
                $user->useReferralBalance($amountCents);

                // Логируем операцию
                Log::info("Referral balance used", [
                    'user_id' => $user->id,
                    'amount' => $amountCents,
                    'reason' => $reason,
                    'remaining_balance' => $user->fresh()->referral_balance
                ]);

                return true;
            });

        } catch (Exception $e) {
            Log::error('Error using referral balance', [
                'user_id' => $user->id,
                'amount' => $amountCents,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Валидировать промокод
     */
    public function validateReferralCode(string $code, ?User $excludeUser = null): array
    {
        $referralCode = ReferralCode::findActiveByCode($code);
        
        if (!$referralCode) {
            return [
                'valid' => false,
                'message' => 'Referral code not found or inactive'
            ];
        }

        if ($excludeUser && $referralCode->user_id === $excludeUser->id) {
            return [
                'valid' => false,
                'message' => 'Cannot use your own referral code'
            ];
        }

        if (!ReferralSetting::isProgramEnabled()) {
            return [
                'valid' => false,
                'message' => 'Referral program is temporarily unavailable'
            ];
        }

        return [
            'valid' => true,
            'referrer_name' => $referralCode->user->name,
            'cashback_percentage' => ReferralSetting::getCashbackPercentage()
        ];
    }
}
