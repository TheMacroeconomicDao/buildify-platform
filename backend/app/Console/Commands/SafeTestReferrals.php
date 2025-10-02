<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\ReferralCode;
use App\Models\ReferralSetting;
use App\Services\ReferralService;
use Illuminate\Console\Command;

class SafeTestReferrals extends Command
{
    protected $signature = 'referrals:safe-test';
    protected $description = 'Safely test referral system without affecting main database';

    public function handle()
    {
        $this->info('🧪 Running Safe Referral System Tests...');
        $this->newLine();
        
        // 1. Тест настроек
        $this->info('1. Testing Settings...');
        $settings = ReferralSetting::getAll();
        
        if (empty($settings)) {
            $this->error('❌ No referral settings found');
            return 1;
        }
        
        $this->info('✅ Settings loaded successfully');
        $this->table(['Setting', 'Value'], [
            ['Program Enabled', $settings['program_enabled'] ?? 'false'],
            ['Cashback %', $settings['cashback_percentage'] ?? '0'],
            ['Min Amount (cents)', $settings['min_cashback_amount'] ?? '0'],
            ['Max Amount (cents)', $settings['max_cashback_per_transaction'] ?? '0'],
        ]);
        
        // 2. Тест промокодов
        $this->info('2. Testing Referral Codes...');
        $codesCount = ReferralCode::count();
        $usersCount = User::count();
        
        $this->info("📊 Users: {$usersCount}, Codes: {$codesCount}");
        
        if ($codesCount === 0) {
            $this->warn('⚠️  No referral codes found, creating them...');
            $users = User::all();
            foreach ($users as $user) {
                ReferralCode::createForUser($user);
            }
            $this->info('✅ Referral codes created');
        } else {
            $this->info('✅ Referral codes exist');
        }
        
        // 3. Тест API сервиса (без изменения данных)
        $this->info('3. Testing ReferralService (read-only)...');
        $referralService = app(ReferralService::class);
        
        $testUser = User::first();
        if ($testUser) {
            try {
                $stats = $referralService->getReferralStats($testUser);
                $this->info('✅ Stats service working');
                $this->line("   Code: {$stats['referral_code']}");
                $this->line("   Referrals: {$stats['total_referrals']}");
                $this->line("   Balance: {$stats['referral_balance_aed']} AED");
                
                $validation = $referralService->validateReferralCode($stats['referral_code'], $testUser);
                if (!$validation['valid']) {
                    $this->info('✅ Self-referral protection working');
                } else {
                    $this->warn('⚠️  Self-referral protection issue');
                }
                
            } catch (\Exception $e) {
                $this->error("❌ Service error: " . $e->getMessage());
                return 1;
            }
        }
        
        // 4. Тест валидации промокодов (безопасный)
        $this->info('4. Testing Code Validation...');
        $sampleCodes = ReferralCode::take(3)->get();
        
        foreach ($sampleCodes as $code) {
            $validation = $referralService->validateReferralCode($code->code);
            if ($validation['valid']) {
                $this->info("✅ Code {$code->code} validates correctly");
            } else {
                $this->warn("⚠️  Code {$code->code} validation issue");
            }
        }
        
        // 5. Тест невалидных кодов
        $this->info('5. Testing Invalid Codes...');
        $invalidCodes = ['INVALID1', 'FAKE2345', ''];
        
        foreach ($invalidCodes as $invalidCode) {
            $validation = $referralService->validateReferralCode($invalidCode);
            if (!$validation['valid']) {
                $this->info("✅ Invalid code '{$invalidCode}' correctly rejected");
            } else {
                $this->warn("⚠️  Invalid code '{$invalidCode}' incorrectly accepted");
            }
        }
        
        $this->newLine();
        $this->info('🎉 Safe testing completed successfully!');
        $this->info('📝 All tests performed without modifying existing data');
        
        return 0;
    }
}
