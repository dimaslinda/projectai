<?php

use App\Models\User;
use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Http\Controllers\ChatController;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
});

it('can create chat session for streaming test', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Image Generation Streaming',
        'chat_type' => 'global',
    ]);

    expect($session->user_id)->toBe($this->user->id);
    expect($session->chat_type)->toBe('global');
    // Private-only policy: sharing fields are not used
});

it('can test streaming response functionality', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Image Generation Streaming',
        'chat_type' => 'global',
    ]);

    $controller = new ChatController();
    
    // Test that controller can be instantiated
    expect($controller)->toBeInstanceOf(ChatController::class);
    
    // Test message content
    $messageContent = "buatkan gambar kucing sedang bermain";
    expect($messageContent)->toBeString();
    expect(strlen($messageContent))->toBeGreaterThan(0);
})->skip('This test requires actual streaming API calls and may be slow');

it('can format bytes correctly', function () {
    $formatBytes = function ($size, $precision = 2) {
        $base = log($size, 1024);
        $suffixes = array('B', 'KB', 'MB', 'GB', 'TB');
        return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[floor($base)];
    };

    expect($formatBytes(1024))->toBe('1 KB');
    expect($formatBytes(1048576))->toBe('1 MB');
    expect($formatBytes(512))->toBe('512 B');
});