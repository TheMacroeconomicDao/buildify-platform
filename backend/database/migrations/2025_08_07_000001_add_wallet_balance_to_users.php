<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->bigInteger('wallet_balance')->default(0)->after('reviews_count'); // amount in cents
            $table->string('wallet_currency')->default('aed')->after('wallet_balance');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['wallet_balance', 'wallet_currency']);
        });
    }
};

