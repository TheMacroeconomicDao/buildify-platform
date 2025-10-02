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
        Schema::create('manager_rewards', function (Blueprint $table) {
            $table->id();
            
            // Связи
            $table->foreignId('manager_id')->constrained('managers')->onDelete('cascade');
            $table->foreignId('partner_id')->constrained('partners')->onDelete('cascade');
            $table->foreignId('partner_reward_id')->constrained('partner_rewards')->onDelete('cascade');
            
            // Детали вознаграждения
            $table->decimal('partner_earnings', 10, 2); // Доход партнера
            $table->decimal('commission_rate', 5, 2); // Ставка менеджера %
            $table->decimal('commission_amount', 10, 2); // Комиссия менеджера
            $table->decimal('activity_bonus_rate', 5, 2)->default(0); // Бонус за активность %
            $table->decimal('activity_bonus_amount', 10, 2)->default(0); // Сумма бонуса
            $table->decimal('total_amount', 10, 2); // Общая сумма к выплате
            
            // Расчетные данные
            $table->integer('active_partners_count'); // Количество активных партнеров
            $table->decimal('total_partners_volume', 12, 2); // Общий оборот партнеров
            $table->decimal('activity_percentage', 5, 2); // Процент активности
            
            // Статус
            $table->enum('status', ['pending', 'approved', 'paid', 'cancelled'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->text('payment_details')->nullable();
            
            // Период начисления
            $table->date('period_start');
            $table->date('period_end');
            
            // Метаданные
            $table->json('calculation_details')->nullable(); // Детали расчета
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Индексы
            $table->index(['manager_id', 'status']);
            $table->index(['partner_id', 'status']);
            $table->index(['status', 'approved_at']);
            $table->index(['period_start', 'period_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manager_rewards');
    }
};
