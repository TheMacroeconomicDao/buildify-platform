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
            $table->bigInteger('referral_balance')->default(0)->after('wallet_currency')->comment('Баланс реферальных бонусов в центах');
            $table->integer('total_referrals_count')->default(0)->after('referral_balance')->comment('Общее количество рефералов');
            $table->integer('active_referrals_count')->default(0)->after('total_referrals_count')->comment('Количество активных рефералов');
            $table->bigInteger('total_referral_earnings')->default(0)->after('active_referrals_count')->comment('Общая сумма заработанных реферальных бонусов в центах');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'referral_balance',
                'total_referrals_count', 
                'active_referrals_count',
                'total_referral_earnings'
            ]);
        });
    }
};
