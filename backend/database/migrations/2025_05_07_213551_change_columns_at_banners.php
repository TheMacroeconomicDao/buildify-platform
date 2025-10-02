<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropColumn(['image', 'status', 'name',]);

            $table->tinyInteger('priority')->default(0);
            $table->tinyInteger('for_whom');
            $table->tinyInteger('status')->default(0);
            $table->unsignedBigInteger('image_id'); // URL файла

            $table->foreign('image_id')
                ->references('id')
                ->on('files')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropColumn(['image_id', 'status', 'priority', 'for_whom']);

            $table->string('name');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('image');
        });
    }
};
