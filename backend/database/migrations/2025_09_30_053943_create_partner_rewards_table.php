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
        Schema::create('partner_rewards', function (Blueprint $table) {
            $table->id();
            
            // Связи
            $table->foreignId('partner_id')->constrained('partners')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Пользователь, который принес доход
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null'); // Связанный заказ
            $table->unsignedBigInteger('transaction_id')->nullable(); // Связанная транзакция (если есть)
            
            // Детали вознаграждения
            $table->enum('reward_type', ['registration', 'first_order', 'commission', 'top_up']); // Тип события
            $table->decimal('base_amount', 12, 2); // Базовая сумма (оборот/пополнение)
            $table->decimal('reward_rate', 5, 2); // Ставка вознаграждения %
            $table->decimal('reward_amount', 10, 2); // Итоговое вознаграждение
            
            // Статус
            $table->enum('status', ['pending', 'approved', 'paid', 'cancelled'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable(); // bank_transfer, account_balance
            $table->text('payment_details')->nullable(); // Детали платежа
            
            // Метаданные
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Индексы
            $table->index(['partner_id', 'status']);
            $table->index(['user_id', 'reward_type']);
            $table->index(['status', 'approved_at']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_rewards');
    }
};
