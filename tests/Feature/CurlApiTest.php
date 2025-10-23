<?php

use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'role' => 'user'
    ]);
    
    $this->session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test API Session',
        'chat_type' => 'global',
        'preferred_model' => 'gemini-2.5-flash-image'
    ]);
});

it('can send message via HTTP API', function () {
    $this->actingAs($this->user);
    
    $response = $this->postJson("/chat/{$this->session->id}/message", [
        'message' => 'buatkan gambar kucing lucu',
        'selected_model' => 'gemini-2.5-flash-image'
    ]);

    $response->assertStatus(200);
    $responseData = $response->json();
    
    expect($responseData)->toBeArray();
});

it('can verify chat history is saved', function () {
    $this->actingAs($this->user);
    
    // Send a message first
    $this->postJson("/chat/{$this->session->id}/message", [
        'message' => 'test message for history',
        'selected_model' => 'gemini-2.5-flash-image'
    ]);

    // Check if chat history was saved
    $latestHistory = ChatHistory::where('chat_session_id', $this->session->id)
        ->where('user_id', $this->user->id)
        ->where('sender', 'user')
        ->latest()
        ->first();

    expect($latestHistory)->not->toBeNull();
    expect($latestHistory->message)->toBe('test message for history');
});