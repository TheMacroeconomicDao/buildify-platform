<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ReferralCode;
use App\Models\Referral;
use App\Models\ReferralTransaction;
use App\Models\ReferralSetting;
use App\Models\WalletTransaction;
use App\Services\ReferralService;
use App\Services\WalletService;
use App\Enums\Users\Type;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReferralAdvancedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Создаём настройки реферальной системы
        ReferralSetting::create([
            'key' => 'program_enabled',
            'value' => 'true',
            'description' => 'Referral program enabled'
        ]);
        
        ReferralSetting::create([
            'key' => 'cashback_percentage',
            'value' => '10.00',
            'description' => 'Cashback percentage'
        ]);
        
        ReferralSetting::create([
            'key' => 'min_cashback_amount',
            'value' => '100',
            'description' => 'Minimum cashback amount in cents'
        ]);
        
        ReferralSetting::create([
            'key' => 'max_cashback_per_transaction',
            'value' => '5000',
            'description' => 'Maximum cashback per transaction in cents'
        ]);
    }

    public function test_referral_code_generation_is_unique()
    {
        $codes = [];
        for ($i = 0; $i < 100; $i++) {
            $code = ReferralCode::generateUniqueCode();
            $this->assertNotContains($code, $codes, 'Generated duplicate referral code');
            $this->assertEquals(8, strlen($code), 'Referral code should be 8 characters');
            $this->assertMatchesRegularExpression('/^[A-Z0-9]+$/', $code, 'Code should contain only uppercase letters and numbers');
            $codes[] = $code;
        }
    }

    public function test_referral_code_excludes_confusing_characters()
    {
        for ($i = 0; $i < 50; $i++) {
            $code = ReferralCode::generateUniqueCode();
            $this->assertStringNotContainsString('0', $code, 'Code should not contain 0');
            $this->assertStringNotContainsString('O', $code, 'Code should not contain O');
            $this->assertStringNotContainsString('1', $code, 'Code should not contain 1');
            $this->assertStringNotContainsString('I', $code, 'Code should not contain I');
        }
    }

    public function test_cashback_calculation_with_different_percentages()
    {
        $referralService = app(ReferralService::class);
        
        // Тест с разными процентами
        $testCases = [
            ['percentage' => 5.0, 'amount' => 1000, 'expected' => 50],
            ['percentage' => 10.0, 'amount' => 2000, 'expected' => 200],
            ['percentage' => 15.5, 'amount' => 1000, 'expected' => 155],
            ['percentage' => 25.0, 'amount' => 500, 'expected' => 125],
        ];

        foreach ($testCases as $case) {
            ReferralSetting::set('cashback_percentage', $case['percentage']);
            
            $calculated = $this->invokePrivateMethod(
                $referralService, 
                'calculateCashback', 
                [$case['amount'], $case['percentage']]
            );
            
            $this->assertEquals($case['expected'], $calculated, 
                "Cashback calculation failed for {$case['percentage']}% of {$case['amount']} cents");
        }
    }

    public function test_cashback_respects_maximum_limit()
    {
        // Устанавливаем максимальный кэшбэк 50 AED (5000 центов)
        ReferralSetting::set('max_cashback_per_transaction', '5000');
        ReferralSetting::set('cashback_percentage', '10.0');
        
        // Создаём реферральную связь
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        // Создаём большое пополнение (100 AED = 10000 центов)
        // Кэшбэк должен быть 10% = 1000 центов, но лимит 5000 центов
        $walletTransaction = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 100000, // 1000 AED
            'balance_before' => 0,
            'balance_after' => 100000,
            'currency' => 'aed'
        ]);
        
        $referralService = app(ReferralService::class);
        $referralTransaction = $referralService->processCashback($walletTransaction);
        
        $this->assertNotNull($referralTransaction);
        $this->assertEquals(5000, $referralTransaction->cashback_amount, 'Cashback should be limited to maximum');
    }

    public function test_cashback_respects_minimum_amount()
    {
        // Устанавливаем минимальную сумму для кэшбэка 1 AED (100 центов)
        ReferralSetting::set('min_cashback_amount', '100');
        ReferralSetting::set('cashback_percentage', '10.0');
        
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        // Создаём маленькое пополнение (0.50 AED = 50 центов)
        // Кэшбэк будет 10% = 5 центов, что меньше минимума в 100 центов
        $walletTransaction = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 50,
            'balance_before' => 0,
            'balance_after' => 50,
            'currency' => 'aed'
        ]);
        
        $referralService = app(ReferralService::class);
        $referralTransaction = $referralService->processCashback($walletTransaction);
        
        $this->assertNull($referralTransaction, 'No cashback should be given for amounts below minimum');
    }

    public function test_multiple_referrals_from_same_user()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Создаём 3 рефералов
        $referrals = [];
        for ($i = 0; $i < 3; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            $referralService = app(ReferralService::class);
            $referral = $referralService->processReferralRegistration($referred, $referralCode->code);
            $referrals[] = $referral;
        }
        
        $referrer->refresh();
        
        $this->assertEquals(3, $referrer->total_referrals_count);
        $this->assertEquals(3, $referrer->active_referrals_count);
        $this->assertCount(3, $referrals);
        
        foreach ($referrals as $referral) {
            $this->assertEquals('active', $referral->status);
            $this->assertEquals($referrer->id, $referral->referrer_id);
        }
    }

    public function test_cashback_accumulation_from_multiple_transactions()
    {
        ReferralSetting::set('cashback_percentage', '10.0');
        
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 0,
            'total_referral_earnings' => 0
        ]);
        
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        $referralService = app(ReferralService::class);
        
        // Первое пополнение: 10 AED = 1000 центов, кэшбэк 100 центов
        $transaction1 = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 1000,
            'balance_before' => 0,
            'balance_after' => 1000,
            'currency' => 'aed'
        ]);
        
        $referralService->processCashback($transaction1);
        
        // Второе пополнение: 20 AED = 2000 центов, кэшбэк 200 центов
        $transaction2 = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 2000,
            'balance_before' => 1000,
            'balance_after' => 3000,
            'currency' => 'aed'
        ]);
        
        $referralService->processCashback($transaction2);
        
        $referrer->refresh();
        
        // Проверяем накопление кэшбэка
        $this->assertEquals(300, $referrer->referral_balance); // 100 + 200 центов
        $this->assertEquals(300, $referrer->total_referral_earnings);
    }

    public function test_referral_balance_usage()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 1500 // 15.00 AED
        ]);
        
        $referralService = app(ReferralService::class);
        
        // Используем 5.00 AED (500 центов)
        $success = $referralService->useReferralBalance($user, 500, 'subscription_payment');
        $this->assertTrue($success);
        
        $user->refresh();
        $this->assertEquals(1000, $user->referral_balance); // Остаётся 10.00 AED
        
        // Пытаемся использовать больше, чем есть
        $success = $referralService->useReferralBalance($user, 1500);
        $this->assertFalse($success);
        
        $user->refresh();
        $this->assertEquals(1000, $user->referral_balance); // Баланс не изменился
    }

    public function test_referral_code_validation_scenarios()
    {
        $referralService = app(ReferralService::class);
        
        $user1 = User::factory()->create(['type' => Type::Executor->value]);
        $user2 = User::factory()->create(['type' => Type::Executor->value]);
        
        $code1 = ReferralCode::createForUser($user1);
        
        // Валидный код
        $validation = $referralService->validateReferralCode($code1->code);
        $this->assertTrue($validation['valid']);
        $this->assertEquals($user1->name, $validation['referrer_name']);
        
        // Собственный код
        $validation = $referralService->validateReferralCode($code1->code, $user1);
        $this->assertFalse($validation['valid']);
        $this->assertStringContainsString('own', $validation['message']);
        
        // Несуществующий код
        $validation = $referralService->validateReferralCode('INVALID123');
        $this->assertFalse($validation['valid']);
        $this->assertStringContainsString('not found', $validation['message']);
        
        // Неактивный код
        $code1->update(['is_active' => false]);
        $validation = $referralService->validateReferralCode($code1->code, $user2);
        $this->assertFalse($validation['valid']);
    }

    public function test_referral_program_can_be_disabled()
    {
        // Отключаем программу
        ReferralSetting::set('program_enabled', 'false');
        
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        
        $referralService = app(ReferralService::class);
        
        // Попытка создать реферала
        $referral = $referralService->processReferralRegistration($referred, $referralCode->code);
        $this->assertNull($referral, 'No referral should be created when program is disabled');
        
        // Попытка валидации
        $validation = $referralService->validateReferralCode($referralCode->code);
        $this->assertFalse($validation['valid']);
        $this->assertStringContainsString('unavailable', $validation['message']);
    }

    public function test_referral_stats_calculation()
    {
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'total_referrals_count' => 5,
            'active_referrals_count' => 3,
            'referral_balance' => 2500, // 25.00 AED
            'total_referral_earnings' => 5000 // 50.00 AED
        ]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        
        $referralService = app(ReferralService::class);
        $stats = $referralService->getReferralStats($referrer);
        
        $this->assertEquals($referralCode->code, $stats['referral_code']);
        $this->assertEquals(5, $stats['total_referrals']);
        $this->assertEquals(3, $stats['active_referrals']);
        $this->assertEquals(2500, $stats['referral_balance']);
        $this->assertEquals(25.00, $stats['referral_balance_aed']);
        $this->assertEquals(5000, $stats['total_earnings']);
        $this->assertEquals(50.00, $stats['total_earnings_aed']);
        $this->assertEquals(10.0, $stats['cashback_percentage']);
        $this->assertTrue($stats['program_enabled']);
    }

    public function test_referral_list_with_pagination()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Создаём 25 рефералов
        $referrals = [];
        for ($i = 0; $i < 25; $i++) {
            $referred = User::factory()->create([
                'type' => Type::Executor->value,
                'name' => "Referral User {$i}"
            ]);
            
            $referral = Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
            
            $referrals[] = $referral;
        }
        
        $referralService = app(ReferralService::class);
        
        // Первая страница (20 элементов)
        $page1 = $referralService->getUserReferrals($referrer, 1, 20);
        $this->assertCount(20, $page1['referrals']);
        $this->assertEquals(1, $page1['pagination']['current_page']);
        $this->assertEquals(2, $page1['pagination']['last_page']);
        $this->assertEquals(25, $page1['pagination']['total']);
        
        // Вторая страница (5 элементов)
        $page2 = $referralService->getUserReferrals($referrer, 2, 20);
        $this->assertCount(5, $page2['referrals']);
        $this->assertEquals(2, $page2['pagination']['current_page']);
    }

    public function test_only_deposit_transactions_trigger_cashback()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        $referralService = app(ReferralService::class);
        
        // Тест различных типов транзакций
        $transactionTypes = ['charge', 'refund', 'admin_adjustment', 'withdrawal'];
        
        foreach ($transactionTypes as $type) {
            $transaction = WalletTransaction::create([
                'user_id' => $referred->id,
                'type' => $type,
                'amount' => 1000,
                'balance_before' => 1000,
                'balance_after' => 2000,
                'currency' => 'aed'
            ]);
            
            $referralTransaction = $referralService->processCashback($transaction);
            $this->assertNull($referralTransaction, "No cashback should be given for {$type} transactions");
        }
        
        // Только deposit должен давать кэшбэк
        $depositTransaction = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 1000,
            'balance_before' => 2000,
            'balance_after' => 3000,
            'currency' => 'aed'
        ]);
        
        $referralTransaction = $referralService->processCashback($depositTransaction);
        $this->assertNotNull($referralTransaction, 'Cashback should be given for deposit transactions');
    }

    public function test_referral_relationship_cancellation()
    {
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'active_referrals_count' => 1
        ]);
        
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        // Отменяем связь
        $success = $referral->cancel();
        $this->assertTrue($success);
        
        $referral->refresh();
        $referrer->refresh();
        
        $this->assertEquals('cancelled', $referral->status);
        $this->assertEquals(0, $referrer->active_referrals_count);
        
        // Повторная отмена не должна работать
        $success = $referral->cancel();
        $this->assertFalse($success);
    }

    public function test_referral_transaction_processing()
    {
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 0,
            'total_referral_earnings' => 0
        ]);
        
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        $walletTransaction = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 1000,
            'balance_before' => 0,
            'balance_after' => 1000,
            'currency' => 'aed'
        ]);
        
        $referralTransaction = ReferralTransaction::create([
            'referral_id' => $referral->id,
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'wallet_transaction_id' => $walletTransaction->id,
            'cashback_amount' => 100,
            'cashback_percentage' => 10.0,
            'status' => 'pending'
        ]);
        
        // Обрабатываем транзакцию
        $success = $referralTransaction->process();
        $this->assertTrue($success);
        
        $referralTransaction->refresh();
        $referrer->refresh();
        
        $this->assertEquals('processed', $referralTransaction->status);
        $this->assertNotNull($referralTransaction->processed_at);
        $this->assertEquals(100, $referrer->referral_balance);
        $this->assertEquals(100, $referrer->total_referral_earnings);
        
        // Повторная обработка не должна работать
        $success = $referralTransaction->process();
        $this->assertFalse($success);
    }

    public function test_referral_settings_caching()
    {
        // Создаём настройку
        ReferralSetting::set('test_setting', 'test_value', 'Test setting');
        
        // Первый запрос (должен кешироваться)
        $value1 = ReferralSetting::get('test_setting');
        $this->assertEquals('test_value', $value1);
        
        // Изменяем в БД напрямую (минуя кеш)
        \DB::table('referral_settings')
            ->where('key', 'test_setting')
            ->update(['value' => 'updated_value']);
        
        // Значение должно остаться кешированным
        $value2 = ReferralSetting::get('test_setting');
        $this->assertEquals('test_value', $value2);
        
        // Очищаем кеш
        ReferralSetting::clearCache();
        
        // Теперь должно загрузиться новое значение
        $value3 = ReferralSetting::get('test_setting');
        $this->assertEquals('updated_value', $value3);
    }

    public function test_edge_case_zero_amount_transactions()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        // Транзакция с нулевой суммой
        $zeroTransaction = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 0,
            'balance_before' => 1000,
            'balance_after' => 1000,
            'currency' => 'aed'
        ]);
        
        $referralService = app(ReferralService::class);
        $referralTransaction = $referralService->processCashback($zeroTransaction);
        
        $this->assertNull($referralTransaction, 'No cashback should be given for zero amount transactions');
    }

    /**
     * Вспомогательный метод для вызова приватных методов в тестах
     */
    private function invokePrivateMethod($object, $methodName, array $parameters = [])
    {
        $reflection = new \ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        
        return $method->invokeArgs($object, $parameters);
    }
}
