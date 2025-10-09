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
        // Drop and recreate the enum for SQLite/MySQL compatibility
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['engineer', 'drafter', 'esr', 'superadmin', 'admin', 'user'])
                ->default('engineer')
                ->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            // Revert to previous enum values (without 'user')
            $table->enum('role', ['engineer', 'drafter', 'esr', 'superadmin', 'admin'])
                ->default('engineer')
                ->after('email');
        });
    }
};