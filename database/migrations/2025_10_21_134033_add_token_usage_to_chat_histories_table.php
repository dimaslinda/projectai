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
        Schema::table('chat_histories', function (Blueprint $table) {
            $table->integer('input_tokens')->nullable()->after('metadata');
            $table->integer('output_tokens')->nullable()->after('input_tokens');
            $table->integer('total_tokens')->nullable()->after('output_tokens');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_histories', function (Blueprint $table) {
            $table->dropColumn(['input_tokens', 'output_tokens', 'total_tokens']);
        });
    }
};
