<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Создаем тестового заказчика
        User::firstOrCreate(
            ['email' => 'customer@test.com'],
            [
                'name' => 'Тестовый Заказчик',
                'email' => 'customer@test.com',
                'password' => Hash::make('Test123!'),
                'type' => 1, // Заказчик
                'phone' => '+971501234567',
                'status' => 1, // Активный
                'email_verified_at' => now(),
            ]
        );

        // Создаем тестового исполнителя
        User::firstOrCreate(
            ['email' => 'executor@test.com'],
            [
                'name' => 'Тестовый Исполнитель',
                'email' => 'executor@test.com',
                'password' => Hash::make('Test123!'),
                'type' => 0, // Исполнитель
                'phone' => '+971501234568',
                'status' => 1, // Активный
                'verification_status' => 2, // Верифицирован
                'email_verified_at' => now(),
            ]
        );

        // Создаем тестового посредника
        User::firstOrCreate(
            ['email' => 'mediator@test.com'],
            [
                'name' => 'Тестовый Посредник',
                'email' => 'mediator@test.com',
                'password' => Hash::make('Test123!'),
                'type' => 2, // Посредник
                'phone' => '+971501234569',
                'status' => 1, // Активный
                'verification_status' => 2, // Верифицирован
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Test users created successfully!');
    }
}
