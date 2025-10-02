<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('next_tariff_id')->nullable()->comment('ID следующего тарифа после окончания текущего');
            $table->timestamp('next_subscription_starts_at')->nullable()->comment('Дата начала следующей подписки');
            $table->timestamp('next_subscription_ends_at')->nullable()->comment('Дата окончания следующей подписки');
            
            $table->foreign('next_tariff_id')->references('id')->on('tariffs')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['next_tariff_id']);
            $table->dropColumn(['next_tariff_id', 'next_subscription_starts_at', 'next_subscription_ends_at']);
        });
    }
};