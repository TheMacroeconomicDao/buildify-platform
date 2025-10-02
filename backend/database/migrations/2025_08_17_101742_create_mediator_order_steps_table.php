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
        Schema::create('mediator_order_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('mediator_id')->constrained('users')->onDelete('cascade');
            $table->tinyInteger('step'); // 1, 2, 3
            $table->string('status')->default('active'); // active, completed, archived, returned
            $table->text('notes')->nullable();
            $table->json('data')->nullable(); // Дополнительные данные для каждого этапа
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            // Индексы
            $table->index(['order_id', 'mediator_id']);
            $table->index(['mediator_id', 'status']);
            $table->unique(['order_id', 'step']); // Один этап на заказ
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mediator_order_steps');
    }
};
