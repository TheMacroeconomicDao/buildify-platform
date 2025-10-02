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
        // Расширяем таблицу executor_portfolios
        Schema::table('executor_portfolios', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name')->comment('Описание работы в портфолио');
            $table->enum('type', ['media', 'link'])->default('media')->after('description')->comment('Тип портфолио: медиа или ссылка');
            $table->string('external_url', 500)->nullable()->after('type')->comment('Внешняя ссылка (Instagram, сайт и т.д.)');
            
            // Делаем file_id nullable для внешних ссылок
            $table->unsignedBigInteger('file_id')->nullable()->change();
        });

        // Создаем таблицу для множественных файлов портфолио
        Schema::create('executor_portfolio_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('portfolio_id');
            $table->unsignedBigInteger('file_id');
            $table->integer('sort_order')->default(0)->comment('Порядок отображения файлов');
            $table->timestamps();

            $table->foreign('portfolio_id')->references('id')->on('executor_portfolios')
                ->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreign('file_id')->references('id')->on('files')
                ->cascadeOnUpdate()->cascadeOnDelete();
                
            $table->unique(['portfolio_id', 'file_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('executor_portfolio_files');
        
        Schema::table('executor_portfolios', function (Blueprint $table) {
            $table->dropColumn(['description', 'type', 'external_url']);
            $table->unsignedBigInteger('file_id')->nullable(false)->change();
        });
    }
};
