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
            $table->unsignedBigInteger('mediator_id')->nullable()->after('executor_id');
            $table->decimal('mediator_commission', 10, 2)->nullable()->after('mediator_id');
            $table->string('escrow_status')->nullable()->after('mediator_commission');
            $table->decimal('payment_held', 10, 2)->nullable()->after('escrow_status');
            
            $table->foreign('mediator_id')->references('id')->on('users')->onDelete('set null');
            $table->index('mediator_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['mediator_id']);
            $table->dropIndex(['mediator_id']);
            $table->dropColumn(['mediator_id', 'mediator_commission', 'escrow_status', 'payment_held']);
        });
    }
};