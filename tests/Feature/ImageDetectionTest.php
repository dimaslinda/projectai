<?php

use App\Services\AIService;

it('can detect image generation prompts correctly', function () {
    $aiService = new AIService();
    
    $imagePrompts = [
        "Generate image of a house",
        "Create picture of a cat", 
        "Make image of a car",
        "Buat gambar apel merah",
        "Buatkan gambar struktur bangunan",
        "Draw a cat",
        "Design a logo",
        "Gambarkan sebuah mobil",
        "Visualisasi struktur jembatan",
        "Show me a picture"
    ];
    
    foreach ($imagePrompts as $prompt) {
        // Use reflection to access private method
        $reflection = new ReflectionClass($aiService);
        $method = $reflection->getMethod('isTextToImagePrompt');
        $method->setAccessible(true);
        
        $isImageRequest = $method->invoke($aiService, $prompt);
        expect($isImageRequest)->toBeTrue("Failed to detect image request: {$prompt}");
    }
});

it('can detect non-image prompts correctly', function () {
    $aiService = new AIService();
    
    $textPrompts = [
        "Hello, how are you?",
        "What is the weather today?",
        "Explain quantum physics",
        "Tell me a joke"
    ];
    
    foreach ($textPrompts as $prompt) {
        // Use reflection to access private method
        $reflection = new ReflectionClass($aiService);
        $method = $reflection->getMethod('isTextToImagePrompt');
        $method->setAccessible(true);
        
        $isImageRequest = $method->invoke($aiService, $prompt);
        expect($isImageRequest)->toBeFalse("Incorrectly detected as image request: {$prompt}");
    }
});