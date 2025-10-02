<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateTestAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:test-admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Создать тестового администратора';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            User::createAdmin(
                'Тестовый Админ',
                'admin@test.com',
                'Admin123!'
            );

            $this->info('✅ Тестовый администратор создан:');
            $this->info('');
            $this->info('👨‍💼 АДМИНИСТРАТОР:');
            $this->info('Email: admin@test.com');
            $this->info('Password: Admin123!');
            $this->info('');
            $this->info('🔗 Админка доступна по адресу: /admin');
            $this->info('💡 Можно верифицировать исполнителей и управлять заказами');

        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'User exists')) {
                $this->info('ℹ️ Администратор уже существует:');
                $this->info('Email: admin@test.com');
                $this->info('Password: Admin123!');
            } else {
                $this->error('❌ Ошибка при создании администратора: ' . $e->getMessage());
            }
        }
    }
}
