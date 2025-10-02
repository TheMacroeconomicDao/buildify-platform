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
        Schema::create('scheduled_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            
            // Настройки получателей
            $table->enum('target_type', ['all', 'customers', 'executors', 'specific_users'])->default('all');
            $table->json('target_user_ids')->nullable(); // Для specific_users
            
            // Настройки расписания
            $table->enum('schedule_type', ['once', 'daily', 'weekly', 'monthly'])->default('once');
            $table->timestamp('scheduled_at');
            $table->json('schedule_config')->nullable(); // Для повторяющихся уведомлений
            
            // Статус
            $table->enum('status', ['pending', 'sent', 'failed', 'cancelled'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->integer('sent_count')->default(0);
            $table->integer('failed_count')->default(0);
            $table->text('error_message')->nullable();
            
            // Метаданные
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['status', 'scheduled_at']);
            $table->index(['target_type', 'scheduled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_notifications');
    }
};
