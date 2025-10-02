<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Enums\Users\Status;
use App\Enums\Users\Type;

class CheckUserStatuses extends Command
{
    protected $signature = 'admin:check-user-statuses';
    protected $description = 'Проверить статусы пользователей';

    public function handle()
    {
        $this->info('🔍 ПРОВЕРКА СТАТУСОВ ПОЛЬЗОВАТЕЛЕЙ');
        $this->info('');

        // Показываем доступные статусы
        $this->info('📋 ДОСТУПНЫЕ СТАТУСЫ:');
        $this->info('• Active (0) - Активный');
        $this->info('• Inactive (1) - Неактивный');
        $this->info('• Deleted (2) - Удаленный');
        $this->info('');

        // Проверяем посредников
        $mediators = User::where('type', Type::Mediator->value)->get();
        $this->info("👥 ПОСРЕДНИКИ ({$mediators->count()}):");
        
        foreach ($mediators as $mediator) {
            $statusName = Status::from($mediator->status)->name;
            $statusValue = $mediator->status;
            $this->info("• {$mediator->name} (ID: {$mediator->id}) - Статус: {$statusName} ({$statusValue})");
        }

        if ($mediators->isEmpty()) {
            $this->warn('⚠️ Посредников не найдено');
        }

        $this->info('');
        $this->info('✅ Проверка завершена');
    }
}
