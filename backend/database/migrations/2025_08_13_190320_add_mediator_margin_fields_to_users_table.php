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
            $table->decimal('mediator_margin_percentage', 5, 2)->nullable()->comment('Маржа посредника в процентах');
            $table->decimal('mediator_fixed_fee', 10, 2)->nullable()->comment('Фиксированная комиссия посредника');
            $table->decimal('mediator_agreed_price', 10, 2)->nullable()->comment('Договорная цена за услуги посредника');
            $table->text('mediator_notes')->nullable()->comment('Заметки по договоренности с посредником');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mediator_margin_percentage',
                'mediator_fixed_fee', 
                'mediator_agreed_price',
                'mediator_notes'
            ]);
        });
    }
};
