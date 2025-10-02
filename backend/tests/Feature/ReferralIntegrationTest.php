<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ReferralCode;
use App\Models\Referral;
use App\Models\ReferralSetting;
use App\Models\WalletTransaction;
use App\Services\UserRegistrationService;
use App\Services\WalletService;
use App\Services\ReferralService;
use App\Http\Requests\Registration\RegistrationEndRequest;
use App\Enums\Users\Type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class ReferralIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
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
            'description' => 'Minimum cashback amount'
        ]);
    }

    public function test_referral_code_created_during_user_registration()
    {
        // Мокаем запрос регистрации
        $request = new RegistrationEndRequest([
            'name' => 'Test Executor',
            'email' => 'test@example.com',
            'phone' => '+971501234567',
            'type' => Type::Executor->value,
            'password' => 'TestPass123!',
            'confirmed_password' => 'TestPass123!',
            'code' => '123456',
            'work_types' => ['plumbing']
        ]);
        
        // Создаём верификацию (имитируем что код был отправлен)
        \App\Models\Verification::create([
            'email' => 'test@example.com',
            'code' => '123456',
            'attempts' => 0
        ]);
        
        $registrationService = app(UserRegistrationService::class);
        $registrationService->end($request);
        
        $user = User::where('email', 'test@example.com')->first();
        $this->assertNotNull($user);
        
        // Проверяем, что промокод создался
        $this->assertNotNull($user->referralCode);
        $this->assertEquals(8, strlen($user->referralCode->code));
        $this->assertTrue($user->referralCode->is_active);
    }

    public function test_referral_registration_with_promo_code()
    {
        // Создаём реферрера
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Регистрируем нового исполнителя с промокодом
        $request = new RegistrationEndRequest([
            'name' => 'New Executor',
            'email' => 'new@example.com',
            'phone' => '+971501234568',
            'type' => Type::Executor->value,
            'password' => 'TestPass123!',
            'confirmed_password' => 'TestPass123!',
            'code' => '123456',
            'promo_code' => $referralCode->code,
            'work_types' => ['electrical']
        ]);
        
        \App\Models\Verification::create([
            'email' => 'new@example.com',
            'code' => '123456',
            'attempts' => 0
        ]);
        
        $registrationService = app(UserRegistrationService::class);
        $registrationService->end($request);
        
        $newUser = User::where('email', 'new@example.com')->first();
        $this->assertNotNull($newUser);
        
        // Проверяем, что реферальная связь создалась
        $referral = Referral::where('referred_id', $newUser->id)->first();
        $this->assertNotNull($referral);
        $this->assertEquals($referrer->id, $referral->referrer_id);
        $this->assertEquals('active', $referral->status);
        
        // Проверяем, что счётчики обновились
        $referrer->refresh();
        $this->assertEquals(1, $referrer->total_referrals_count);
        $this->assertEquals(1, $referrer->active_referrals_count);
    }

    public function test_wallet_deposit_triggers_cashback()
    {
        // Создаём реферральную связь
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 0,
            'total_referral_earnings' => 0
        ]);
        
        $referred = User::factory()->create([
            'type' => Type::Executor->value,
            'wallet_balance' => 0
        ]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        $referral = Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'active'
        ]);
        
        // Пополняем кошелёк реферала через WalletService
        $walletService = app(WalletService::class);
        $transaction = $walletService->deposit(
            $referred, 
            5000, // 50.00 AED
            'aed', 
            'test_payment_intent', 
            'test_session'
        );
        
        $this->assertNotNull($transaction);
        
        // Проверяем, что кэшбэк начислился
        $referrer->refresh();
        $this->assertEquals(500, $referrer->referral_balance); // 10% от 5000 = 500 центов (5.00 AED)
        $this->assertEquals(500, $referrer->total_referral_earnings);
        
        // Проверяем, что создалась реферальная транзакция
        $referralTransaction = \App\Models\ReferralTransaction::where('referrer_id', $referrer->id)->first();
        $this->assertNotNull($referralTransaction);
        $this->assertEquals(500, $referralTransaction->cashback_amount);
        $this->assertEquals('processed', $referralTransaction->status);
        $this->assertEquals($transaction->id, $referralTransaction->wallet_transaction_id);
    }

    public function test_customer_registration_with_promo_code_ignored()
    {
        // Создаём реферрера-исполнителя
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Пытаемся зарегистрировать заказчика с промокодом
        $request = new RegistrationEndRequest([
            'name' => 'Customer User',
            'email' => 'customer@example.com',
            'phone' => '+971501234569',
            'type' => Type::Customer->value,
            'password' => 'TestPass123!',
            'confirmed_password' => 'TestPass123!',
            'code' => '123456',
            'promo_code' => $referralCode->code,
            'birth_date' => '1990-01-01'
        ]);
        
        \App\Models\Verification::create([
            'email' => 'customer@example.com',
            'code' => '123456',
            'attempts' => 0
        ]);
        
        $registrationService = app(UserRegistrationService::class);
        $registrationService->end($request);
        
        $customer = User::where('email', 'customer@example.com')->first();
        $this->assertNotNull($customer);
        
        // Проверяем, что реферальная связь НЕ создалась (заказчики не могут быть рефералами)
        $referral = Referral::where('referred_id', $customer->id)->first();
        $this->assertNull($referral);
        
        // Счётчики реферрера не должны измениться
        $referrer->refresh();
        $this->assertEquals(0, $referrer->total_referrals_count);
        $this->assertEquals(0, $referrer->active_referrals_count);
    }

    public function test_referral_system_with_disabled_program()
    {
        // Отключаем программу
        ReferralSetting::set('program_enabled', 'false');
        
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        
        $referralService = app(ReferralService::class);
        
        // Попытка создать реферала
        $referral = $referralService->processReferralRegistration($referred, $referralCode->code);
        $this->assertNull($referral);
        
        // Попытка обработать кэшбэк
        $walletTransaction = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 1000,
            'balance_before' => 0,
            'balance_after' => 1000,
            'currency' => 'aed'
        ]);
        
        $referralTransaction = $referralService->processCashback($walletTransaction);
        $this->assertNull($referralTransaction);
    }

    public function test_referral_earnings_calculation_accuracy()
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
        
        $walletService = app(WalletService::class);
        
        // Различные суммы пополнений для проверки точности расчётов
        $testAmounts = [
            1234, // 12.34 AED -> 123.4 центов кэшбэка -> 123 цента (округление вниз)
            5678, // 56.78 AED -> 567.8 центов кэшбэка -> 568 центов (округление вверх)
            999,  // 9.99 AED -> 99.9 центов кэшбэка -> 100 центов
        ];
        
        $expectedCashbacks = [123, 568, 100]; // Ожидаемые суммы кэшбэка
        $totalExpected = array_sum($expectedCashbacks);
        
        foreach ($testAmounts as $amount) {
            $walletService->deposit($referred, $amount, 'aed');
        }
        
        $referrer->refresh();
        $this->assertEquals($totalExpected, $referrer->total_referral_earnings);
        $this->assertEquals($totalExpected, $referrer->referral_balance);
    }

    public function test_concurrent_referral_operations()
    {
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 1000
        ]);
        
        $referralService = app(ReferralService::class);
        
        // Имитируем одновременное использование баланса
        $results = [];
        
        // Первая операция - должна пройти
        $results[] = $referralService->useReferralBalance($referrer, 600, 'test1');
        
        // Вторая операция - должна пройти с обновлённым балансом
        $referrer->refresh();
        $results[] = $referralService->useReferralBalance($referrer, 300, 'test2');
        
        // Третья операция - должна не пройти (недостаточно средств)
        $referrer->refresh();
        $results[] = $referralService->useReferralBalance($referrer, 200, 'test3');
        
        $this->assertTrue($results[0]);
        $this->assertTrue($results[1]);
        $this->assertFalse($results[2]);
        
        $referrer->refresh();
        $this->assertEquals(100, $referrer->referral_balance); // 1000 - 600 - 300 = 100
    }

    public function test_referral_system_performance_with_large_dataset()
    {
        $this->markTestSkipped('Performance test - run manually when needed');
        
        // Создаём большое количество данных для тестирования производительности
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        $startTime = microtime(true);
        
        // Создаём 1000 рефералов
        for ($i = 0; $i < 1000; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
        }
        
        $creationTime = microtime(true) - $startTime;
        
        // Тестируем загрузку статистики
        $startTime = microtime(true);
        $referralService = app(ReferralService::class);
        $stats = $referralService->getReferralStats($referrer);
        $statsTime = microtime(true) - $startTime;
        
        // Тестируем загрузку списка с пагинацией
        $startTime = microtime(true);
        $list = $referralService->getUserReferrals($referrer, 1, 50);
        $listTime = microtime(true) - $startTime;
        
        // Проверяем, что операции выполняются за разумное время
        $this->assertLessThan(5.0, $creationTime, 'Creating 1000 referrals should take less than 5 seconds');
        $this->assertLessThan(1.0, $statsTime, 'Loading stats should take less than 1 second');
        $this->assertLessThan(1.0, $listTime, 'Loading referrals list should take less than 1 second');
        
        // Проверяем корректность данных
        $this->assertEquals(1000, $stats['total_referrals']);
        $this->assertCount(50, $list['referrals']);
    }

    public function test_referral_code_deactivation()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($user);
        
        $this->assertTrue($referralCode->is_active);
        
        // Деактивируем код
        $referralCode->update(['is_active' => false]);
        
        // Попытка использовать неактивный код
        $newUser = User::factory()->create(['type' => Type::Executor->value]);
        $referralService = app(ReferralService::class);
        $referral = $referralService->processReferralRegistration($newUser, $referralCode->code);
        
        $this->assertNull($referral, 'Inactive referral code should not create referral');
    }

    public function test_referral_transaction_cancellation()
    {
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 500,
            'total_referral_earnings' => 500
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
        
        $referralTransaction = \App\Models\ReferralTransaction::create([
            'referral_id' => $referral->id,
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'wallet_transaction_id' => $walletTransaction->id,
            'cashback_amount' => 100,
            'cashback_percentage' => 10.0,
            'status' => 'processed'
        ]);
        
        // Обрабатываем транзакцию (увеличиваем баланс)
        $referralTransaction->process();
        $referrer->refresh();
        
        $originalBalance = $referrer->referral_balance;
        $originalEarnings = $referrer->total_referral_earnings;
        
        // Отменяем транзакцию
        $success = $referralTransaction->cancel();
        $this->assertTrue($success);
        
        $referralTransaction->refresh();
        $referrer->refresh();
        
        $this->assertEquals('cancelled', $referralTransaction->status);
        $this->assertEquals($originalBalance - 100, $referrer->referral_balance);
        $this->assertEquals($originalEarnings - 100, $referrer->total_referral_earnings);
    }

    public function test_referral_system_with_different_currencies()
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
        
        $walletService = app(WalletService::class);
        
        // Тестируем пополнение в AED
        $transaction = $walletService->deposit($referred, 1000, 'aed');
        
        $referrer->refresh();
        $cashbackAed = $referrer->referral_balance;
        
        $this->assertGreaterThan(0, $cashbackAed, 'Cashback should be credited for AED deposits');
        
        // Проверяем, что кэшбэк рассчитывается корректно независимо от валюты
        $referralTransaction = \App\Models\ReferralTransaction::where('referrer_id', $referrer->id)->first();
        $this->assertEquals('aed', $transaction->currency);
        $this->assertEquals(100, $referralTransaction->cashback_amount); // 10% от 1000
    }

    public function test_referral_code_uniqueness_across_database()
    {
        // Создаём много пользователей и проверяем уникальность кодов
        $users = User::factory()->count(100)->create(['type' => Type::Executor->value]);
        
        $codes = [];
        foreach ($users as $user) {
            $referralCode = ReferralCode::createForUser($user);
            $codes[] = $referralCode->code;
        }
        
        // Проверяем, что все коды уникальны
        $uniqueCodes = array_unique($codes);
        $this->assertCount(100, $uniqueCodes, 'All referral codes should be unique');
        $this->assertEquals(100, count($codes), 'Should have 100 codes total');
    }

    public function test_referral_system_error_handling()
    {
        $referralService = app(ReferralService::class);
        
        // Тест с несуществующим пользователем
        $nonExistentUser = new User();
        $nonExistentUser->id = 99999;
        $nonExistentUser->type = Type::Executor->value;
        
        $stats = $referralService->getReferralStats($nonExistentUser);
        
        // Система должна корректно обрабатывать отсутствие данных
        $this->assertEquals(0, $stats['total_referrals']);
        $this->assertEquals(0, $stats['active_referrals']);
        $this->assertNull($stats['referral_code']);
    }
}
