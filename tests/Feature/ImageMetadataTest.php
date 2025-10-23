<?php

use App\Models\User;
use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Http\Controllers\ChatController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('can create chat session for image metadata testing', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Image Metadata Session',
        'persona' => null,
        'chat_type' => 'global',
        'preferred_model' => 'gemini-2.5-flash-image'
    ]);

    expect($session->user_id)->toBe($this->user->id);
    expect($session->chat_type)->toBe('global');
    expect($session->preferred_model)->toBe('gemini-2.5-flash-image');
});

it('can save chat history with image metadata', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Image Metadata Session',
        'persona' => null,
        'chat_type' => 'global',
        'preferred_model' => 'gemini-2.5-flash-image'
    ]);

    $metadata = [
        'persona' => null,
        'chat_type' => 'global',
        'timestamp' => now()->toISOString(),
        'images' => [],
        'is_error' => false,
        'generated_image' => 'https://example.com/test-image.jpg',
        'response_type' => 'image'
    ];

    $chatHistory = ChatHistory::create([
        'user_id' => $this->user->id,
        'chat_session_id' => $session->id,
        'message' => 'Test AI response with image',
        'sender' => 'ai',
        'metadata' => $metadata,
    ]);

    expect($chatHistory->metadata['generated_image'])->toBe('https://example.com/test-image.jpg');
    expect($chatHistory->metadata['response_type'])->toBe('image');
    expect($chatHistory->sender)->toBe('ai');
});

it('can test chat controller image generation', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Image Generation',
        'persona' => null,
        'chat_type' => 'global',
        'preferred_model' => 'gemini-2.5-flash-image'
    ]);

    $controller = new ChatController();
    
    // Test that controller can be instantiated
    expect($controller)->toBeInstanceOf(ChatController::class);
})->skip('This test requires actual API calls and may be slow');