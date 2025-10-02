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
            $table->string('partner_id')->nullable()->after('referral_balance');
            $table->timestamp('referred_at')->nullable()->after('partner_id');
            $table->string('referral_source')->nullable()->after('referred_at'); // app_store, google_play, direct
            $table->json('referral_metadata')->nullable()->after('referral_source'); // Дополнительные данные о привлечении
            
            $table->index(['partner_id']);
            $table->index(['referred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['partner_id']);
            $table->dropIndex(['referred_at']);
            $table->dropColumn(['partner_id', 'referred_at', 'referral_source', 'referral_metadata']);
        });
    }
};
