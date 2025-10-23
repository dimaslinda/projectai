<?php

use App\Services\AIService;

it('can detect image generation intent', function () {
    $aiService = new AIService();
    $testMessage = "Saya ingin melihat gambar kucing lucu";
    
    // Test the isTextToImagePrompt method directly
    $reflection = new ReflectionClass($aiService);
    $method = $reflection->getMethod('isTextToImagePrompt');
    $method->setAccessible(true);
    
    $isImagePrompt = $method->invoke($aiService, $testMessage);
    
    expect($isImagePrompt)->toBeTrue();
});

it('can generate image response', function () {
    $aiService = new AIService();
    $testMessage = "Saya ingin melihat gambar kucing lucu";
    
    // Test full response
    $response = $aiService->generateResponse(
        $testMessage,
        'default',  // persona
        [],  // chat history
        'general',  // chat type
        [],  // image URLs
        null  // selected model
    );
    
    expect($response)->toBeArray();
    expect($response)->toHaveKeys(['response', 'image_url', 'type']);
    expect($response['image_url'])->not()->toBeEmpty();
    expect($response['type'])->toBe('image');
})->skip('This test requires actual API calls and may be slow');
