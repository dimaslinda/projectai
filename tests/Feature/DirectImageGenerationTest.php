<?php

use App\Services\AIService;

it('can detect image generation intent for Indonesian text', function () {
    $aiService = new AIService();
    $testMessage = "Buatkan gambar kucing lucu";
    
    // Test intent detection
    $reflection = new ReflectionClass($aiService);
    $intentMethod = $reflection->getMethod('isTextToImagePrompt');
    $intentMethod->setAccessible(true);
    
    $isImageIntent = $intentMethod->invoke($aiService, $testMessage);
    
    expect($isImageIntent)->toBeTrue();
});

it('can test individual detection methods', function () {
    $aiService = new AIService();
    $testMessage = "Buatkan gambar kucing lucu";
    
    $reflection = new ReflectionClass($aiService);
    
    // Test keyword detection
    $keywordMethod = $reflection->getMethod('enhancedKeywordDetection');
    $keywordMethod->setAccessible(true);
    $keywordDetected = $keywordMethod->invoke($aiService, $testMessage);
    
    expect($keywordDetected)->toBeTrue();
});

it('can generate response for image request', function () {
    $aiService = new AIService();
    $testMessage = "Buatkan gambar kucing lucu";
    
    // Test full AIService response
    $response = $aiService->generateResponse($testMessage, null, [], 'global');
    
    expect($response)->toBeArray();
    expect($response)->toHaveKey('type');
})->skip('This test requires actual API calls and may be slow');