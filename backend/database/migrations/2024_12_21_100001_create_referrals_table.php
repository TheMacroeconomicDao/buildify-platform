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
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('referrer_id')->comment('ID пользователя, который пригласил');
            $table->unsignedBigInteger('referred_id')->comment('ID приглашённого пользователя');
            $table->unsignedBigInteger('referral_code_id')->comment('ID использованного промокода');
            $table->enum('status', ['pending', 'active', 'cancelled'])->default('pending')->comment('Статус реферальной связи');
            $table->timestamps();
            
            $table->foreign('referrer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referred_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referral_code_id')->references('id')->on('referral_codes')->onDelete('cascade');
            
            $table->unique(['referrer_id', 'referred_id'], 'unique_referral_pair');
            $table->index('referrer_id');
            $table->index('referred_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
