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
            // Меняем license с string на путь к файлу
            $table->string('license_file_path')->nullable()->after('license')->comment('Путь к файлу лицензии');
            
            // Добавляем статус верификации для исполнителей
            $table->integer('verification_status')->default(3)->after('license_file_path')->comment('Статус верификации: 0-Pending, 1-Approved, 2-Rejected, 3-NotRequired');
            
            // Добавляем комментарий администратора при отклонении
            $table->text('verification_comment')->nullable()->after('verification_status')->comment('Комментарий администратора при верификации');
            
            // Дата верификации
            $table->timestamp('verified_at')->nullable()->after('verification_comment')->comment('Дата верификации');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'license_file_path',
                'verification_status', 
                'verification_comment',
                'verified_at'
            ]);
        });
    }
};
