<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('wallet_transactions')) {
            Schema::create('wallet_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('type'); // deposit, withdrawal, hold, release, charge
                $table->bigInteger('amount'); // in cents, positive
                $table->bigInteger('balance_before');
                $table->bigInteger('balance_after');
                $table->string('currency', 10)->default('aed');
                $table->string('stripe_payment_intent_id')->nullable();
                $table->string('stripe_session_id')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'created_at']);
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};

