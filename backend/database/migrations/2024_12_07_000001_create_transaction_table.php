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
        if (! Schema::hasTable('transaction')) {
            Schema::create('transaction', function (Blueprint $table) {
                $table->id();
                $table->integer('subscription_id');
                $table->integer('amount');
                $table->integer('user_discount');
                $table->integer('user_id');
                $table->integer('promo_code_id')->nullable();
                $table->integer('status')->default(0);

                $table->timestamps();
                $table->foreign('subscription_id')
                    ->references('id')
                    ->on('subscription')
                    ->onUpdate('cascade')
                    ->onDelete('cascade');

                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->onUpdate('cascade')
                    ->onDelete('cascade');

                $table->foreign('promo_code_id')
                    ->references('id')
                    ->on('promo_code')
                    ->onUpdate('cascade')
                    ->onDelete('cascade');
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
        Schema::dropIfExists('transaction');
    }
};
