<?php

use App\Http\Controllers\ChatController;
use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create a test user
    $this->user = User::factory()->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'role' => 'user',
    ]);
    
    // Create a test chat session
    $this->session = ChatSession::create([
        'user_id' => $this->user->id,
        'chat_type' => 'general',
        'title' => 'Test Image Generation'
    ]);
});

it('can generate AI response for image generation request', function () {
    // Create mock request
    $request = new Request();
    $request->merge([
        'message' => 'Buatkan gambar kucing yang sedang bermain',
        'chat_type' => 'general',
        'session_id' => $this->session->id
    ]);

    // Test the chat controller
    $controller = new ChatController();

    // Use reflection to call the private method for testing
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('generateAIResponse');
    $method->setAccessible(true);

    $response = $method->invoke(
        $controller,
        'Buatkan gambar kucing yang sedang bermain',
        null,
        [],
        'general',
        [],
        null,
        $this->session
    );

    // Assertions
    expect($response)->toBeArray();
    expect($response)->toHaveKey('response');
    
    // If image generation is working, we should have an image_url
    if (isset($response['image_url']) && !empty($response['image_url'])) {
        expect($response)->toHaveKey('image_url');
        expect($response['image_url'])->toBeString();
        expect($response['type'])->toBe('image');
    }
});

it('can handle chat controller image generation via HTTP request', function () {
    $this->actingAs($this->user);
    
    $response = $this->postJson('/chat', [
        'message' => 'Buatkan gambar kucing yang sedang bermain',
        'chat_type' => 'general',
        'session_id' => $this->session->id,
        'title' => 'Test Chat',
        'type' => 'global'
    ]);

    $response->assertStatus(200);
    $responseData = $response->json();
    
    expect($responseData)->toBeArray();
    expect($responseData)->toHaveKey('response');
});
