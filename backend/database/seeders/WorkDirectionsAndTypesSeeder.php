<?php

namespace Database\Seeders;

use App\Models\WorkDirection;
use App\Models\WorkType;
use Illuminate\Database\Seeder;

class WorkDirectionsAndTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Данные из config/work.php
        $workData = [
            'repair_and_construction' => [
                'name' => [
                    'en' => 'Repair and construction',
                    'ar' => 'الإصلاح والبناء',
                ],
                'description' => 'All types of repair and construction work',
                'icon' => 'hammer',
                'types' => [
                    'turnkey_renovation' => ['en' => 'Turnkey renovation', 'ar' => 'تجديد تسليم مفتاح'],
                    'renovation_of_one_room' => ['en' => 'Renovation of one room', 'ar' => 'تجديد غرفة واحدة'],
                    'bathroom_renovation' => ['en' => 'Bathroom renovation', 'ar' => 'تجديد الحمام'],
                    'handyman_by_hour' => ['en' => 'Handyman by the hour', 'ar' => 'عامل ماهر بالساعة'],
                    'ceilings' => ['en' => 'Ceilings', 'ar' => 'الأسقف'],
                    'floors' => ['en' => 'Floors', 'ar' => 'الأرضيات'],
                    'tiling' => ['en' => 'Tiling', 'ar' => 'البلاط'],
                    'furniture_assembly_and_repair' => ['en' => 'Furniture assembly and repair', 'ar' => 'تجميع وإصلاح الأثاث'],
                    'installation_and_repair_of_doors_locks' => ['en' => 'Installation and repair of doors, locks', 'ar' => 'تركيب وإصلاح الأبواب والأقفال'],
                    'windows_glazing_balconies' => ['en' => 'Windows, glazing, balconies', 'ar' => 'النوافذ والزجاج والشرفات'],
                    'roofing_and_facade_works' => ['en' => 'Roofing and facade works', 'ar' => 'أعمال الأسقف والواجهات'],
                    'heating_water_supply_sewerage' => ['en' => 'Heating, water supply, sewerage', 'ar' => 'التدفئة وإمدادات المياه والصرف الصحي'],
                    'insulation_works' => ['en' => 'Insulation works', 'ar' => 'أعمال العزل'],
                    'building_and_assembly_works' => ['en' => 'Building and assembly works', 'ar' => 'أعمال البناء والتجميع'],
                    'large_scale_construction' => ['en' => 'Large-scale construction', 'ar' => 'البناء واسع النطاق'],
                    'security_systems' => ['en' => 'Security systems', 'ar' => 'أنظمة الأمان'],
                    'lock_opening' => ['en' => 'Lock opening', 'ar' => 'فتح الأقفال'],
                    'finishing_works' => ['en' => 'Finishing works', 'ar' => 'أعمال التشطيب'],
                    'plumbing_works' => ['en' => 'Plumbing works', 'ar' => 'أعمال السباكة'],
                    'electrical_works' => ['en' => 'Electrical works', 'ar' => 'الأعمال الكهربائية'],
                    'repair_and_maintenance_of_air_conditioners' => ['en' => 'Repair and maintenance of air conditioners', 'ar' => 'إصلاح وصيانة مكيفات الهواء'],
                    'other_repair_and_construction' => ['en' => 'Other repair and construction', 'ar' => 'إصلاح وبناء أخرى'],
                ]
            ],
            'interior_design' => [
                'name' => [
                    'en' => 'Interior design',
                    'ar' => 'التصميم الداخلي',
                ],
                'description' => 'Interior design services',
                'icon' => 'palette',
                'types' => [
                    'interior_design' => ['en' => 'Interior design', 'ar' => 'التصميم الداخلي'],
                ]
            ],
            'architecture_interior_landscape' => [
                'name' => [
                    'en' => 'Architecture, interior, landscape',
                    'ar' => 'الهندسة المعمارية والداخلية والمناظر الطبيعية',
                ],
                'description' => 'Architecture and landscape design',
                'icon' => 'building',
                'types' => [
                    'architecture_interior_landscape' => ['en' => 'Architecture, interior, landscape', 'ar' => 'الهندسة المعمارية والداخلية والمناظر الطبيعية'],
                ]
            ],
            'cleaning' => [
                'name' => [
                    'en' => 'Cleaning',
                    'ar' => 'التنظيف',
                ],
                'description' => 'All types of cleaning services',
                'icon' => 'broom',
                'types' => [
                    'maintenance_cleaning' => ['en' => 'Maintenance cleaning', 'ar' => 'تنظيف الصيانة'],
                    'general_cleaning' => ['en' => 'General cleaning', 'ar' => 'التنظيف العام'],
                    'window_washing' => ['en' => 'Window washing', 'ar' => 'غسيل النوافذ'],
                    'taking_out_trash' => ['en' => 'Taking out trash', 'ar' => 'إخراج القمامة'],
                    'ironing' => ['en' => 'Ironing', 'ar' => 'الكي'],
                    'dry_cleaning' => ['en' => 'Dry cleaning', 'ar' => 'التنظيف الجاف'],
                    'work_in_garden_vegetable_garden_allotment' => ['en' => 'Work in garden, vegetable garden, allotment', 'ar' => 'العمل في الحديقة وحديقة الخضروات والمخصصات'],
                    'other_cleaning' => ['en' => 'Other cleaning', 'ar' => 'تنظيف أخرى'],
                ]
            ]
        ];

        $sortOrder = 1;
        foreach ($workData as $directionKey => $directionData) {
            // Создаем направление работ
            $direction = WorkDirection::create([
                'key' => $directionKey,
                'name' => $directionData['name'],
                'description' => $directionData['description'],
                'icon' => $directionData['icon'],
                'sort_order' => $sortOrder++,
                'is_active' => true,
            ]);

            // Создаем типы работ для этого направления
            $typeSortOrder = 1;
            foreach ($directionData['types'] as $typeKey => $typeName) {
                WorkType::create([
                    'work_direction_id' => $direction->id,
                    'key' => $typeKey,
                    'name' => $typeName,
                    'description' => null,
                    'icon' => null,
                    'sort_order' => $typeSortOrder++,
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('Work directions and types seeded successfully!');
    }
}