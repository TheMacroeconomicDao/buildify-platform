<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // === АДРЕС И ГЕОЛОКАЦИЯ ===
            $table->string('full_address')->nullable()->after('address');
            $table->decimal('latitude', 10, 8)->nullable()->after('full_address');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            
            // === ДЕТАЛИ ЖИЛЬЯ ===
            $table->enum('housing_type', ['apartment', 'house', 'commercial'])->nullable()->after('longitude');
            $table->enum('housing_condition', ['new', 'secondary'])->nullable()->after('housing_type');
            $table->enum('housing_preparation_level', ['without_walls', 'rough_finish', 'finish_finish'])->nullable()->after('housing_condition');
            $table->enum('bathroom_type', ['separate', 'combined'])->nullable()->after('housing_preparation_level');
            $table->string('ceiling_height')->nullable()->after('bathroom_type');
            $table->string('total_area')->nullable()->after('ceiling_height');
            
            // === ДАТА И ВРЕМЯ ===
            $table->enum('date_type', ['single', 'period'])->default('single')->after('total_area');
            
            // Для single даты
            $table->date('work_date')->nullable()->after('date_type');
            $table->time('work_time')->nullable()->after('work_date');
            
            // Для периода
            $table->date('start_date')->nullable()->after('work_time');
            $table->time('start_time')->nullable()->after('start_date');
            $table->date('end_date')->nullable()->after('start_time');
            $table->time('end_time')->nullable()->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'full_address',
                'latitude',
                'longitude',
                'housing_type',
                'housing_condition',
                'housing_preparation_level',
                'bathroom_type',
                'ceiling_height',
                'total_area',
                'date_type',
                'work_date',
                'work_time',
                'start_date',
                'start_time',
                'end_date',
                'end_time'
            ]);
        });
    }
};