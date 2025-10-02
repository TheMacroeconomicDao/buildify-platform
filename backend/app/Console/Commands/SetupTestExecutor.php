<?php

namespace App\Console\Commands;

use App\Enums\Users\Type;
use App\Models\User;
use App\Models\UserWork;
use Illuminate\Console\Command;

class SetupTestExecutor extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'setup:test-executor';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Настроить категории работ для тестового исполнителя';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Находим тестового исполнителя
        $executor = User::where('email', 'executor@test.com')
            ->where('type', Type::Executor->value)
            ->first();

        if (!$executor) {
            $this->error('❌ Тестовый исполнитель не найден. Сначала выполните: php artisan create:test-users');
            return;
        }

        // Удаляем старые категории если есть
        UserWork::where('user_id', $executor->id)->delete();

        // Добавляем категории работ
        $workCategories = [
            ['direction' => 'repair', 'type' => 'repair'], // Общий ремонт
            ['direction' => 'repair', 'type' => 'full_repair'], // Ремонт под ключ
            ['direction' => 'construction', 'type' => 'construction'], // Строительство
            ['direction' => 'plumbing', 'type' => 'plumbing'], // Сантехника
            ['direction' => 'electrical', 'type' => 'electrical'], // Электрика
        ];

        foreach ($workCategories as $category) {
            UserWork::create([
                'user_id' => $executor->id,
                'direction' => $category['direction'],
                'type' => $category['type'],
            ]);
        }

        $this->info('✅ Категории работ добавлены исполнителю:');
        $this->info('');
        $this->info('🔨 ИСПОЛНИТЕЛЬ: ' . $executor->name);
        $this->info('📧 Email: ' . $executor->email);
        $this->info('');
        $this->info('🏗️ КАТЕГОРИИ РАБОТ:');
        foreach ($workCategories as $category) {
            $this->info('- ' . $category['direction'] . ' / ' . $category['type']);
        }
        $this->info('');
        $this->info('✅ Теперь исполнитель может откликаться на заказы этих категорий!');
    }
}
