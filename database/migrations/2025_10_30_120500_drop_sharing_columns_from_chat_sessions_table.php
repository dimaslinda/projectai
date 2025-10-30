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
        // Skip destructive changes on SQLite (commonly used for tests)
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('chat_sessions', function (Blueprint $table) {
            // Drop composite index involving is_shared if it exists
            try {
                $table->dropIndex('chat_sessions_persona_is_shared_index');
            } catch (\Throwable $e) {
                // Index may not exist; ignore
            }

            // Drop sharing-related columns (best-effort swallowing errors if already removed)
            try {
                $table->dropColumn('is_shared');
            } catch (\Throwable $e) {
                // Column may already be removed; ignore
            }
            try {
                $table->dropColumn('shared_with_roles');
            } catch (\Throwable $e) {
                // Column may already be removed; ignore
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Skip destructive changes on SQLite (commonly used for tests)
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('chat_sessions', function (Blueprint $table) {
            // Restore columns
            if (!Schema::hasColumn('chat_sessions', 'is_shared')) {
                $table->boolean('is_shared')->default(false);
            }
            if (!Schema::hasColumn('chat_sessions', 'shared_with_roles')) {
                $table->json('shared_with_roles')->nullable();
            }

            // Restore composite index
            try {
                $table->index(['persona', 'is_shared']);
            } catch (\Throwable $e) {
                // Ignore if index creation fails
            }
        });
    }
};