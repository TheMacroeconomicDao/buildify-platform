<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ReferralCode;
use App\Models\Referral;
use App\Models\ReferralSetting;
use App\Models\WalletTransaction;
use App\Services\ReferralService;
use App\Enums\Users\Type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class ReferralPerformanceTest extends TestCase
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

    public function test_referral_code_generation_performance()
    {
        $startTime = microtime(true);
        
        // Генерируем 1000 уникальных кодов
        $codes = [];
        for ($i = 0; $i < 1000; $i++) {
            $code = ReferralCode::generateUniqueCode();
            $codes[] = $code;
        }
        
        $endTime = microtime(true);
        $duration = $endTime - $startTime;
        
        // Проверяем производительность
        $this->assertLessThan(2.0, $duration, 'Generating 1000 codes should take less than 2 seconds');
        
        // Проверяем уникальность
        $uniqueCodes = array_unique($codes);
        $this->assertCount(1000, $uniqueCodes, 'All generated codes should be unique');
    }

    public function test_bulk_referral_creation_performance()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        $startTime = microtime(true);
        
        // Создаём 500 рефералов
        $referrals = [];
        for ($i = 0; $i < 500; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            
            $referral = Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
            
            $referrals[] = $referral;
        }
        
        $endTime = microtime(true);
        $duration = $endTime - $startTime;
        
        $this->assertLessThan(10.0, $duration, 'Creating 500 referrals should take less than 10 seconds');
        $this->assertCount(500, $referrals);
    }

    public function test_referral_stats_query_performance()
    {
        // Подготавливаем данные
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'total_referrals_count' => 100,
            'active_referrals_count' => 80,
            'referral_balance' => 50000,
            'total_referral_earnings' => 75000
        ]);
        
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Создаём много рефералов для нагрузки
        for ($i = 0; $i < 100; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => $i < 80 ? 'active' : 'pending'
            ]);
        }
        
        $referralService = app(ReferralService::class);
        
        // Тестируем производительность загрузки статистики
        $startTime = microtime(true);
        
        for ($i = 0; $i < 10; $i++) {
            $stats = $referralService->getReferralStats($referrer);
        }
        
        $endTime = microtime(true);
        $duration = $endTime - $startTime;
        
        $this->assertLessThan(1.0, $duration, '10 stats requests should take less than 1 second');
    }

    public function test_referral_list_pagination_performance()
    {
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
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
        
        $referralService = app(ReferralService::class);
        
        // Тестируем загрузку разных страниц
        $startTime = microtime(true);
        
        $pages = [1, 5, 10, 20, 50]; // Разные страницы
        foreach ($pages as $page) {
            $result = $referralService->getUserReferrals($referrer, $page, 20);
            $this->assertCount(20, $result['referrals']);
        }
        
        $endTime = microtime(true);
        $duration = $endTime - $startTime;
        
        $this->assertLessThan(2.0, $duration, 'Loading 5 pages should take less than 2 seconds');
    }

    public function test_settings_cache_performance()
    {
        // Очищаем кеш
        Cache::flush();
        
        $startTime = microtime(true);
        
        // Первый запрос - должен загрузиться из БД
        $value1 = ReferralSetting::get('cashback_percentage');
        
        $firstRequestTime = microtime(true) - $startTime;
        
        $startTime = microtime(true);
        
        // Последующие запросы - должны загружаться из кеша
        for ($i = 0; $i < 100; $i++) {
            $value = ReferralSetting::get('cashback_percentage');
        }
        
        $cachedRequestsTime = microtime(true) - $startTime;
        
        $this->assertEquals('10.00', $value1);
        
        // Кешированные запросы должны быть значительно быстрее
        $this->assertLessThan($firstRequestTime * 10, $cachedRequestsTime, 
            'Cached requests should be much faster than first request');
    }

    public function test_concurrent_cashback_processing()
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
        
        $referralService = app(ReferralService::class);
        
        // Создаём множественные транзакции пополнения одновременно
        $transactions = [];
        for ($i = 0; $i < 10; $i++) {
            $transaction = WalletTransaction::create([
                'user_id' => $referred->id,
                'type' => 'deposit',
                'amount' => 1000 + $i, // Разные суммы для уникальности
                'balance_before' => $i * 1000,
                'balance_after' => ($i + 1) * 1000,
                'currency' => 'aed'
            ]);
            
            $transactions[] = $transaction;
        }
        
        $startTime = microtime(true);
        
        // Обрабатываем все транзакции
        foreach ($transactions as $transaction) {
            $referralService->processCashback($transaction);
        }
        
        $endTime = microtime(true);
        $duration = $endTime - $startTime;
        
        $this->assertLessThan(1.0, $duration, 'Processing 10 cashback transactions should take less than 1 second');
        
        // Проверяем корректность результата
        $referrer->refresh();
        $expectedCashback = array_sum(array_map(fn($t) => (int)($t->amount * 0.1), $transactions));
        $this->assertEquals($expectedCashback, $referrer->referral_balance);
    }

    public function test_database_indexes_effectiveness()
    {
        // Создаём много данных для тестирования индексов
        $users = User::factory()->count(100)->create(['type' => Type::Executor->value]);
        
        foreach ($users as $user) {
            ReferralCode::createForUser($user);
        }
        
        // Создаём много реферальных связей
        for ($i = 0; $i < 500; $i++) {
            $referrer = $users->random();
            $referred = $users->where('id', '!=', $referrer->id)->random();
            
            if (!Referral::where('referrer_id', $referrer->id)->where('referred_id', $referred->id)->exists()) {
                Referral::create([
                    'referrer_id' => $referrer->id,
                    'referred_id' => $referred->id,
                    'referral_code_id' => $referrer->referralCode->id,
                    'status' => 'active'
                ]);
            }
        }
        
        $startTime = microtime(true);
        
        // Тестируем запросы, которые должны использовать индексы
        $testQueries = [
            // Поиск по коду (индекс на code)
            fn() => ReferralCode::where('code', $users->first()->referralCode->code)->first(),
            
            // Поиск рефералов по реферреру (индекс на referrer_id)
            fn() => Referral::where('referrer_id', $users->first()->id)->count(),
            
            // Поиск по реферралу (индекс на referred_id)
            fn() => Referral::where('referred_id', $users->last()->id)->first(),
            
            // Поиск активных рефералов
            fn() => Referral::where('status', 'active')->count(),
        ];
        
        foreach ($testQueries as $query) {
            $queryStart = microtime(true);
            $result = $query();
            $queryEnd = microtime(true);
            $queryDuration = $queryEnd - $queryStart;
            
            $this->assertLessThan(0.1, $queryDuration, 'Indexed query should take less than 0.1 seconds');
        }
        
        $endTime = microtime(true);
        $totalDuration = $endTime - $startTime;
        
        $this->assertLessThan(1.0, $totalDuration, 'All index tests should complete in less than 1 second');
    }

    public function test_memory_usage_with_large_datasets()
    {
        $initialMemory = memory_get_usage();
        
        // Создаём большой набор данных
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        for ($i = 0; $i < 1000; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
        }
        
        $afterCreationMemory = memory_get_usage();
        
        // Загружаем данные через сервис
        $referralService = app(ReferralService::class);
        $stats = $referralService->getReferralStats($referrer);
        $list = $referralService->getUserReferrals($referrer, 1, 100);
        
        $finalMemory = memory_get_usage();
        
        // Проверяем, что потребление памяти разумно
        $creationMemoryUsage = $afterCreationMemory - $initialMemory;
        $operationMemoryUsage = $finalMemory - $afterCreationMemory;
        
        $this->assertLessThan(50 * 1024 * 1024, $creationMemoryUsage, 'Data creation should use less than 50MB');
        $this->assertLessThan(10 * 1024 * 1024, $operationMemoryUsage, 'Operations should use less than 10MB additional memory');
        
        // Проверяем корректность данных
        $this->assertEquals(1000, $stats['total_referrals']);
        $this->assertCount(100, $list['referrals']);
    }

    public function test_api_response_time_under_load()
    {
        $user = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 10000
        ]);
        
        $referralCode = ReferralCode::createForUser($user);
        
        // Создаём много рефералов
        for ($i = 0; $i < 100; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            Referral::create([
                'referrer_id' => $user->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
        }
        
        \Laravel\Sanctum\Sanctum::actingAs($user);
        
        // Тестируем время отклика API под нагрузкой
        $endpoints = [
            '/api/referrals/my-stats',
            '/api/referrals/my-referrals',
            '/api/referrals/my-code'
        ];
        
        foreach ($endpoints as $endpoint) {
            $startTime = microtime(true);
            
            $response = $this->getJson($endpoint);
            
            $endTime = microtime(true);
            $duration = $endTime - $startTime;
            
            $response->assertStatus(200);
            $this->assertLessThan(0.5, $duration, "API {$endpoint} should respond in less than 0.5 seconds");
        }
    }

    public function test_database_query_optimization()
    {
        // Включаем логирование запросов
        DB::enableQueryLog();
        
        $referrer = User::factory()->create(['type' => Type::Executor->value]);
        $referralCode = ReferralCode::createForUser($referrer);
        
        // Создаём тестовые данные
        for ($i = 0; $i < 50; $i++) {
            $referred = User::factory()->create(['type' => Type::Executor->value]);
            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $referred->id,
                'referral_code_id' => $referralCode->id,
                'status' => 'active'
            ]);
        }
        
        // Очищаем лог запросов
        DB::flushQueryLog();
        
        $referralService = app(ReferralService::class);
        
        // Загружаем статистику
        $stats = $referralService->getReferralStats($referrer);
        
        $queries = DB::getQueryLog();
        
        // Проверяем количество запросов
        $this->assertLessThanOrEqual(5, count($queries), 
            'Getting referral stats should use 5 or fewer database queries');
        
        // Очищаем лог и тестируем список рефералов
        DB::flushQueryLog();
        
        $list = $referralService->getUserReferrals($referrer, 1, 20);
        
        $queries = DB::getQueryLog();
        
        $this->assertLessThanOrEqual(3, count($queries), 
            'Getting referrals list should use 3 or fewer database queries');
    }

    public function test_cache_effectiveness()
    {
        // Тестируем эффективность кеширования настроек
        Cache::flush();
        
        $startTime = microtime(true);
        
        // Первые запросы - загрузка из БД
        for ($i = 0; $i < 10; $i++) {
            ReferralSetting::get('cashback_percentage');
        }
        
        $uncachedTime = microtime(true) - $startTime;
        
        $startTime = microtime(true);
        
        // Последующие запросы - из кеша
        for ($i = 0; $i < 100; $i++) {
            ReferralSetting::get('cashback_percentage');
        }
        
        $cachedTime = microtime(true) - $startTime;
        
        // Кешированные запросы должны быть быстрее
        $this->assertLessThan($uncachedTime, $cachedTime, 
            'Cached requests should be faster than uncached');
    }

    public function test_referral_validation_performance()
    {
        // Создаём много промокодов для тестирования поиска
        $codes = [];
        for ($i = 0; $i < 1000; $i++) {
            $user = User::factory()->create(['type' => Type::Executor->value]);
            $code = ReferralCode::createForUser($user);
            $codes[] = $code->code;
        }
        
        $referralService = app(ReferralService::class);
        
        $startTime = microtime(true);
        
        // Тестируем валидацию случайных кодов
        for ($i = 0; $i < 100; $i++) {
            $randomCode = $codes[array_rand($codes)];
            $validation = $referralService->validateReferralCode($randomCode);
            $this->assertTrue($validation['valid']);
        }
        
        $endTime = microtime(true);
        $duration = $endTime - $startTime;
        
        $this->assertLessThan(1.0, $duration, 
            'Validating 100 codes should take less than 1 second');
    }

    public function test_bulk_cashback_processing_performance()
    {
        $referrer = User::factory()->create([
            'type' => Type::Executor->value,
            'referral_balance' => 0
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
        
        $startTime = microtime(true);
        
        // Обрабатываем 100 транзакций пополнения
        for ($i = 0; $i < 100; $i++) {
            $transaction = WalletTransaction::create([
                'user_id' => $referred->id,
                'type' => 'deposit',
                'amount' => 1000 + $i,
                'balance_before' => $i * 1000,
                'balance_after' => ($i + 1) * 1000,
                'currency' => 'aed'
            ]);
            
            $referralService->processCashback($transaction);
        }
        
        $endTime = microtime(true);
        $duration = $endTime - $startTime;
        
        $this->assertLessThan(3.0, $duration, 
            'Processing 100 cashback transactions should take less than 3 seconds');
        
        // Проверяем корректность накопления
        $referrer->refresh();
        $this->assertGreaterThan(0, $referrer->referral_balance);
    }

    public function test_referral_system_scalability()
    {
        // Тест масштабируемости с большим количеством пользователей
        $this->markTestSkipped('Scalability test - run manually for performance analysis');
        
        $startTime = microtime(true);
        
        // Создаём 10,000 пользователей
        $users = User::factory()->count(10000)->create(['type' => Type::Executor->value]);
        
        // Создаём промокоды для всех
        foreach ($users as $user) {
            ReferralCode::createForUser($user);
        }
        
        // Создаём случайные реферальные связи
        for ($i = 0; $i < 5000; $i++) {
            $referrer = $users->random();
            $referred = $users->where('id', '!=', $referrer->id)->random();
            
            if (!Referral::where('referrer_id', $referrer->id)->where('referred_id', $referred->id)->exists()) {
                Referral::create([
                    'referrer_id' => $referrer->id,
                    'referred_id' => $referred->id,
                    'referral_code_id' => $referrer->referralCode->id,
                    'status' => 'active'
                ]);
            }
        }
        
        $endTime = microtime(true);
        $setupDuration = $endTime - $startTime;
        
        $this->assertLessThan(60.0, $setupDuration, 
            'Setting up 10k users with referrals should take less than 60 seconds');
        
        // Тестируем операции с большим набором данных
        $referralService = app(ReferralService::class);
        $testUser = $users->first();
        
        $startTime = microtime(true);
        $stats = $referralService->getReferralStats($testUser);
        $statsTime = microtime(true) - $startTime;
        
        $this->assertLessThan(1.0, $statsTime, 
            'Stats loading should be fast even with large dataset');
    }
}
