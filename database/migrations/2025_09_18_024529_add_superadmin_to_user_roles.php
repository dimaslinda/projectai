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
        // For SQLite compatibility, we'll use a different approach
        Schema::table('users', function (Blueprint $table) {
            // Drop the existing role column
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            // Add the role column back with new enum values
            $table->enum('role', ['engineer', 'drafter', 'esr', 'superadmin', 'admin'])->default('engineer')->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the role column
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            // Add the role column back with original enum values
            $table->enum('role', ['engineer', 'drafter', 'esr'])->default('engineer')->after('email');
        });
    }
};
