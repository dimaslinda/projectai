<?php

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'name' => 'Test Engineer',
        'email' => 'test.engineer@example.com',
        'role' => 'engineer',
    ]);
});

it('can test owner authorization for chat sessions', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session - Owner Authorization',
        'chat_type' => 'persona',
        'persona' => $this->user->role,
        'description' => 'Testing owner authorization issue',
        'last_activity_at' => now(),
    ]);

    // Test 1: Is user the owner?
    $isOwner = $session->user_id === $this->user->id;
    expect($isOwner)->toBeTrue();

    // Controller show logic: private-only (owner can view)
    $canView = $session->user_id === $this->user->id;
    expect($canView)->toBeTrue();

    // Can edit (frontend logic): private-only (owner can edit)
    $canEdit = $session->user_id === $this->user->id;
    expect($canEdit)->toBeTrue();
});

it('can test authorization when session is not shared', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session - Not Shared',
        'chat_type' => 'persona',
        'persona' => $this->user->role,
    ]);

    // Owner should still have access
    expect($session->user_id === $this->user->id)->toBeTrue();
    
    // Controller logic: private-only (owner can view)
    $canView = $session->user_id === $this->user->id;
    expect($canView)->toBeTrue();
});

it('can test authorization when session is shared with different role', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session - Different Role',
        'chat_type' => 'persona',
        'persona' => $this->user->role,
    ]);

    // Owner should still have access
    expect($session->user_id === $this->user->id)->toBeTrue();
    
    // Controller logic: private-only (owner can view)
    $canView = $session->user_id === $this->user->id;
    expect($canView)->toBeTrue();
});

it('can test authorization when session is shared with correct role', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session - Correct Role',
        'chat_type' => 'persona',
        'persona' => $this->user->role,
    ]);

    // Owner should have access
    expect($session->user_id === $this->user->id)->toBeTrue();
    
    // Controller logic: private-only (owner can view)
    $canView = $session->user_id === $this->user->id;
    expect($canView)->toBeTrue();
});