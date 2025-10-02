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
        Schema::create('customer_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade'); // заказчик, о котором оставляют отзыв
            $table->foreignId('executor_id')->constrained('users')->onDelete('cascade'); // исполнитель, который оставляет отзыв
            $table->integer('rating')->unsigned()->comment('1-5 звезд');
            $table->text('comment')->nullable()->comment('Текст отзыва');
            $table->timestamps();
            
            // Один исполнитель может оставить только один отзыв о заказчике по одному заказу
            $table->unique(['order_id', 'executor_id'], 'unique_executor_order_review');
            
            // Индексы для быстрого поиска
            $table->index('customer_id');
            $table->index('executor_id');
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_reviews');
    }
};