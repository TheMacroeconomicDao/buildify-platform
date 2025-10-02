<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('used_orders_count')->default(0)->comment('Количество использованных заказов в текущем периоде подписки');
            $table->integer('used_contacts_count')->default(0)->comment('Количество использованных контактов в текущем периоде подписки');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['used_orders_count', 'used_contacts_count']);
        });
    }
};