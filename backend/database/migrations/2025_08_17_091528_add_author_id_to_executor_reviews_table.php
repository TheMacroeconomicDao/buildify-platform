<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('executor_reviews', function (Blueprint $table) {
            // Add author_id column - this is the same as customer_id but with consistent naming
            $table->foreignId('author_id')->after('order_id')->constrained('users')->onDelete('cascade');
            
            // Copy data from customer_id to author_id if any data exists
            // (In executor reviews, the author is the customer who wrote the review)
        });
        
        // Copy existing data from customer_id to author_id
        DB::statement('UPDATE executor_reviews SET author_id = customer_id');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('executor_reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('author_id');
        });
    }
};
