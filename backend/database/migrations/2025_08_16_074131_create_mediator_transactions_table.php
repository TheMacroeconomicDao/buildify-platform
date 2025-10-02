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
        Schema::create('mediator_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mediator_id');
            $table->unsignedBigInteger('order_id');
            $table->decimal('commission_amount', 10, 2);
            $table->enum('status', ['pending', 'completed', 'cancelled', 'failed'])->default('pending');
            $table->enum('type', ['commission', 'bonus', 'penalty', 'withdrawal'])->default('commission');
            $table->timestamp('processed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('mediator_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            
            $table->index('mediator_id');
            $table->index('order_id');
            $table->index('status');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mediator_transactions');
    }
};