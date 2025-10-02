<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('work_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_direction_id')->constrained('work_directions')->onDelete('cascade');
            $table->string('key')->unique(); // Уникальный ключ для API
            $table->json('name'); // Мультиязычные названия
            $table->text('description')->nullable(); // Описание
            $table->string('icon')->nullable(); // Иконка
            $table->integer('sort_order')->default(0); // Порядок сортировки
            $table->boolean('is_active')->default(true); // Активность
            $table->timestamps();
            
            $table->index(['work_direction_id', 'is_active', 'sort_order']);
            $table->index(['is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_types');
    }
};
