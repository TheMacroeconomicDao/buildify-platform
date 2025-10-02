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
            // Добавляем составной индекс для оптимизации unique валидации с учетом статуса
            $table->index(['email', 'status'], 'users_email_status_index');
            $table->index(['phone', 'status'], 'users_phone_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Удаляем созданные индексы
            $table->dropIndex('users_email_status_index');
            $table->dropIndex('users_phone_status_index');
        });
    }
};
