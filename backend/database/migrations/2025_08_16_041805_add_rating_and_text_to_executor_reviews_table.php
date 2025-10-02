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
        Schema::table('executor_reviews', function (Blueprint $table) {
            $table->integer('rating')->unsigned()->nullable()->after('overall_rating'); // Простой рейтинг
            $table->text('text')->nullable()->after('comment'); // Простой текст отзыва
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('executor_reviews', function (Blueprint $table) {
            $table->dropColumn(['rating', 'text']);
        });
    }
};
