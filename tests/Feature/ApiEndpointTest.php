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
        'role' => 'user',
        'email_verified_at' => now()
    ]);
    
    $this->session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session',
        'type' => 'global'
    ]);
});

it('can create and retrieve a test user', function () {
    expect($this->user)->toBeInstanceOf(User::class);
    expect($this->user->email)->toBe('test@example.com');
});

it('can create a chat session', function () {
    expect($this->session)->toBeInstanceOf(ChatSession::class);
    expect($this->session->user_id)->toBe($this->user->id);
});

it('can send message via API endpoint', function () {
    $this->actingAs($this->user);
    
    $response = $this->postJson("/chat/{$this->session->id}/message", [
        'message' => 'buatkan gambar kucing lucu',
        'selected_model' => 'gemini-2.5-flash-image'
    ]);

    $response->assertStatus(200);
    $responseData = $response->json();
    
    expect($responseData)->toBeArray();
    expect($responseData)->toHaveKey('success');
    expect($responseData['success'])->toBeTrue();
});

it('can save chat history with metadata', function () {
    $this->actingAs($this->user);
    
    // Send a message first
    $this->postJson("/chat/{$this->session->id}/message", [
        'message' => 'test message',
        'selected_model' => 'gemini-2.5-flash-image'
    ]);

    // Check if chat history was saved
    $latestHistory = ChatHistory::where('chat_session_id', $this->session->id)
        ->where('user_id', $this->user->id)
        ->where('sender', 'user')
        ->latest()
        ->first();

    expect($latestHistory)->not->toBeNull();
    expect($latestHistory->message)->toBe('test message');
});