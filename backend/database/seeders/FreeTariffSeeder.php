<?php

namespace Database\Seeders;

use App\Models\Tariff;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FreeTariffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Создаем бесплатный тариф, если его еще нет
        Tariff::firstOrCreate(
            ['name' => 'Free'],
            [
                'name' => 'Free',
                'stripe_product_id' => null, // Для бесплатного тарифа не нужен Stripe
                'stripe_price_id' => null,   // Для бесплатного тарифа не нужен Stripe
                'duration_days' => 0,        // Бесрочно
                'max_orders' => 1,           // 1 заказ

                'max_contacts' => 1,         // 1 контакт
                'price' => 0.00,            // Бесплатно
                'is_active' => true,
            ]
        );
    }
}
