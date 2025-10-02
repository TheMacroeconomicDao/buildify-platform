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
            $table->timestamp('subscription_started_at')->nullable()->comment('Дата начала текущей подписки');
            $table->timestamp('subscription_ends_at')->nullable()->comment('Дата окончания текущей подписки');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['subscription_started_at', 'subscription_ends_at']);
        });
    }
};
