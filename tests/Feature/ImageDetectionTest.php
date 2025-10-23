<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Services\AIService;
use Illuminate\Support\Facades\Log;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Image Detection Patterns ===\n\n";

// Test prompts
$testPrompts = [
    "Create a simple drawing of a red apple",
    "Generate a structural diagram of a simple beam with supports",
    "Buat gambar apel merah",
    "Buatkan gambar struktur bangunan",
    "Generate image of a house",
    "Draw a cat",
    "Show me a picture of a car",
    "Gambarkan sebuah mobil",
    "Visualisasi struktur jembatan",
    "Design a logo",
    "Hello, how are you?",
    "What is the weather today?"
];

// Initialize AIService
$aiService = new AIService();

// Use reflection to access private method
$reflection = new ReflectionClass($aiService);
$method = $reflection->getMethod('isTextToImagePrompt');
$method->setAccessible(true);

foreach ($testPrompts as $prompt) {
    echo "Testing: \"$prompt\"\n";
    $isImagePrompt = $method->invoke($aiService, $prompt);
    echo "Result: " . ($isImagePrompt ? "✓ IMAGE DETECTED" : "✗ Not image") . "\n\n";
}

echo "=== Test Complete ===\n";