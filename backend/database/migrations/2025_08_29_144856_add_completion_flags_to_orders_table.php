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
            $table->boolean('completed_by_executor')->default(false)->after('status');
            $table->boolean('completed_by_customer')->default(false)->after('completed_by_executor');
            $table->timestamp('executor_completed_at')->nullable()->after('completed_by_customer');
            $table->timestamp('customer_completed_at')->nullable()->after('executor_completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'completed_by_executor',
                'completed_by_customer', 
                'executor_completed_at',
                'customer_completed_at'
            ]);
        });
    }
};