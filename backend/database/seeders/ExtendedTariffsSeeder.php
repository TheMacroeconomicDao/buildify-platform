<?php

namespace Database\Seeders;

use App\Models\Tariff;
use Illuminate\Database\Seeder;

class ExtendedTariffsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tariffs = [
            // Базовые тарифы
            [
                'name' => 'Starter',
                'duration_days' => 7,
                'max_orders' => 3,
                'max_contacts' => 5,
                'price' => 25.00,
                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Basic',
                'duration_days' => 30,
                'max_orders' => 10,
                'max_contacts' => 20,
                'price' => 99.00,

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Professional',
                'duration_days' => 30,
                'max_orders' => 25,
                'max_contacts' => 50,
                'price' => 199.00,

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Premium',
                'duration_days' => 30,
                'max_orders' => 50,
                'max_contacts' => 100,
                'price' => 349.00,

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            
            // Квартальные тарифы (со скидкой)
            [
                'name' => 'Basic Quarterly',
                'duration_days' => 90,
                'max_orders' => 35, // ~12 в месяц
                'max_contacts' => 70, // ~23 в месяц
                'price' => 249.00, // Скидка ~15%

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Professional Quarterly',
                'duration_days' => 90,
                'max_orders' => 80, // ~27 в месяц
                'max_contacts' => 160, // ~53 в месяц
                'price' => 499.00, // Скидка ~15%

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Premium Quarterly',
                'duration_days' => 90,
                'max_orders' => 160, // ~53 в месяц
                'max_contacts' => 320, // ~107 в месяц
                'price' => 899.00, // Скидка ~15%

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            
            // Годовые тарифы (с большой скидкой)
            [
                'name' => 'Basic Annual',
                'duration_days' => 365,
                'max_orders' => 130, // ~11 в месяц
                'max_contacts' => 260, // ~22 в месяц
                'price' => 799.00, // Скидка ~33%

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Professional Annual',
                'duration_days' => 365,
                'max_orders' => 320, // ~27 в месяц
                'max_contacts' => 640, // ~53 в месяц
                'price' => 1599.00, // Скидка ~33%

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Premium Annual',
                'duration_days' => 365,
                'max_orders' => 650, // ~54 в месяц
                'max_contacts' => 1300, // ~108 в месяц
                'price' => 2799.00, // Скидка ~33%

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            
            // Специальные тарифы
            [
                'name' => 'Enterprise',
                'duration_days' => 30,
                'max_orders' => 100,
                'max_contacts' => 200,
                'price' => 599.00,

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Weekend',
                'duration_days' => 7,
                'max_orders' => 5,
                'max_contacts' => 10,
                'price' => 49.00,

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'Trial Plus',
                'duration_days' => 14,
                'max_orders' => 5,
                'max_contacts' => 10,
                'price' => 0.00,

                'is_active' => true,
                'is_test' => true,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            
            // Промо тарифы (неактивные для будущего использования)
            [
                'name' => 'Black Friday',
                'duration_days' => 30,
                'max_orders' => 25,
                'max_contacts' => 50,
                'price' => 99.00,

                'is_active' => false, // Неактивный до акции
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'New Year Special',
                'duration_days' => 60,
                'max_orders' => 40,
                'max_contacts' => 80,
                'price' => 149.00,

                'is_active' => false, // Неактивный до акции
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            
            // VIP тарифы
            [
                'name' => 'VIP Monthly',
                'duration_days' => 30,
                'max_orders' => 999, // Практически безлимитно
                'max_contacts' => 999,
                'price' => 999.00,

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
            [
                'name' => 'VIP Annual',
                'duration_days' => 365,
                'max_orders' => 999,
                'max_contacts' => 999,
                'price' => 7999.00,

                'is_active' => true,
                'is_test' => false,
                'stripe_product_id' => null,
                'stripe_price_id' => null,
            ],
        ];

        foreach ($tariffs as $tariffData) {
            Tariff::firstOrCreate(
                ['name' => $tariffData['name']],
                $tariffData
            );
        }

        $this->command->info('Extended tariffs created successfully!');
        $this->command->info('Created ' . count($tariffs) . ' tariff options');
        
        // Показываем созданные тарифы
        $this->command->table(
            ['Name', 'Duration (days)', 'Max Orders', 'Max Contacts', 'Price (AED)', 'Active'],
            collect($tariffs)->map(function ($tariff) {
                return [
                    $tariff['name'],
                    $tariff['duration_days'],
                    $tariff['max_orders'],
                    $tariff['max_contacts'],
                    number_format($tariff['price'], 2),
                    $tariff['is_active'] ? '✅' : '❌'
                ];
            })->toArray()
        );
    }
}
