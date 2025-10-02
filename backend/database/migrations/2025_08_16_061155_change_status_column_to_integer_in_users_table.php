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
        // Для PostgreSQL нужно явно указать USING для приведения типов
        if (config('database.default') === 'pgsql') {
            // Сначала удаляем дефолтное значение
            DB::statement('ALTER TABLE users ALTER COLUMN status DROP DEFAULT');
            // Затем меняем тип колонки
            DB::statement('ALTER TABLE users ALTER COLUMN status TYPE integer USING status::integer');
            // И устанавливаем новое дефолтное значение
            DB::statement('ALTER TABLE users ALTER COLUMN status SET DEFAULT 0');
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->integer('status')->default(0)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Возвращаем обратно к varchar
            $table->string('status')->default('0')->change();
        });
    }
};