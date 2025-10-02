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
        Schema::table('orders', function (Blueprint $table) {
            // Поля для workflow посредника
            $table->string('executor_contact_name')->nullable()->after('payment_held');
            $table->string('executor_contact_phone')->nullable()->after('executor_contact_name');
            $table->decimal('executor_cost', 10, 2)->nullable()->after('executor_contact_phone');
            $table->decimal('mediator_margin', 10, 2)->nullable()->after('executor_cost');
            $table->date('project_deadline')->nullable()->after('mediator_margin');
            $table->text('mediator_notes')->nullable()->after('project_deadline');
            $table->tinyInteger('mediator_step')->nullable()->after('mediator_notes'); // Текущий шаг посредника
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'executor_contact_name',
                'executor_contact_phone', 
                'executor_cost',
                'mediator_margin',
                'project_deadline',
                'mediator_notes',
                'mediator_step'
            ]);
        });
    }
};
