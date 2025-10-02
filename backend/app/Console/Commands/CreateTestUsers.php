<?php

namespace App\Console\Commands;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateTestUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:test-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Создать тестовых пользователей (заказчика и исполнителя)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Создаем тестового заказчика
        $customer = User::updateOrCreate([
            'email' => 'customer@test.com'
        ], [
            'name' => 'Тестовый Заказчик',
            'email' => 'customer@test.com',
            'password' => Hash::make('Test123!'),
            'phone' => '+971501234567',
            'type' => Type::Customer->value,
            'status' => Status::Active->value,
            'verification_status' => VerificationStatus::NotRequired->value,
            'email_verified_at' => now(),
            'birth_date' => '1990-01-01',
        ]);

        // Создаем тестового исполнителя
        $executor = User::updateOrCreate([
            'email' => 'executor@test.com'
        ], [
            'name' => 'Тестовый Исполнитель',
            'email' => 'executor@test.com',
            'password' => Hash::make('Test123!'),
            'phone' => '+971507654321',
            'type' => Type::Executor->value,
            'status' => Status::Active->value,
            'verification_status' => VerificationStatus::Approved->value, // Сразу верифицируем
            'verified_at' => now(),
            'email_verified_at' => now(),
            'birth_date' => '1985-05-15',
            'about_me' => 'Опытный мастер по ремонту квартир. Выполняю все виды отделочных работ.',
            'work_experience' => 5,
            'average_rating' => 4.8,
            'reviews_count' => 12,
        ]);

        $this->info('✅ Тестовые пользователи созданы:');
        $this->info('');
        $this->info('📧 ЗАКАЗЧИК:');
        $this->info('Email: customer@test.com');
        $this->info('Password: Test123!');
        $this->info('Тип: Заказчик');
        $this->info('');
        $this->info('🔨 ИСПОЛНИТЕЛЬ:');
        $this->info('Email: executor@test.com');
        $this->info('Password: Test123!');
        $this->info('Тип: Исполнитель (верифицирован)');
        $this->info('Рейтинг: 4.8 (12 отзывов)');
        $this->info('');
        $this->info('💡 Теперь можно создать тестовый заказ командой: php artisan create:test-order');
    }
}
