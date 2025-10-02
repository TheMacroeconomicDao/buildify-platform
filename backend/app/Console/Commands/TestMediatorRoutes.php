<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Enums\Users\Type;

class TestMediatorRoutes extends Command
{
    protected $signature = 'admin:test-mediator-routes';
    protected $description = 'Тестировать маршруты посредников';

    public function handle()
    {
        $this->info('🔍 ТЕСТИРОВАНИЕ МАРШРУТОВ ПОСРЕДНИКОВ');
        $this->info('');

        // Проверяем количество посредников
        $mediatorsCount = User::where('type', Type::Mediator->value)->count();
        $this->info("📊 Всего посредников в базе: {$mediatorsCount}");

        if ($mediatorsCount > 0) {
            $mediator = User::where('type', Type::Mediator->value)->first();
            $this->info("✅ Первый посредник: {$mediator->name} (ID: {$mediator->id})");
            
            // Тестируем URL генерацию
            try {
                $editUrl = route('platform.systems.mediators.edit', $mediator);
                $this->info("🔗 URL редактирования: {$editUrl}");
            } catch (\Exception $e) {
                $this->error("❌ Ошибка генерации URL: " . $e->getMessage());
            }
        } else {
            $this->warn("⚠️ Посредников в базе нет");
        }

        // Проверяем маршруты
        $this->info('');
        $this->info('🛣️ ПРОВЕРКА МАРШРУТОВ:');
        
        try {
            $listUrl = route('platform.systems.mediators');
            $this->info("✅ Список посредников: {$listUrl}");
        } catch (\Exception $e) {
            $this->error("❌ Ошибка маршрута списка: " . $e->getMessage());
        }

        try {
            $createUrl = route('platform.systems.mediators.create');
            $this->info("✅ Создание посредника: {$createUrl}");
        } catch (\Exception $e) {
            $this->error("❌ Ошибка маршрута создания: " . $e->getMessage());
        }

        // Создаем тестового посредника если их нет
        if ($mediatorsCount === 0) {
            $this->info('');
            $this->info('🛠️ СОЗДАНИЕ ТЕСТОВОГО ПОСРЕДНИКА...');
            
            $testMediator = User::create([
                'name' => 'Тестовый Посредник',
                'email' => 'mediator@test.com',
                'phone' => '+971501234567',
                'password' => bcrypt('password'),
                'type' => Type::Mediator->value,
                'status' => 0,
                'verification_status' => 3,
                'wallet_balance' => 0.00,
                'wallet_currency' => 'AED',
            ]);

            $this->info("✅ Создан тестовый посредник: {$testMediator->name} (ID: {$testMediator->id})");
            
            try {
                $editUrl = route('platform.systems.mediators.edit', $testMediator);
                $this->info("🔗 URL редактирования: {$editUrl}");
            } catch (\Exception $e) {
                $this->error("❌ Ошибка генерации URL: " . $e->getMessage());
            }
        }

        $this->info('');
        $this->info('🌐 Откройте админку: http://localhost:8000/admin');
        $this->info('📋 Перейдите в раздел "Посредники"');
    }
}
