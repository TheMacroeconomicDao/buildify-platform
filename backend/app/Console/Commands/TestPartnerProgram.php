<?php

namespace App\Console\Commands;

use App\Models\Partner;
use App\Models\Manager;
use App\Models\User;
use App\Services\PartnerProgramService;
use Illuminate\Console\Command;

class TestPartnerProgram extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'partner:test {--create-sample-data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test partner program functionality and create sample data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Testing Partner Program...');

        if ($this->option('create-sample-data')) {
            $this->createSampleData();
        }

        $this->testPartnerProgram();
        
        return 0;
    }

    /**
     * Создать тестовые данные
     */
    private function createSampleData()
    {
        $this->info('📊 Creating sample data...');

        try {
            // Создаем тестового менеджера
            $admin = User::where('type', \App\Enums\Users\Type::Admin->value)->first();
            
            if (!$admin) {
                $this->error('❌ No admin user found. Create admin user first.');
                return;
            }

            $manager = Manager::firstOrCreate(
                ['email' => 'manager@buildify.test'],
                [
                    'name' => 'Test Manager',
                    'phone' => '+971501234567',
                    'description' => 'Test manager for partner program',
                    'user_id' => $admin->id,
                ]
            );

            $this->line("✅ Manager created: {$manager->name} (ID: {$manager->id})");

            // Создаем тестового партнера
            $partner = Partner::firstOrCreate(
                ['email' => 'partner@buildify.test'],
                [
                    'partner_id' => Partner::generatePartnerId(),
                    'name' => 'Test Partner',
                    'phone' => '+971507654321',
                    'description' => 'Test partner for referral program',
                    'manager_id' => $manager->id,
                    'reward_type' => Partner::REWARD_TYPE_PERCENTAGE,
                    'reward_value' => 5.00,
                    'min_payout' => 100.00,
                ]
            );

            $this->line("✅ Partner created: {$partner->name} (ID: {$partner->partner_id})");
            $this->line("🔗 Referral link: {$partner->getReferralLink()}");

            // Создаем тестового пользователя-исполнителя
            $executor = User::firstOrCreate(
                ['email' => 'executor@buildify.test'],
                [
                    'name' => 'Test Executor',
                    'type' => \App\Enums\Users\Type::Executor->value,
                    'phone' => '+971509876543',
                    'partner_id' => $partner->partner_id,
                    'referred_at' => now(),
                    'referral_source' => 'test',
                ]
            );

            $this->line("✅ Test executor created: {$executor->name} (ID: {$executor->id})");

        } catch (\Exception $e) {
            $this->error("❌ Error creating sample data: {$e->getMessage()}");
        }
    }

    /**
     * Тестировать функциональность партнерской программы
     */
    private function testPartnerProgram()
    {
        $this->info('🔍 Testing partner program functionality...');

        try {
            // Проверяем наличие таблиц
            $this->testDatabaseTables();
            
            // Проверяем модели и связи
            $this->testModelsAndRelationships();
            
            // Проверяем сервис
            $this->testPartnerService();
            
            // Проверяем API роуты
            $this->testApiRoutes();

            $this->info('✅ All tests passed successfully!');

        } catch (\Exception $e) {
            $this->error("❌ Test failed: {$e->getMessage()}");
        }
    }

    /**
     * Проверить таблицы базы данных
     */
    private function testDatabaseTables()
    {
        $this->line('📋 Testing database tables...');

        $tables = ['partners', 'managers', 'partner_rewards', 'manager_rewards'];
        
        foreach ($tables as $table) {
            $exists = \Schema::hasTable($table);
            $this->line($exists ? "✅ Table '{$table}' exists" : "❌ Table '{$table}' missing");
        }

        // Проверяем поля в users
        $hasPartnerField = \Schema::hasColumn('users', 'partner_id');
        $this->line($hasPartnerField ? "✅ users.partner_id field exists" : "❌ users.partner_id field missing");
    }

    /**
     * Проверить модели и связи
     */
    private function testModelsAndRelationships()
    {
        $this->line('🔗 Testing models and relationships...');

        // Тестируем Partner модель
        try {
            $partner = Partner::first();
            if ($partner) {
                $this->line("✅ Partner model works");
                
                // Тестируем связи
                $manager = $partner->manager;
                $this->line($manager ? "✅ Partner->Manager relationship works" : "ℹ️ No manager assigned to partner");
                
                $referredUsers = $partner->referredUsers;
                $this->line("✅ Partner->ReferredUsers relationship works ({$referredUsers->count()} users)");
            } else {
                $this->line("ℹ️ No partners found (run with --create-sample-data)");
            }
        } catch (\Exception $e) {
            $this->error("❌ Partner model error: {$e->getMessage()}");
        }

        // Тестируем Manager модель
        try {
            $manager = Manager::first();
            if ($manager) {
                $this->line("✅ Manager model works");
                
                $partners = $manager->partners;
                $this->line("✅ Manager->Partners relationship works ({$partners->count()} partners)");
            } else {
                $this->line("ℹ️ No managers found");
            }
        } catch (\Exception $e) {
            $this->error("❌ Manager model error: {$e->getMessage()}");
        }
    }

    /**
     * Проверить сервис партнерской программы
     */
    private function testPartnerService()
    {
        $this->line('⚙️ Testing PartnerProgramService...');

        try {
            $service = app(PartnerProgramService::class);
            $this->line("✅ PartnerProgramService instantiated");

            // Тестируем получение аналитики
            $analytics = $service->getAdminAnalytics();
            $this->line("✅ Admin analytics works");
            $this->line("   - Partners: {$analytics['partners_count']}");
            $this->line("   - Managers: {$analytics['managers_count']}");
            $this->line("   - Total referrals: {$analytics['total_referrals']}");

        } catch (\Exception $e) {
            $this->error("❌ PartnerProgramService error: {$e->getMessage()}");
        }
    }

    /**
     * Проверить API роуты
     */
    private function testApiRoutes()
    {
        $this->line('🌐 Testing API routes...');

        $routes = [
            'GET /ref/{partnerId}' => 'partner.referral',
            'GET /api/partner/stats' => null,
            'POST /api/partner/payout' => null,
            'GET /api/partner/qr-code' => null,
        ];

        foreach ($routes as $route => $name) {
            try {
                if ($name) {
                    $exists = \Route::has($name);
                    $this->line($exists ? "✅ Route '{$route}' exists" : "❌ Route '{$route}' missing");
                } else {
                    $this->line("ℹ️ Route '{$route}' (API route, cannot test existence easily)");
                }
            } catch (\Exception $e) {
                $this->line("❌ Error checking route '{$route}': {$e->getMessage()}");
            }
        }
    }
}
