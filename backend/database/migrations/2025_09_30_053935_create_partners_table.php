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
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            
            // Основная информация
            $table->string('partner_id')->unique(); // Уникальный идентификатор для ссылок
            $table->string('name'); // Название партнера
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->text('description')->nullable();
            
            // Связи (добавим после создания таблицы managers)
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Если партнер = исполнитель
            
            // Условия вознаграждения
            $table->enum('reward_type', ['fixed', 'percentage'])->default('percentage');
            $table->decimal('reward_value', 10, 2); // Фикс сумма или процент
            $table->decimal('min_payout', 10, 2)->default(100); // Минимальная сумма для вывода
            
            // Индивидуальные условия (переопределяют глобальные)
            $table->json('custom_conditions')->nullable();
            
            // Статистика
            $table->integer('total_referrals')->default(0);
            $table->integer('active_referrals')->default(0);
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->decimal('paid_earnings', 12, 2)->default(0);
            $table->decimal('pending_earnings', 12, 2)->default(0);
            
            // Статус и настройки
            $table->boolean('is_active')->default(true);
            $table->boolean('auto_approve')->default(false); // Автоодобрение выплат
            $table->timestamp('last_activity_at')->nullable();
            
            // Метаданные
            $table->json('metadata')->nullable(); // Дополнительные данные
            $table->string('source')->nullable(); // Откуда пришел партнер
            $table->timestamps();
            
            // Индексы
            $table->index(['is_active', 'manager_id']);
            $table->index(['partner_id']);
            $table->index(['total_earnings']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
