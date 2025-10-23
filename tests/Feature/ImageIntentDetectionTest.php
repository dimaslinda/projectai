<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Services\AIService;

// Bootstrap Laravel
$app = Application::configure(basePath: __DIR__)
    ->withRouting(
        web: __DIR__ . '/routes/web.php',
        commands: __DIR__ . '/routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Testing Image Intent Detection ===\n\n";

$aiService = new AIService();

// Test messages that should trigger image generation
$testMessages = [
    "buatkan gambar kucing sedang balapan",
    "saya ingin melihat gambar gajah melompat",
    "Tentu, ini dia gambar kucing sedang balapan untuk Anda!",
    "buatkan gambar kucing lucu",
    "generate image of a cat",
    "create a picture of a dog",
    "show me a visual of mountains",
    "hello, how are you?", // This should NOT trigger image generation
    "what is the weather today?" // This should NOT trigger image generation
];

foreach ($testMessages as $message) {
    echo "Testing message: \"$message\"\n";

    // Use reflection to access private method
    $reflection = new ReflectionClass($aiService);
    $method = $reflection->getMethod('isTextToImagePrompt');
    $method->setAccessible(true);

    $isImagePrompt = $method->invoke($aiService, $message);

    echo "Result: " . ($isImagePrompt ? "✅ IMAGE PROMPT" : "❌ NOT IMAGE PROMPT") . "\n";
    echo "---\n\n";
}

echo "=== Testing Full AI Response Generation ===\n\n";

// Test with a clear image generation request
$testMessage = "buatkan gambar kucing sedang balapan";
echo "Testing full response generation for: \"$testMessage\"\n\n";

try {
    $response = $aiService->generateResponse(
        $testMessage,
        null, // persona
        [], // chat history
        'global', // chat type
        [], // image urls
        'gemini-2.5-flash-image' // selected model
    );

    echo "Response type: " . (is_array($response) ? 'array' : 'string') . "\n";

    if (is_array($response)) {
        echo "Response keys: " . implode(', ', array_keys($response)) . "\n";
        echo "Response text: " . substr($response['response'] ?? '', 0, 200) . "...\n";
        echo "Image URL: " . ($response['image_url'] ?? 'null') . "\n";
        echo "Type: " . ($response['type'] ?? 'null') . "\n";

        if (!empty($response['image_url'])) {
            echo "✅ SUCCESS: Image URL generated!\n";

            // Check if file exists
            $imagePath = str_replace(asset('storage/'), storage_path('app/public/'), $response['image_url']);
            if (file_exists($imagePath)) {
                echo "✅ Image file exists at: $imagePath\n";
                echo "File size: " . filesize($imagePath) . " bytes\n";
            } else {
                echo "❌ Image file not found at: $imagePath\n";
            }
        } else {
            echo "❌ FAILED: No image URL in response\n";
        }
    } else {
        echo "Response: " . substr($response, 0, 200) . "...\n";
        echo "❌ FAILED: Response is not an array (should be array for image generation)\n";
    }
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";