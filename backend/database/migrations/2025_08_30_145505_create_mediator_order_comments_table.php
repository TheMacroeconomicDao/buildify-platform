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
        Schema::create('mediator_order_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('mediator_id')->constrained('users')->onDelete('cascade');
            $table->integer('step')->comment('Этап посредника (1, 2, 3)');
            $table->text('comment')->comment('Текст комментария');
            $table->json('step_data')->nullable()->comment('Данные этапа в формате JSON');
            $table->timestamps();
            
            $table->index(['order_id', 'step']);
            $table->index(['mediator_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mediator_order_comments');
    }
};
