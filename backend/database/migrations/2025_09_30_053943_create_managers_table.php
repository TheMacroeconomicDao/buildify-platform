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
        Schema::create('managers', function (Blueprint $table) {
            $table->id();
            
            // Основная информация
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->text('description')->nullable();
            
            // Связь с пользователем системы
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Условия вознаграждения (прогрессивная шкала)
            $table->decimal('base_commission', 5, 2)->default(10.00); // Базовая ставка %
            $table->decimal('tier2_threshold', 12, 2)->default(40000); // Порог для 15%
            $table->decimal('tier2_commission', 5, 2)->default(15.00);
            $table->decimal('tier3_threshold', 12, 2)->default(120000); // Порог для 20%
            $table->decimal('tier3_commission', 5, 2)->default(20.00);
            $table->decimal('activity_bonus', 5, 2)->default(5.00); // Бонус за активность
            $table->decimal('activity_threshold', 5, 2)->default(70.00); // Порог активности %
            
            // Статистика
            $table->integer('total_partners')->default(0);
            $table->integer('active_partners')->default(0);
            $table->decimal('total_partners_earnings', 12, 2)->default(0);
            $table->decimal('total_commission_earned', 12, 2)->default(0);
            $table->decimal('paid_commission', 12, 2)->default(0);
            $table->decimal('pending_commission', 12, 2)->default(0);
            
            // Статус
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_activity_at')->nullable();
            
            // Настройки
            $table->json('settings')->nullable();
            $table->timestamps();
            
            // Индексы
            $table->index(['is_active']);
            $table->index(['total_commission_earned']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('managers');
    }
};
