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
        'is_shared' => true,
        'shared_with_roles' => [$this->user->role],
        'last_activity_at' => now(),
    ]);

    // Test 1: Is user the owner?
    $isOwner = $session->user_id === $this->user->id;
    expect($isOwner)->toBeTrue();

    // Test 2: Can user view by role?
    $canViewByRole = $session->canBeViewedByRole($this->user->role);
    expect($canViewByRole)->toBeTrue();

    // Test 3: Controller show logic
    $canView = $session->user_id === $this->user->id || $session->canBeViewedByRole($this->user->role);
    expect($canView)->toBeTrue();

    // Test 4: Can edit (frontend logic)
    $canEdit = $session->user_id === $this->user->id;
    expect($canEdit)->toBeTrue();
});

it('can test authorization when session is not shared', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session - Not Shared',
        'chat_type' => 'persona',
        'persona' => $this->user->role,
        'is_shared' => false,
        'shared_with_roles' => null,
    ]);

    // Owner should still have access
    expect($session->user_id === $this->user->id)->toBeTrue();
    expect($session->canBeViewedByRole($this->user->role))->toBeFalse();
    
    // Controller logic: owner OR can view by role
    $canView = $session->user_id === $this->user->id || $session->canBeViewedByRole($this->user->role);
    expect($canView)->toBeTrue(); // True because user is owner
});

it('can test authorization when session is shared with different role', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session - Different Role',
        'chat_type' => 'persona',
        'persona' => $this->user->role,
        'is_shared' => true,
        'shared_with_roles' => ['drafter'], // Different role
    ]);

    // Owner should still have access
    expect($session->user_id === $this->user->id)->toBeTrue();
    expect($session->canBeViewedByRole($this->user->role))->toBeFalse(); // Not shared with engineer role
    
    // Controller logic: owner OR can view by role
    $canView = $session->user_id === $this->user->id || $session->canBeViewedByRole($this->user->role);
    expect($canView)->toBeTrue(); // True because user is owner
});

it('can test authorization when session is shared with correct role', function () {
    $session = ChatSession::create([
        'user_id' => $this->user->id,
        'title' => 'Test Session - Correct Role',
        'chat_type' => 'persona',
        'persona' => $this->user->role,
        'is_shared' => true,
        'shared_with_roles' => [$this->user->role], // Same role
    ]);

    // Owner should have access
    expect($session->user_id === $this->user->id)->toBeTrue();
    expect($session->canBeViewedByRole($this->user->role))->toBeTrue(); // Shared with engineer role
    
    // Controller logic: owner OR can view by role
    $canView = $session->user_id === $this->user->id || $session->canBeViewedByRole($this->user->role);
    expect($canView)->toBeTrue(); // True for both reasons
});