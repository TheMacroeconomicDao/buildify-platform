<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\HousingOption;

class HousingOptionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $options = [
            // Housing Type
            [
                'type' => 'housing_type',
                'key' => 'apartment',
                'label_en' => 'Apartment',
                'label_ar' => 'شقة',
                'sort_order' => 1,
            ],
            [
                'type' => 'housing_type',
                'key' => 'house',
                'label_en' => 'House / villa',
                'label_ar' => 'منزل / فيلا',
                'sort_order' => 2,
            ],
            [
                'type' => 'housing_type',
                'key' => 'commercial',
                'label_en' => 'Commercial property',
                'label_ar' => 'عقار تجاري',
                'sort_order' => 3,
            ],

            // Housing Condition
            [
                'type' => 'housing_condition',
                'key' => 'new',
                'label_en' => 'New housing',
                'label_ar' => 'مسكن جديد',
                'sort_order' => 1,
            ],
            [
                'type' => 'housing_condition',
                'key' => 'secondary',
                'label_en' => 'Secondary housing',
                'label_ar' => 'مسكن مستعمل',
                'sort_order' => 2,
            ],

            // Housing Preparation Level
            [
                'type' => 'housing_preparation_level',
                'key' => 'without_walls',
                'label_en' => 'Without walls',
                'label_ar' => 'بدون جدران',
                'sort_order' => 1,
            ],
            [
                'type' => 'housing_preparation_level',
                'key' => 'rough_finish',
                'label_en' => 'Rough finish',
                'label_ar' => 'تشطيب خشن',
                'sort_order' => 2,
            ],
            [
                'type' => 'housing_preparation_level',
                'key' => 'finish_finish',
                'label_en' => 'Finish finish',
                'label_ar' => 'تشطيب نهائي',
                'sort_order' => 3,
            ],

            // Bathroom Type
            [
                'type' => 'bathroom_type',
                'key' => 'separate',
                'label_en' => 'Separate',
                'label_ar' => 'منفصل',
                'sort_order' => 1,
            ],
            [
                'type' => 'bathroom_type',
                'key' => 'combined',
                'label_en' => 'Combined',
                'label_ar' => 'مدمج',
                'sort_order' => 2,
            ],
        ];

        foreach ($options as $option) {
            HousingOption::updateOrCreate(
                ['type' => $option['type'], 'key' => $option['key']],
                $option
            );
        }
    }
}
