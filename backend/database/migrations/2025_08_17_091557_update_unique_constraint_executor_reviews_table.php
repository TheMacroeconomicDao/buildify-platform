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
        Schema::table('executor_reviews', function (Blueprint $table) {
            // Drop the old unique constraint
            $table->dropUnique(['order_id', 'customer_id']);
            
            // Add the new unique constraint using author_id
            $table->unique(['order_id', 'author_id'], 'unique_executor_order_author_review');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('executor_reviews', function (Blueprint $table) {
            // Drop the new unique constraint
            $table->dropUnique('unique_executor_order_author_review');
            
            // Restore the old unique constraint
            $table->unique(['order_id', 'customer_id']);
        });
    }
};
