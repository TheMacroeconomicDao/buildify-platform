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
            $table->string('push_token')->nullable()->after('remember_token');
            $table->json('push_settings')->nullable()->after('push_token');
            $table->timestamp('push_token_updated_at')->nullable()->after('push_settings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['push_token', 'push_settings', 'push_token_updated_at']);
        });
    }
};
