<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestTariffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Создаем тестовую подписку за $0 для проверки функционала
        \App\Models\Tariff::firstOrCreate(
            ['name' => 'Test'],
            [
                'name' => 'Test',
                'stripe_product_id' => null, // Для тестовой подписки не нужен Stripe
                'stripe_price_id' => null,   // Для тестовой подписки не нужен Stripe
                'duration_days' => 30,       // 30 дней для тестирования
                'max_orders' => 10,          // Достаточно для тестирования
                'max_contacts' => 20,        // Достаточно для тестирования
                'price' => 0.00,            // $0 - бесплатно, но не Free тариф
                'is_active' => true,
                'is_test' => true,          // Помечаем как тестовую
            ]
        );
    }
}
