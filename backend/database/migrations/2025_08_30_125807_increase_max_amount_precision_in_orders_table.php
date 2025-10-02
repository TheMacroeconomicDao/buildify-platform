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
        Schema::table('orders', function (Blueprint $table) {
            // Увеличиваем точность поля max_amount с NUMERIC(8,2) до NUMERIC(12,2)
            // Это позволит хранить значения до 9,999,999,999.99 вместо 999,999.99
            $table->decimal('max_amount', 12, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Возвращаем обратно к NUMERIC(8,2) при откате
            $table->decimal('max_amount', 8, 2)->change();
        });
    }
};
