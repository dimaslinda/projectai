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
        Schema::create('changelogs', function (Blueprint $table) {
            $table->id();
            $table->string('version', 20); // e.g., v0.2.0
            $table->date('release_date');
            $table->enum('type', ['major', 'minor', 'patch', 'hotfix'])->default('minor');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('changes')->nullable(); // Array of changes
            $table->json('technical_notes')->nullable(); // Technical details for developers
            $table->boolean('is_published')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['version', 'release_date']);
            $table->index('is_published');
            
            // Foreign key
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('changelogs');
    }
};
