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
        Schema::table('users', function (Blueprint $table) {
            // Удаляем старое текстовое поле license, так как теперь используется license_file_path для файлов
            $table->dropColumn('license');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Восстанавливаем поле license
            $table->string('license')->nullable()->after('viber')->comment('Номер лицензии (устаревшее поле)');
        });
    }
};