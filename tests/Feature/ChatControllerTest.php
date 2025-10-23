<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Http\Controllers\ChatController;
use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing ChatController Image Generation\n";
echo "=====================================\n\n";

try {
    // Create a test user
    $user = User::first();
    if (!$user) {
        echo "❌ No user found in database\n";
        exit(1);
    }

    // Create a test chat session
    $session = ChatSession::create([
        'user_id' => $user->id,
        'persona' => null, // Use null for general chat
        'chat_type' => 'general',
        'title' => 'Test Image Generation'
    ]);

    echo "✅ Test session created: {$session->id}\n";

    // Create mock request
    $request = new Request();
    $request->merge([
        'message' => 'Buatkan gambar kucing yang sedang bermain',
        'persona' => null,
        'chat_type' => 'general',
        'session_id' => $session->id
    ]);

    // Test the chat controller
    $controller = new ChatController();

    echo "🔄 Sending image generation request...\n";

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
        $session
    );

    echo "\n📋 Response Analysis:\n";
    echo "Type: " . gettype($response) . "\n";

    if (is_array($response)) {
        echo "Keys: " . implode(', ', array_keys($response)) . "\n";
        echo "Response text: " . substr($response['response'] ?? '', 0, 100) . "...\n";

        // Debug the image_url value
        echo "Image URL value: '" . ($response['image_url'] ?? 'NOT_SET') . "'\n";
        echo "Image URL type: " . gettype($response['image_url'] ?? null) . "\n";
        echo "Image URL empty check: " . (empty($response['image_url']) ? 'TRUE' : 'FALSE') . "\n";

        if (isset($response['image_url']) && !empty($response['image_url'])) {
            echo "✅ SUCCESS: Image URL found!\n";
            echo "Image URL: " . $response['image_url'] . "\n";
            echo "Type: " . ($response['type'] ?? 'unknown') . "\n";
        } else {
            echo "❌ FAILED: No image URL in response\n";
            if (isset($response['image_url'])) {
                echo "Image URL is set but empty: '" . $response['image_url'] . "'\n";
            } else {
                echo "Image URL key is not set\n";
            }
        }

        if (isset($response['token_usage'])) {
            echo "Token usage: " . json_encode($response['token_usage']) . "\n";
        }
    } else {
        echo "❌ FAILED: Response is not an array\n";
        echo "Response: " . substr($response, 0, 200) . "...\n";
    }

    // Clean up
    $session->delete();
    echo "\n🧹 Test session cleaned up\n";
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n====================================\n";
echo "Test completed.\n";
