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
        Schema::table('users', function (Blueprint $table) {
            $table->integer('executor_orders_count')->default(0); // Количество выполненных заказов
            $table->decimal('executor_rating', 3, 2)->default(0.00); // Средний рейтинг исполнителя
            $table->integer('executor_reviews_count')->default(0); // Количество отзывов об исполнителе
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['executor_orders_count', 'executor_rating', 'executor_reviews_count']);
        });
    }
};