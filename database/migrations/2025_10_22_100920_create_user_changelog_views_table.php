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
        Schema::create('user_changelog_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('changelog_id')->constrained()->onDelete('cascade');
            $table->timestamp('viewed_at')->useCurrent();
            $table->timestamps();
            
            // Ensure one record per user per changelog
            $table->unique(['user_id', 'changelog_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_changelog_views');
    }
};
