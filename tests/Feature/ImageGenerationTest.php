<?php

require_once __DIR__ . '/../../vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\AIService;
use Illuminate\Support\Facades\Log;

// Test message
$testMessage = "Saya ingin melihat gambar kucing lucu";

echo "Testing Image Generation with message: \"$testMessage\"\n";
echo "================================================\n\n";

try {
    // Create AIService instance
    $aiService = new AIService();

    // Test the isTextToImagePrompt method directly
    $reflection = new ReflectionClass($aiService);
    $method = $reflection->getMethod('isTextToImagePrompt');
    $method->setAccessible(true);

    $isImagePrompt = $method->invoke($aiService, $testMessage);

    echo "1. Intent Detection Result: " . ($isImagePrompt ? "✅ IMAGE INTENT DETECTED" : "❌ NO IMAGE INTENT") . "\n\n";

    if ($isImagePrompt) {
        echo "2. Testing full AI response...\n";

        // Test full response
        $response = $aiService->generateResponse(
            $testMessage,
            'default',  // persona
            [],  // chat history
            'general',  // chat type
            [],  // image URLs
            null  // selected model
        );

        echo "3. Response received:\n";
        echo "Type: " . gettype($response) . "\n";

        if (is_array($response)) {
            echo "Response keys: " . implode(', ', array_keys($response)) . "\n";
            echo "Response text: " . ($response['response'] ?? 'No response text') . "\n";
            echo "Image URL: " . ($response['image_url'] ?? 'No image URL') . "\n";
            echo "Type: " . ($response['type'] ?? 'No type specified') . "\n";

            if (isset($response['image_url']) && !empty($response['image_url'])) {
                echo "\n✅ SUCCESS: Image generation detected!\n";
                echo "Image URL: " . $response['image_url'] . "\n";
            } else {
                echo "\n❌ FAILED: No image URL in response\n";
            }
        } else {
            echo "Response length: " . strlen($response) . "\n";
            echo "Response preview: " . substr($response, 0, 200) . "\n";
            echo "\n❌ FAILED: Expected array response for image generation\n";
        }
    }
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n================================================\n";
echo "Test completed.\n";
