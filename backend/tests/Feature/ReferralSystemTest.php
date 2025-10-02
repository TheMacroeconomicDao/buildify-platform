<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ReferralCode;
use App\Models\Referral;
use App\Models\ReferralSetting;
use App\Services\ReferralService;
use App\Enums\Users\Type;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReferralSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Создаём настройки реферальной системы
        ReferralSetting::create([
            'key' => 'program_enabled',
            'value' => 'true',
            'description' => 'Включена ли партнёрская программа'
        ]);
        
        ReferralSetting::create([
            'key' => 'cashback_percentage',
            'value' => '10.00',
            'description' => 'Процент кэшбэка'
        ]);
    }

    /** @test */
    public function referral_code_is_created_for_new_user()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralService = app(ReferralService::class);
        $referralCode = $referralService->createReferralCode($user);
        
        $this->assertNotNull($referralCode);
        $this->assertEquals($user->id, $referralCode->user_id);
        $this->assertTrue($referralCode->is_active);
        $this->assertEquals(8, strlen($referralCode->code));
    }

    /** @test */
    public function referral_registration_creates_referral_relationship()
    {
        // Создаём реферрера
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Создаём нового исполнителя (реферала)
        $newUser = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralService = app(ReferralService::class);
        $referral = $referralService->processReferralRegistration($newUser, $referralCode->code);
        
        $this->assertNotNull($referral);
        $this->assertEquals($referrer->id, $referral->referrer_id);
        $this->assertEquals($newUser->id, $referral->referred_id);
        $this->assertEquals('active', $referral->status);
        
        // Проверяем, что счётчики обновились
        $referrer->refresh();
        $this->assertEquals(1, $referrer->total_referrals_count);
        $this->assertEquals(1, $referrer->active_referrals_count);
    }

    /** @test */
    public function user_cannot_use_own_referral_code()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($user);
        
        $referralService = app(ReferralService::class);
        $referral = $referralService->processReferralRegistration($user, $referralCode->code);
        
        $this->assertNull($referral);
    }

    /** @test */
    public function only_executors_can_be_referrals()
    {
        // Создаём реферрера-исполнителя
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Пытаемся зарегистрировать заказчика по промокоду
        $customer = User::factory()->create(['type' => Type::Customer->value]);
        
        $referralService = app(ReferralService::class);
        $referral = $referralService->processReferralRegistration($customer, $referralCode->code);
        
        $this->assertNull($referral);
    }

    /** @test */
    public function referral_stats_are_calculated_correctly()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'total_referrals_count' => 5,
            'active_referrals_count' => 3,
            'referral_balance' => 1500, // 15.00 AED в центах
            'total_referral_earnings' => 2500 // 25.00 AED в центах
        ]);
        
        $referralCode = ReferralCode::createForUser($user);
        
        $referralService = app(ReferralService::class);
        $stats = $referralService->getReferralStats($user);
        
        $this->assertEquals($referralCode->code, $stats['referral_code']);
        $this->assertEquals(5, $stats['total_referrals']);
        $this->assertEquals(3, $stats['active_referrals']);
        $this->assertEquals(1500, $stats['referral_balance']);
        $this->assertEquals(15.00, $stats['referral_balance_aed']);
        $this->assertEquals(2500, $stats['total_earnings']);
        $this->assertEquals(25.00, $stats['total_earnings_aed']);
        $this->assertEquals(10.0, $stats['cashback_percentage']);
    }

    /** @test */
    public function referral_balance_can_be_used()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 1000 // 10.00 AED
        ]);
        
        $referralService = app(ReferralService::class);
        
        // Используем 5.00 AED (500 центов)
        $success = $referralService->useReferralBalance($user, 500);
        
        $this->assertTrue($success);
        
        $user->refresh();
        $this->assertEquals(500, $user->referral_balance); // Остаётся 5.00 AED
    }

    /** @test */
    public function cannot_use_more_than_available_referral_balance()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 500 // 5.00 AED
        ]);
        
        $referralService = app(ReferralService::class);
        
        // Пытаемся использовать 10.00 AED (1000 центов)
        $success = $referralService->useReferralBalance($user, 1000);
        
        $this->assertFalse($success);
        
        $user->refresh();
        $this->assertEquals(500, $user->referral_balance); // Баланс не изменился
    }
}
