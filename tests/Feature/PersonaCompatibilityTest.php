<?php

use App\Models\User;
use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Services\AIService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'email' => 'test_persona@example.com',
        'name' => 'Test Persona User'
    ]);
});

it('can test drafter persona compatibility', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Drafter Sequential Images',
        'chat_type' => 'persona',
        'persona' => 'drafter'
    ]);

    expect($session->persona)->toBe('drafter');
    expect($session->chat_type)->toBe('persona');
    expect($session->user_id)->toBe($this->user->id);
});

it('can test engineer persona compatibility', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Engineer Session',
        'chat_type' => 'persona',
        'persona' => 'engineer'
    ]);

    expect($session->persona)->toBe('engineer');
    expect($session->chat_type)->toBe('persona');
});

it('can test ai service with different personas', function () {
    $aiService = new AIService();
    
    // Test that AIService can be instantiated
    expect($aiService)->toBeInstanceOf(AIService::class);
})->skip('This test requires actual API calls and may be slow');
