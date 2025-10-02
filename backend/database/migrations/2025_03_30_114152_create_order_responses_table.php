<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_responses', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('executor_id');
            $table->tinyInteger('status')->default(0);

            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')
                ->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('executor_id')->references('id')->on('users')
                ->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_responses');
    }
};
