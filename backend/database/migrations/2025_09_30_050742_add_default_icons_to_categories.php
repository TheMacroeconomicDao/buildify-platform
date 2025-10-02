<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Добавляем иконки по умолчанию для существующих направлений работ
        $defaultDirectionIcons = [
            'repair_and_construction' => 'construction',
            'home_services' => 'home',
            'cleaning' => 'cleaning',
            'design_and_architecture' => 'design',
            'moving_and_transportation' => 'moving',
            'beauty_and_wellness' => 'beauty',
            'technology_and_it' => 'technology',
            'automotive' => 'automotive',
            'education_and_training' => 'education',
            'business_services' => 'business',
        ];

        foreach ($defaultDirectionIcons as $key => $icon) {
            DB::table('work_directions')
                ->where('key', $key)
                ->whereNull('icon')
                ->update(['icon' => $icon]);
        }

        // Добавляем иконки по умолчанию для существующих типов работ
        $defaultTypeIcons = [
            // Ремонт и строительство
            'bathroom_renovation' => 'bathroom',
            'kitchen_renovation' => 'kitchen',
            'flooring_installation' => 'flooring',
            'painting_and_decorating' => 'painting',
            'electrical_work' => 'electrical',
            'plumbing_services' => 'plumbing',
            'roofing_and_exterior' => 'roofing',
            'hvac_services' => 'hvac',
            'tiling_and_stonework' => 'tiles',
            'carpentry_and_joinery' => 'wood',
            'plastering_and_drywall' => 'construction',
            'window_and_door_installation' => 'windows',
            'insulation_services' => 'home',
            'waterproofing' => 'repair',
            'other_construction' => 'construction',
            
            // Домашние услуги
            'furniture_assembly' => 'furniture',
            'appliance_installation' => 'electrical',
            'home_security_installation' => 'security',
            'smart_home_setup' => 'technology',
            'lighting_installation' => 'lighting',
            'curtain_and_blind_installation' => 'home',
            'shelving_and_storage' => 'furniture',
            'mirror_and_artwork_hanging' => 'home',
            'other_home_services' => 'home',
            
            // Уборка
            'regular_cleaning' => 'cleaning',
            'deep_cleaning' => 'cleaning',
            'post_construction_cleaning' => 'cleaning',
            'carpet_and_upholstery_cleaning' => 'carpet',
            'window_cleaning' => 'windows',
            'pressure_washing' => 'cleaning',
            'other_cleaning' => 'cleaning',
        ];

        foreach ($defaultTypeIcons as $key => $icon) {
            DB::table('work_types')
                ->where('key', $key)
                ->whereNull('icon')
                ->update(['icon' => $icon]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Можно оставить пустым, так как мы только добавляем данные
        // и не изменяем структуру таблиц
    }
};
