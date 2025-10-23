<?php

use App\Services\AIService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Image Intent Detection', function () {
    beforeEach(function () {
        $this->aiService = new AIService();
    });

    it('can detect image generation prompts correctly', function () {
        $testMessages = [
            ["buatkan gambar kucing sedang balapan", true],
            ["saya ingin melihat gambar gajah melompat", true],
            ["Tentu, ini dia gambar kucing sedang balapan untuk Anda!", false],
            ["buatkan gambar kucing lucu", true],
            ["generate image of a cat", true],
            ["create a picture of a dog", true],
            ["show me a visual of mountains", true],
            ["hello, how are you?", false],
            ["what is the weather today?", false]
        ];

        foreach ($testMessages as [$message, $expected]) {
            // Use reflection to access private method
            $reflection = new ReflectionClass($this->aiService);
            $method = $reflection->getMethod('isTextToImagePrompt');
            $method->setAccessible(true);

            $isImagePrompt = $method->invoke($this->aiService, $message);

            expect($isImagePrompt)->toBe($expected, "Message: '$message' should " . ($expected ? 'trigger' : 'not trigger') . ' image generation');
        }
    });

    it('can generate AI response with image generation', function () {
        $testMessage = "buatkan gambar kucing sedang balapan";

        // Skip this test as it requires actual API calls
        $this->markTestSkipped('Skipping AI response generation test as it requires API calls');

        // Uncomment below to test with actual API
        /*
        $response = $this->aiService->generateResponse(
            $testMessage,
            null, // persona
            [], // chat history
            'global', // chat type
            [], // image urls
            'gemini-2.5-flash-image' // selected model
        );

        expect($response)->toBeArray();
        expect($response)->toHaveKey('response');
        expect($response)->toHaveKey('image_url');
        expect($response)->toHaveKey('type');
        expect($response['image_url'])->not->toBeNull();
        */
    });
});