<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Models\User;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Chat API with cURL ===\n\n";

try {
    // Get or create a test user
    $user = User::first();
    if (!$user) {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role' => 'user'
        ]);
    }

    echo "✓ Using user: {$user->name} (ID: {$user->id})\n";

    // Create a test chat session
    $session = ChatSession::create([
        'user_id' => $user->id,
        'title' => 'Test cURL API - ' . date('Y-m-d H:i:s'),
        'persona' => null,
        'chat_type' => 'global',
        'preferred_model' => 'gemini-2.5-flash-image'
    ]);

    echo "✓ Created test session: {$session->id}\n";

    // Prepare cURL request
    $url = "https://projectai.test/chat/{$session->id}/message";
    $postData = json_encode([
        'message' => 'buatkan gambar kucing lucu',
        'selected_model' => 'gemini-2.5-flash-image'
    ]);

    echo "🔄 Making cURL request to: $url\n";
    echo "📤 Request data: $postData\n\n";

    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-Requested-With: XMLHttpRequest'
    ]);

    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    echo "📥 Response received:\n";
    echo "   - HTTP Code: $httpCode\n";

    if ($error) {
        echo "❌ cURL Error: $error\n";
    } else {
        echo "   - Response length: " . strlen($response) . " characters\n";

        // Try to decode JSON response
        $responseData = json_decode($response, true);

        if ($responseData) {
            echo "   - Success: " . ($responseData['success'] ? 'true' : 'false') . "\n";

            if (isset($responseData['message'])) {
                echo "   - Message: " . substr($responseData['message'], 0, 100) . "...\n";
            }

            if (isset($responseData['image_url'])) {
                echo "   - Image URL: " . $responseData['image_url'] . "\n";
                echo "✅ SUCCESS: Image URL found in API response!\n";
            } else {
                echo "❌ FAILED: No image URL in API response\n";
            }

            if (isset($responseData['type'])) {
                echo "   - Response Type: " . $responseData['type'] . "\n";
            }
        } else {
            echo "❌ FAILED: Invalid JSON response\n";
            echo "Raw response (first 500 chars): " . substr($response, 0, 500) . "\n";
        }
    }

    // Check if chat history was saved with metadata
    echo "\n🔍 Checking saved chat history...\n";
    $latestHistory = ChatHistory::where('chat_session_id', $session->id)
        ->where('user_id', $user->id)
        ->where('sender', 'ai')
        ->latest()
        ->first();

    if ($latestHistory) {
        echo "✓ Found chat history record: {$latestHistory->id}\n";
        $metadata = $latestHistory->metadata;

        if (isset($metadata['generated_image'])) {
            echo "✅ SUCCESS: Generated image found in metadata: {$metadata['generated_image']}\n";
        } else {
            echo "❌ FAILED: No generated image in metadata\n";
            echo "Available metadata keys: " . implode(', ', array_keys($metadata)) . "\n";
        }

        if (isset($metadata['response_type'])) {
            echo "✓ Response type in metadata: {$metadata['response_type']}\n";
        }
    } else {
        echo "❌ FAILED: No chat history found\n";
    }

    // Clean up
    $session->delete();
    echo "\n🧹 Cleaned up test session\n";
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";