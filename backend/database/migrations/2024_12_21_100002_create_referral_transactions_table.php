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
        Schema::create('referral_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('referral_id')->comment('ID реферальной связи');
            $table->unsignedBigInteger('referrer_id')->comment('ID реферрера (получателя кэшбэка)');
            $table->unsignedBigInteger('referred_id')->comment('ID реферала (источника пополнения)');
            $table->unsignedBigInteger('wallet_transaction_id')->comment('ID транзакции пополнения кошелька');
            $table->bigInteger('cashback_amount')->comment('Сумма кэшбэка в центах');
            $table->decimal('cashback_percentage', 5, 2)->comment('Процент кэшбэка на момент операции');
            $table->enum('status', ['pending', 'processed', 'cancelled'])->default('pending')->comment('Статус обработки кэшбэка');
            $table->timestamp('processed_at')->nullable()->comment('Время обработки кэшбэка');
            $table->timestamps();
            
            $table->foreign('referral_id')->references('id')->on('referrals')->onDelete('cascade');
            $table->foreign('referrer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referred_id')->references('id')->on('users')->onDelete('cascade');
            // Внешний ключ добавляем только если таблица wallet_transactions существует
            if (Schema::hasTable('wallet_transactions')) {
                $table->foreign('wallet_transaction_id')->references('id')->on('wallet_transactions')->onDelete('cascade');
            }
            
            $table->index('referrer_id');
            $table->index('referred_id');
            $table->index('referral_id');
            $table->index('wallet_transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_transactions');
    }
};
