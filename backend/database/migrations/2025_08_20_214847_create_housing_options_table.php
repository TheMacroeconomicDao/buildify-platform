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
        Schema::create('housing_options', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // housing_type, housing_condition, housing_preparation_level, bathroom_type
            $table->string('key'); // apartment, house, commercial, new, secondary, etc.
            $table->string('label_en'); // English label
            $table->string('label_ar'); // Arabic label
            $table->integer('sort_order')->default(0); // Order for display
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['type', 'key']); // Prevent duplicate keys within same type
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('housing_options');
    }
};
