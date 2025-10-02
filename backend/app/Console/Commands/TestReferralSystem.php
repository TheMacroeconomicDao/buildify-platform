<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\ReferralCode;
use App\Models\ReferralSetting;
use App\Services\ReferralService;
use Illuminate\Console\Command;

class TestReferralSystem extends Command
{
    protected $signature = 'referrals:test';
    protected $description = 'Test referral system functionality';

    public function handle()
    {
        $this->info('Testing Referral System...');
        
        // 1. Проверяем настройки
        $this->info('1. Checking settings...');
        $settings = ReferralSetting::getAll();
        $this->table(['Setting', 'Value'], [
            ['Program Enabled', $settings['program_enabled'] ?? 'false'],
            ['Cashback %', $settings['cashback_percentage'] ?? '0'],
            ['Min Amount', $settings['min_cashback_amount'] ?? '0'],
            ['Max Amount', $settings['max_cashback_per_transaction'] ?? '0'],
        ]);
        
        // 2. Проверяем промокоды
        $this->info('2. Checking referral codes...');
        $codesCount = ReferralCode::count();
        $usersCount = User::count();
        $this->line("Referral codes: {$codesCount}");
        $this->line("Total users: {$usersCount}");
        
        if ($codesCount < $usersCount) {
            $this->warn("Some users don't have referral codes!");
        } else {
            $this->info("✅ All users have referral codes");
        }
        
        // 3. Показываем примеры промокодов
        $this->info('3. Sample referral codes:');
        $codes = ReferralCode::with('user')->take(5)->get();
        $codeData = $codes->map(function($code) {
            return [
                $code->user->name,
                $code->user->email,
                $code->code,
                $code->is_active ? 'Active' : 'Inactive'
            ];
        })->toArray();
        
        $this->table(['User', 'Email', 'Code', 'Status'], $codeData);
        
        // 4. Тест API
        $this->info('4. Testing ReferralService...');
        $referralService = app(ReferralService::class);
        
        $testUser = User::first();
        if ($testUser) {
            $stats = $referralService->getReferralStats($testUser);
            $this->line("✅ Stats loaded for user: {$testUser->name}");
            $this->line("   - Referral code: {$stats['referral_code']}");
            $this->line("   - Total referrals: {$stats['total_referrals']}");
            $this->line("   - Cashback %: {$stats['cashback_percentage']}");
        }
        
        $this->info('✅ Referral System Test Complete!');
        
        return 0;
    }
}
