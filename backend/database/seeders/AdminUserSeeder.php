<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Создаем тестового администратора
        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Администратор',
                'email' => 'admin@test.com',
                'password' => Hash::make('Admin123!'),
                'type' => 99, // Администратор
                'phone' => '+971501234560',
                'status' => 1, // Активный
                'verification_status' => 2, // Верифицирован
                'email_verified_at' => now(),
            ]
        );

        // Даем администратору все права в системе Orchid
        $admin->permissions = [
            // Основные права платформы
            'platform.index' => 1,
            'platform.systems.roles' => 1,
            'platform.systems.users' => 1,
            'platform.systems.attachment' => 1,
            
            // Права управления системой
            'platform.systems.banners' => 1,
            'platform.systems.customers' => 1,
            'platform.systems.executors' => 1,
            'platform.systems.mediators' => 1,
            'platform.systems.orders' => 1,
            'platform.systems.orders.responses' => 1,
            'platform.systems.subscriptions' => 1,
            'platform.systems.wallets' => 1,
            'platform.systems.payments' => 1,
            'platform.systems.complaints' => 1,
            'platform.systems.licenses' => 1,
            'platform.systems.analytics' => 1,
            'platform.systems.notifications' => 1,
            'platform.systems.reports' => 1,
            'platform.systems.work-directions' => 1,
            'platform.systems.work-types' => 1,
            'platform.users.manage' => 1,
        ];
        $admin->save();

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin@test.com');
        $this->command->info('Password: Admin123!');
    }
}
