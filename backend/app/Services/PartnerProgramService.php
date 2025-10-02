<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\Manager;
use App\Models\PartnerReward;
use App\Models\ManagerReward;
use App\Models\User;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PartnerProgramService
{
    /**
     * Обработать регистрацию пользователя через реферальную ссылку
     */
    public function handleUserRegistration(User $user, string $partnerId, array $metadata = []): bool
    {
        try {
            $partner = Partner::where('partner_id', $partnerId)
                ->where('is_active', true)
                ->first();

            if (!$partner) {
                Log::warning('Partner not found or inactive', ['partner_id' => $partnerId]);
                return false;
            }

            // Обновляем пользователя
            $user->update([
                'partner_id' => $partnerId,
                'referred_at' => now(),
                'referral_source' => $metadata['source'] ?? 'direct',
                'referral_metadata' => $metadata,
            ]);

            // Создаем вознаграждение за регистрацию
            $this->createPartnerReward($partner, $user, 'registration', 0, [
                'user_type' => $user->type,
                'registration_source' => $metadata['source'] ?? 'direct',
            ]);

            // Обновляем статистику партнера
            $partner->updateStats();

            // Обновляем статистику менеджера
            if ($partner->manager) {
                $partner->manager->updateStats();
            }

            Log::info('User registered through partner program', [
                'user_id' => $user->id,
                'partner_id' => $partnerId,
                'partner_name' => $partner->name,
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('Failed to handle user registration through partner', [
                'user_id' => $user->id,
                'partner_id' => $partnerId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Обработать первый заказ пользователя
     */
    public function handleFirstOrder(Order $order): bool
    {
        try {
            $user = $order->author;
            
            if (!$user || !$user->partner_id) {
                return false;
            }

            $partner = Partner::where('partner_id', $user->partner_id)
                ->where('is_active', true)
                ->first();

            if (!$partner) {
                return false;
            }

            // Проверяем, что это первый заказ
            $isFirstOrder = Order::where('author_id', $user->id)
                ->where('id', '!=', $order->id)
                ->doesntExist();

            if (!$isFirstOrder) {
                return false;
            }

            // Создаем вознаграждение за первый заказ
            $reward = $this->createPartnerReward($partner, $user, 'first_order', $order->max_amount, [
                'order_id' => $order->id,
                'order_amount' => $order->max_amount,
            ]);

            // Создаем вознаграждение менеджеру
            if ($partner->manager && $reward) {
                $this->createManagerReward($partner->manager, $partner, $reward);
            }

            Log::info('First order processed for partner program', [
                'order_id' => $order->id,
                'user_id' => $user->id,
                'partner_id' => $user->partner_id,
                'amount' => $order->max_amount,
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('Failed to handle first order for partner', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Обработать комиссию с заказа
     */
    public function handleOrderCommission(Order $order, float $commissionAmount): bool
    {
        try {
            $user = $order->author;
            
            if (!$user || !$user->partner_id) {
                return false;
            }

            $partner = Partner::where('partner_id', $user->partner_id)
                ->where('is_active', true)
                ->first();

            if (!$partner) {
                return false;
            }

            // Создаем вознаграждение за комиссию
            $reward = $this->createPartnerReward($partner, $user, 'commission', $commissionAmount, [
                'order_id' => $order->id,
                'commission_amount' => $commissionAmount,
            ]);

            // Создаем вознаграждение менеджеру
            if ($partner->manager && $reward) {
                $this->createManagerReward($partner->manager, $partner, $reward);
            }

            return true;

        } catch (Exception $e) {
            Log::error('Failed to handle order commission for partner', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Обработать пополнение счета
     */
    public function handleTopUp(Transaction $transaction): bool
    {
        try {
            $user = $transaction->user;
            
            if (!$user || !$user->partner_id) {
                return false;
            }

            $partner = Partner::where('partner_id', $user->partner_id)
                ->where('is_active', true)
                ->first();

            if (!$partner) {
                return false;
            }

            // Создаем вознаграждение за пополнение
            $reward = $this->createPartnerReward($partner, $user, 'top_up', $transaction->amount, [
                'transaction_id' => $transaction->id,
                'top_up_amount' => $transaction->amount,
            ]);

            // Создаем вознаграждение менеджеру
            if ($partner->manager && $reward) {
                $this->createManagerReward($partner->manager, $partner, $reward);
            }

            return true;

        } catch (Exception $e) {
            Log::error('Failed to handle top-up for partner', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Создать вознаграждение партнеру
     */
    private function createPartnerReward(Partner $partner, User $user, string $type, float $baseAmount, array $metadata = []): ?PartnerReward
    {
        try {
            // Рассчитываем вознаграждение
            $rewardAmount = $this->calculatePartnerReward($partner, $type, $baseAmount);
            
            if ($rewardAmount <= 0) {
                return null;
            }

            $reward = PartnerReward::create([
                'partner_id' => $partner->id,
                'user_id' => $user->id,
                'order_id' => $metadata['order_id'] ?? null,
                'transaction_id' => $metadata['transaction_id'] ?? null,
                'reward_type' => $type,
                'base_amount' => $baseAmount,
                'reward_rate' => $partner->reward_value,
                'reward_amount' => $rewardAmount,
                'status' => $partner->auto_approve ? 'approved' : 'pending',
                'approved_at' => $partner->auto_approve ? now() : null,
                'metadata' => $metadata,
            ]);

            // Обновляем статистику партнера
            $partner->updateStats();

            Log::info('Partner reward created', [
                'partner_id' => $partner->partner_id,
                'user_id' => $user->id,
                'type' => $type,
                'amount' => $rewardAmount,
            ]);

            return $reward;

        } catch (Exception $e) {
            Log::error('Failed to create partner reward', [
                'partner_id' => $partner->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Создать вознаграждение менеджеру
     */
    private function createManagerReward(Manager $manager, Partner $partner, PartnerReward $partnerReward): ?ManagerReward
    {
        try {
            // Рассчитываем комиссию менеджера
            $commission = $manager->calculateCommission($partnerReward->reward_amount);

            $managerReward = ManagerReward::create([
                'manager_id' => $manager->id,
                'partner_id' => $partner->id,
                'partner_reward_id' => $partnerReward->id,
                'partner_earnings' => $partnerReward->reward_amount,
                'commission_rate' => $commission['base_rate'],
                'commission_amount' => $commission['base_commission'],
                'activity_bonus_rate' => $commission['activity_bonus_rate'],
                'activity_bonus_amount' => $commission['activity_bonus'],
                'total_amount' => $commission['total_commission'],
                'active_partners_count' => $manager->active_partners,
                'total_partners_volume' => $manager->total_partners_earnings,
                'activity_percentage' => $commission['activity_rate'],
                'status' => 'pending',
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
                'calculation_details' => $commission,
            ]);

            // Обновляем статистику менеджера
            $manager->updateStats();

            Log::info('Manager reward created', [
                'manager_id' => $manager->id,
                'partner_id' => $partner->partner_id,
                'amount' => $commission['total_commission'],
            ]);

            return $managerReward;

        } catch (Exception $e) {
            Log::error('Failed to create manager reward', [
                'manager_id' => $manager->id,
                'partner_id' => $partner->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Рассчитать вознаграждение партнера
     */
    private function calculatePartnerReward(Partner $partner, string $type, float $baseAmount): float
    {
        // Проверяем индивидуальные условия
        $conditions = $partner->custom_conditions ?? [];
        
        if (isset($conditions[$type])) {
            $rewardConfig = $conditions[$type];
            
            if ($rewardConfig['type'] === 'fixed') {
                return $rewardConfig['value'];
            } else {
                return $baseAmount * ($rewardConfig['value'] / 100);
            }
        }

        // Используем стандартные условия
        switch ($type) {
            case 'registration':
                return $conditions['registration_bonus'] ?? 50; // 50 AED за регистрацию
                
            case 'first_order':
                return $partner->calculateReward($baseAmount);
                
            case 'commission':
                return $partner->calculateReward($baseAmount);
                
            case 'top_up':
                return $partner->calculateReward($baseAmount);
                
            default:
                return 0;
        }
    }

    /**
     * Одобрить вознаграждение партнера
     */
    public function approvePartnerReward(PartnerReward $reward): bool
    {
        try {
            $reward->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            // Обновляем статистику партнера
            $reward->partner->updateStats();

            Log::info('Partner reward approved', [
                'reward_id' => $reward->id,
                'partner_id' => $reward->partner->partner_id,
                'amount' => $reward->reward_amount,
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('Failed to approve partner reward', [
                'reward_id' => $reward->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Выплатить вознаграждение партнеру
     */
    public function payoutPartnerReward(PartnerReward $reward, string $paymentMethod, array $paymentDetails = []): bool
    {
        try {
            DB::beginTransaction();

            // Если выплата на баланс исполнителя - добавляем бонус 10%
            $finalAmount = $reward->reward_amount;
            
            if ($paymentMethod === 'account_balance' && $reward->partner->user) {
                $finalAmount *= 1.10; // +10% бонус
                
                // Пополняем баланс исполнителя
                $reward->partner->user->increment('wallet_balance', $finalAmount);
                
                $paymentDetails['bonus_applied'] = true;
                $paymentDetails['bonus_amount'] = $finalAmount - $reward->reward_amount;
            }

            $reward->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_method' => $paymentMethod,
                'payment_details' => json_encode(array_merge($paymentDetails, [
                    'original_amount' => $reward->reward_amount,
                    'final_amount' => $finalAmount,
                ])),
            ]);

            // Обновляем статистику партнера
            $reward->partner->updateStats();

            DB::commit();

            Log::info('Partner reward paid out', [
                'reward_id' => $reward->id,
                'partner_id' => $reward->partner->partner_id,
                'amount' => $finalAmount,
                'method' => $paymentMethod,
            ]);

            return true;

        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to payout partner reward', [
                'reward_id' => $reward->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Получить статистику партнера
     */
    public function getPartnerStats(Partner $partner): array
    {
        return [
            'referral_link' => $partner->getReferralLink(),
            'mobile_link' => $partner->getMobileReferralLink(),
            'total_referrals' => $partner->total_referrals,
            'active_referrals' => $partner->active_referrals,
            'total_earnings' => $partner->total_earnings,
            'paid_earnings' => $partner->paid_earnings,
            'pending_earnings' => $partner->pending_earnings,
            'can_withdraw' => $partner->canWithdraw(),
            'min_payout' => $partner->min_payout,
            'recent_referrals' => $partner->referredUsers()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(['id', 'name', 'email', 'type', 'created_at']),
            'recent_rewards' => $partner->rewards()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * Получить статистику менеджера
     */
    public function getManagerStats(Manager $manager): array
    {
        $partners = $manager->partners()->get();
        
        return [
            'total_partners' => $partners->count(),
            'active_partners' => $partners->where('is_active', true)->count(),
            'activity_rate' => $manager->getActivityRate(),
            'total_partners_earnings' => $manager->total_partners_earnings,
            'total_commission' => $manager->total_commission_earned,
            'paid_commission' => $manager->paid_commission,
            'pending_commission' => $manager->pending_commission,
            'current_tier' => $this->getManagerTier($manager),
            'next_tier_progress' => $this->getNextTierProgress($manager),
            'top_partners' => $partners->sortByDesc('total_earnings')->take(5)->values(),
            'recent_rewards' => $manager->rewards()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * Получить текущий уровень менеджера
     */
    private function getManagerTier(Manager $manager): array
    {
        $volume = $manager->total_partners_earnings;
        
        if ($volume >= $manager->tier3_threshold) {
            return [
                'tier' => 3,
                'name' => 'Platinum',
                'rate' => $manager->tier3_commission,
                'threshold' => $manager->tier3_threshold,
            ];
        } elseif ($volume >= $manager->tier2_threshold) {
            return [
                'tier' => 2,
                'name' => 'Gold',
                'rate' => $manager->tier2_commission,
                'threshold' => $manager->tier2_threshold,
            ];
        } else {
            return [
                'tier' => 1,
                'name' => 'Silver',
                'rate' => $manager->base_commission,
                'threshold' => 0,
            ];
        }
    }

    /**
     * Получить прогресс до следующего уровня
     */
    private function getNextTierProgress(Manager $manager): ?array
    {
        $volume = $manager->total_partners_earnings;
        
        if ($volume < $manager->tier2_threshold) {
            $remaining = $manager->tier2_threshold - $volume;
            $progress = ($volume / $manager->tier2_threshold) * 100;
            
            return [
                'next_tier' => 'Gold',
                'next_rate' => $manager->tier2_commission,
                'remaining_amount' => $remaining,
                'progress_percentage' => $progress,
            ];
        } elseif ($volume < $manager->tier3_threshold) {
            $remaining = $manager->tier3_threshold - $volume;
            $progress = (($volume - $manager->tier2_threshold) / ($manager->tier3_threshold - $manager->tier2_threshold)) * 100;
            
            return [
                'next_tier' => 'Platinum',
                'next_rate' => $manager->tier3_commission,
                'remaining_amount' => $remaining,
                'progress_percentage' => $progress,
            ];
        }
        
        return null; // Максимальный уровень
    }

    /**
     * Получить общую аналитику для администратора
     */
    public function getAdminAnalytics(): array
    {
        return [
            'partners_count' => Partner::count(),
            'active_partners_count' => Partner::where('is_active', true)->count(),
            'managers_count' => Manager::count(),
            'active_managers_count' => Manager::where('is_active', true)->count(),
            'total_referrals' => User::whereNotNull('partner_id')->count(),
            'total_partner_earnings' => PartnerReward::where('status', '!=', 'cancelled')->sum('reward_amount'),
            'total_manager_earnings' => ManagerReward::where('status', '!=', 'cancelled')->sum('total_amount'),
            'pending_payouts' => [
                'partners' => PartnerReward::where('status', 'approved')->sum('reward_amount'),
                'managers' => ManagerReward::where('status', 'approved')->sum('total_amount'),
            ],
            'top_partners' => Partner::orderBy('total_earnings', 'desc')->limit(10)->get(),
            'top_managers' => Manager::orderBy('total_commission_earned', 'desc')->limit(10)->get(),
        ];
    }
}
