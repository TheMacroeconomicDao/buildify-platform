<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RecalculateReferralStats extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'referrals:recalculate-stats';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate referral statistics for all users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting referral stats recalculation...');

        $users = \App\Models\User::all();
        $updated = 0;

        foreach ($users as $user) {
            // Подсчитываем рефералов для этого пользователя
            $totalReferrals = \App\Models\Referral::where('referrer_id', $user->id)->count();
            $activeReferrals = \App\Models\Referral::where('referrer_id', $user->id)
                ->where('status', 'active')
                ->count();

            // Подсчитываем заработок от рефералов
            $totalEarnings = \App\Models\ReferralTransaction::where('referrer_id', $user->id)
                ->where('status', 'completed')
                ->sum('cashback_amount');

            // Обновляем счетчики если они изменились
            if ($user->total_referrals_count != $totalReferrals || 
                $user->active_referrals_count != $activeReferrals ||
                $user->total_referral_earnings != $totalEarnings) {
                
                $user->update([
                    'total_referrals_count' => $totalReferrals,
                    'active_referrals_count' => $activeReferrals,
                    'total_referral_earnings' => $totalEarnings,
                ]);

                $updated++;
                $this->info("Updated user {$user->id} ({$user->email}): {$totalReferrals} total, {$activeReferrals} active");
            }
        }

        $this->info("Recalculation completed. Updated {$updated} users.");
        return 0;
    }
}
