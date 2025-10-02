<?php
// database/migrations/[timestamp]_create_subscriptions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tariffs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('stripe_product_id')->nullable(); // ID продукта в Stripe
            $table->string('stripe_price_id')->nullable(); // ID цены в Stripe
            $table->integer('duration_days')->comment('Срок действия в днях');
            $table->integer('max_orders')->comment('Макс. одновременных заказов');
            $table->integer('max_responses')->comment('Макс. количество откликов');
            $table->integer('max_contacts')->comment('Макс. количество открытых контактов');
            $table->decimal('price', 10, 2)->comment('Стоимость подписки');
            $table->boolean('is_active')->default(true)->comment('Активна ли подписка для покупки');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tariffs');
    }
};
