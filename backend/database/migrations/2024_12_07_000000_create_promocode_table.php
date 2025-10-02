<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        if (! Schema::hasTable('promo_code')) {
            Schema::create('promo_code', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description');
                $table->integer('deductions_partner');
                $table->tinyInteger('status')->default(0);

                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('training');
    }
};
