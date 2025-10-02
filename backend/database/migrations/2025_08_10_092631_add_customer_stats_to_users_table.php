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
            // Статистика как заказчика
            $table->integer('customer_orders_count')->default(0)->comment('Количество заказов как заказчик');
            $table->decimal('customer_rating', 2, 1)->default(0)->comment('Рейтинг как заказчик (0.0 - 5.0)');
            $table->integer('customer_reviews_count')->default(0)->comment('Количество отзывов как заказчик');
            
            // Индексы для сортировки и фильтрации
            $table->index('customer_rating');
            $table->index('customer_orders_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['customer_rating']);
            $table->dropIndex(['customer_orders_count']);
            $table->dropColumn([
                'customer_orders_count',
                'customer_rating', 
                'customer_reviews_count'
            ]);
        });
    }
};