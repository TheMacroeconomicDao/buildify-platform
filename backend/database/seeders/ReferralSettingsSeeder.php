<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReferralSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'cashback_percentage',
                'value' => '10.00',
                'description' => 'Cashback percentage from referral top-ups',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'min_cashback_amount',
                'value' => '100',
                'description' => 'Minimum top-up amount for cashback (in cents)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_cashback_per_transaction',
                'value' => '10000',
                'description' => 'Maximum cashback per single transaction (in cents)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'referral_active_days',
                'value' => '365',
                'description' => 'Number of days the referral relationship remains active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'program_enabled',
                'value' => 'true',
                'description' => 'Whether the referral program is enabled',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('referral_settings')->insertOrIgnore($settings);
    }
}
