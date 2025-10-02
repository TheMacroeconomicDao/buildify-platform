<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // Название
            $table->string('work_direction'); // Направление работ
            $table->string('work_type'); // Тип работ
            $table->text('description')->nullable(); // Описание
            $table->string('city'); // Город
            $table->string('address'); // Адрес
            $table->date('planned_start_date'); // Плановая дата начала
            $table->decimal('max_amount'); // Максимальная сумма
            $table->unsignedBigInteger('author_id'); // ID автора
            $table->integer('status'); // Статус
            $table->timestamps();

            // Внешний ключ для автора (если есть таблица users)
            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
