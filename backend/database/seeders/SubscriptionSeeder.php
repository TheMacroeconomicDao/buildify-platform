<?php
// database/seeders/SubscriptionSeeder.php

namespace Database\Seeders;

use App\Models\Tariff;
use Illuminate\Database\Seeder;

class SubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        Tariff::create([
            'name' => 'Базовый',
            'duration_days' => 30,
            'max_orders' => 5,

            'max_contacts' => 10,
            'price' => 990.00,
            'is_active' => true
        ]);

        Tariff::create([
            'name' => 'Профессиональный',
            'duration_days' => 30,
            'max_orders' => 15,

            'max_contacts' => 30,
            'price' => 2990.00,
            'is_active' => true
        ]);

        Tariff::create([
            'name' => 'Премиум',
            'duration_days' => 30,
            'max_orders' => 30,

            'max_contacts' => 60,
            'price' => 5990.00,
            'is_active' => true
        ]);
    }
}
