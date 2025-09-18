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
        Schema::create('chat_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('chat_session_id')->constrained()->onDelete('cascade');
            $table->text('message'); // Pesan user atau AI
            $table->enum('sender', ['user', 'ai']); // Pengirim pesan
            $table->json('metadata')->nullable(); // Data tambahan seperti context, attachments, dll
            $table->timestamps();
            
            $table->index(['user_id', 'created_at']);
            $table->index(['chat_session_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_histories');
    }
};