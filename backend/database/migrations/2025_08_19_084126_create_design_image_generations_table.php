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
        Schema::create('design_image_generations', function (Blueprint $table) {
            $table->id();
            $table->string('generation_id')->unique()->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->longText('design_content');
            $table->text('description');
            $table->json('room_type');
            $table->json('style');
            $table->integer('image_count')->default(2);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->index();
            $table->json('images')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('design_image_generations');
    }
};
