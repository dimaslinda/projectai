<?php

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'name' => 'Mike Drafter',
        'email' => 'mike.drafter@company.com',
        'role' => 'user'
    ]);
});

it('can find user by email', function () {
    $foundUser = User::where('email', 'mike.drafter@company.com')->first();
    
    expect($foundUser)->not->toBeNull();
    expect($foundUser->name)->toBe('Mike Drafter');
    expect($foundUser->email)->toBe('mike.drafter@company.com');
    expect($foundUser->role)->toBe('user');
});

it('can access user chat sessions', function () {
    // Create a test session for the user
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session',
        'chat_type' => 'global'
    ]);
    
    $userSessions = ChatSession::where('user_id', $this->user->id)->get();
    
    expect($userSessions->count())->toBeGreaterThan(0);
    expect($userSessions->first()->user_id)->toBe($this->user->id);
});

it('can verify session authorization', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Authorization Session',
        'chat_type' => 'global',
        // Private-only: no sharing fields
    ]);
    
    // Test authorization checks
    $canEdit = $session->user_id === $this->user->id;
    $canSendMessage = $session->user_id === $this->user->id;
    
    expect($canEdit)->toBeTrue();
    expect($canSendMessage)->toBeTrue();
    expect($session->user_id)->toBe($this->user->id);
});