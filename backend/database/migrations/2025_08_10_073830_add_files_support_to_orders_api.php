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
        // This migration documents changes to the OrderController::index() method
        // to include files in the API response for available orders.
        // No database schema changes are needed as the relationships already exist.
        
        // Changes made:
        // 1. OrderController::index() now includes ->with('files') 
        // 2. API response now includes 'files' array with file data
        // 3. Mobile app can now display first image from order files
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No schema changes to reverse
    }
};