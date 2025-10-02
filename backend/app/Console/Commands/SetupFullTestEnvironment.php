<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SetupFullTestEnvironment extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'setup:full-test-env';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Настроить полное тестовое окружение с пользователями, заказами и файлами';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Настройка полного тестового окружения...');
        $this->info('');

        // Создаем пользователей
        $this->info('👥 Создаем тестовых пользователей...');
        $this->call('create:test-users');
        $this->info('');

        // Создаем заказ
        $this->info('📋 Создаем тестовый заказ...');
        $this->call('create:test-order');
        $this->info('');

        // Настраиваем исполнителя
        $this->info('🔧 Настраиваем категории работ исполнителя...');
        $this->call('setup:test-executor');
        $this->info('');

        // Добавляем файлы
        $this->info('📎 Добавляем тестовые файлы...');
        $this->call('add:test-order-attachments');
        $this->info('');

        // Добавляем изображения
        $this->info('🖼️ Создаем тестовые изображения...');
        $this->call('create:test-svg-images');
        $this->info('');

        // Создаем админа
        $this->info('👨‍💼 Создаем администратора...');
        $this->call('create:test-admin');
        $this->info('');

        // Показываем итоговую информацию
        $this->info('✅ Полное тестовое окружение настроено!');
        $this->info('');
        $this->call('show:test-accounts');
    }
}
