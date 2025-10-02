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
        Schema::create('review_replies', function (Blueprint $table) {
            $table->id();
            $table->string('review_type'); // 'executor_review' или 'customer_review'
            $table->unsignedBigInteger('review_id'); // ID отзыва (executor_reviews.id или customer_reviews.id)
            $table->unsignedBigInteger('author_id'); // Кто написал ответ
            $table->text('reply_text'); // Текст ответа
            $table->timestamps();

            // Индексы
            $table->index(['review_type', 'review_id']);
            $table->index('author_id');
            
            // Внешние ключи
            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_replies');
    }
};