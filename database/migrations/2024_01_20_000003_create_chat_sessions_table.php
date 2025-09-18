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
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title'); // Judul sesi chat
            $table->enum('persona', ['engineer', 'drafter', 'esr']); // Persona AI yang digunakan
            $table->text('description')->nullable(); // Deskripsi singkat tentang sesi
            $table->boolean('is_shared')->default(false); // Apakah sesi ini dapat dilihat oleh user lain dengan role yang sama
            $table->json('shared_with_roles')->nullable(); // Role mana saja yang dapat melihat sesi ini
            $table->timestamp('last_activity_at')->nullable(); // Waktu aktivitas terakhir
            $table->timestamps();
            
            $table->index(['user_id', 'persona']);
            $table->index(['persona', 'is_shared']);
            $table->index('last_activity_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_sessions');
    }
};