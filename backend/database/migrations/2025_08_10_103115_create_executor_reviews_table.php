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
        Schema::create('executor_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('executor_id')->constrained('users')->onDelete('cascade');
            $table->integer('quality_rating')->unsigned()->default(0); // Качество работы
            $table->integer('speed_rating')->unsigned()->default(0);   // Скорость выполнения
            $table->integer('communication_rating')->unsigned()->default(0); // Общение
            $table->integer('overall_rating')->unsigned()->default(0); // Общий рейтинг
            $table->text('comment')->nullable(); // Комментарий
            $table->timestamps();

            // Индексы
            $table->index(['executor_id', 'created_at']);
            $table->index(['order_id']);
            
            // Уникальность - один отзыв на заказ от заказчика
            $table->unique(['order_id', 'customer_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('executor_reviews');
    }
};