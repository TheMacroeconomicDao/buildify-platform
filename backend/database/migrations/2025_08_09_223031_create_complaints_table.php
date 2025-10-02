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
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('complainant_id')->constrained('users')->onDelete('cascade')->comment('ID пользователя, подающего жалобу');
            $table->foreignId('reported_user_id')->constrained('users')->onDelete('cascade')->comment('ID пользователя, на которого подают жалобу');
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('cascade')->comment('ID заказа (если жалоба связана с заказом)');
            $table->string('reason')->comment('Причина жалобы');
            $table->text('comment')->nullable()->comment('Комментарий к жалобе');
            $table->enum('status', ['pending', 'reviewing', 'resolved', 'rejected'])->default('pending')->comment('Статус жалобы');
            $table->text('admin_comment')->nullable()->comment('Комментарий администратора');
            $table->timestamp('reviewed_at')->nullable()->comment('Время рассмотрения жалобы');
            $table->timestamps();
            
            $table->index(['complainant_id', 'reported_user_id']);
            $table->index(['status']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
