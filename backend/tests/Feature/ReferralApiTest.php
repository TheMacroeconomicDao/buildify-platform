<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ReferralCode;
use App\Models\Referral;
use App\Models\ReferralSetting;
use App\Enums\Users\Type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ReferralApiTest extends TestCase
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
            'value' => '15.00',
            'description' => 'Cashback percentage'
        ]);
    }

    public function test_get_referral_stats_endpoint()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'total_referrals_count' => 3,
            'active_referrals_count' => 2,
            'referral_balance' => 1500,
            'total_referral_earnings' => 2500
        ]);
        
        $referralCode = ReferralCode::createForUser($user);
        
        Sanctum::actingAs($user);
        
        $response = $this->getJson('/api/referrals/my-stats');
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'result' => [
                        'referral_code',
                        'total_referrals',
                        'active_referrals',
                        'referral_balance',
                        'referral_balance_aed',
                        'total_earnings',
                        'total_earnings_aed',
                        'cashback_percentage',
                        'program_enabled'
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'result' => [
                        'referral_code' => $referralCode->code,
                        'total_referrals' => 3,
                        'active_referrals' => 2,
                        'referral_balance' => 1500,
                        'referral_balance_aed' => 15.0,
                        'total_earnings' => 2500,
                        'total_earnings_aed' => 25.0,
                        'cashback_percentage' => 15.0,
                        'program_enabled' => true
                    ]
                ]);
    }

    public function test_get_referrals_list_endpoint()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Создаём 3 рефералов
        $referrals = [];
        for ($i = 0; $i < 3; $i++) {
            $referred = User::factory()->create([
                'type' => Type::Executor->value,
                'name' => "Referred User {$i}",
                'email' => "referred{$i}@test.com"
            ]);
            
            $referral = Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
            
            $referrals[] = $referral;
        }
        
        Sanctum::actingAs($referrer);
        
        $response = $this->getJson('/api/referrals/my-referrals');
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'result' => [
                        'referrals' => [
                            '*' => [
                                'id',
                                'referred_user' => [
                                    'id',
                                    'name',
                                    'email'
                                ],
                                'status',
                                'total_earned',
                                'total_earned_aed',
                                'registered_at',
                                'transactions_count'
                            ]
                        ],
                        'pagination' => [
                            'current_page',
                            'last_page',
                            'per_page',
                            'total'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'result' => [
                        'pagination' => [
                            'current_page' => 1,
                            'total' => 3
                        ]
                    ]
                ]);
        
        $responseData = $response->json();
        $this->assertCount(3, $responseData['result']['referrals']);
    }

    public function test_get_my_referral_code_endpoint()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($user);
        
        Sanctum::actingAs($user);
        
        $response = $this->getJson('/api/referrals/my-code');
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'result' => [
                        'code',
                        'is_active',
                        'created_at',
                        'share_url',
                        'share_text'
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'result' => [
                        'code' => $referralCode->code,
                        'is_active' => true
                    ]
                ]);
        
        $responseData = $response->json();
        $this->assertStringContainsString($referralCode->code, $responseData['result']['share_text']);
        $this->assertStringContainsString('referral', $responseData['result']['share_url']);
    }

    public function test_use_referral_balance_endpoint()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 2000 // 20.00 AED
        ]);
        
        Sanctum::actingAs($user);
        
        // Успешное использование
        $response = $this->postJson('/api/referrals/use-balance', [
            'amount' => 5.00,
            'reason' => 'test_payment'
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Referral balance used successfully'
                ])
                ->assertJsonStructure([
                    'result' => [
                        'used_amount',
                        'remaining_balance'
                    ]
                ]);
        
        $user->refresh();
        $this->assertEquals(1500, $user->referral_balance); // 15.00 AED остаётся
        
        // Попытка использовать больше, чем есть
        $response = $this->postJson('/api/referrals/use-balance', [
            'amount' => 20.00
        ]);
        
        $response->assertStatus(400)
                ->assertJson([
                    'success' => false,
                    'message' => 'Insufficient referral balance'
                ]);
    }

    public function test_validate_referral_code_endpoint()
    {
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'name' => 'John Doe'
        ]);
        
        $user = User::factory()->create(['type' => Type::Executor->value]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        
        Sanctum::actingAs($user);
        
        // Валидный код
        $response = $this->postJson('/api/referrals/validate-code', [
            'code' => $referralCode->code
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'result' => [
                        'valid' => true,
                        'referrer_name' => 'John Doe',
                        'cashback_percentage' => 15.0
                    ]
                ]);
        
        // Невалидный код
        $response = $this->postJson('/api/referrals/validate-code', [
            'code' => 'INVALID123'
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => false,
                    'result' => [
                        'valid' => false
                    ]
                ]);
        
        // Собственный код
        Sanctum::actingAs($referrer);
        
        $response = $this->postJson('/api/referrals/validate-code', [
            'code' => $referralCode->code
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => false,
                    'result' => [
                        'valid' => false
                    ]
                ]);
        
        $responseData = $response->json();
        $this->assertStringContainsString('own', $responseData['result']['message']);
    }

    public function test_referral_endpoints_require_authentication()
    {
        // Тестируем без аутентификации
        $endpoints = [
            ['GET', '/api/referrals/my-stats'],
            ['GET', '/api/referrals/my-referrals'],
            ['GET', '/api/referrals/my-code'],
            ['POST', '/api/referrals/use-balance'],
            ['POST', '/api/referrals/validate-code']
        ];
        
        foreach ($endpoints as [$method, $url]) {
            $response = $this->json($method, $url, []);
            $response->assertStatus(401);
        }
    }

    public function test_referral_api_validation()
    {
        $user = User::factory()->create(['type' => Type::Executor->value]);
        Sanctum::actingAs($user);
        
        // Тест валидации use-balance
        $response = $this->postJson('/api/referrals/use-balance', [
            'amount' => -5.00 // Отрицательная сумма
        ]);
        $response->assertStatus(400);
        
        $response = $this->postJson('/api/referrals/use-balance', [
            'amount' => 'invalid' // Не число
        ]);
        $response->assertStatus(400);
        
        // Тест валидации validate-code
        $response = $this->postJson('/api/referrals/validate-code', [
            'code' => '' // Пустой код
        ]);
        $response->assertStatus(400);
        
        $response = $this->postJson('/api/referrals/validate-code', [
            'code' => str_repeat('A', 25) // Слишком длинный код
        ]);
        $response->assertStatus(400);
    }

    public function test_referral_pagination_parameters()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Создаём 50 рефералов для тестирования пагинации
        for ($i = 0; $i < 50; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
        }
        
        Sanctum::actingAs($referrer);
        
        // Тест с разными параметрами пагинации
        $response = $this->getJson('/api/referrals/my-referrals?page=1&per_page=10');
        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertCount(10, $data['result']['referrals']);
        $this->assertEquals(1, $data['result']['pagination']['current_page']);
        $this->assertEquals(10, $data['result']['pagination']['per_page']);
        $this->assertEquals(50, $data['result']['pagination']['total']);
        
        // Вторая страница
        $response = $this->getJson('/api/referrals/my-referrals?page=2&per_page=10');
        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertEquals(2, $data['result']['pagination']['current_page']);
        
        // Тест с невалидными параметрами
        $response = $this->getJson('/api/referrals/my-referrals?page=0');
        $response->assertStatus(400);
        
        $response = $this->getJson('/api/referrals/my-referrals?per_page=150'); // Больше максимума
        $response->assertStatus(400);
    }
}
