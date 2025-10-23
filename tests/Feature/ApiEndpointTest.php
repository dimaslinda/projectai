<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Chat API Endpoint ===\n\n";

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

    // Simulate authenticated user
    Auth::login($user);
    echo "✓ Authenticated as user: {$user->name} (ID: {$user->id})\n";

    // Create a test chat session
    $session = ChatSession::create([
        'user_id' => $user->id,
        'title' => 'Test API Endpoint - ' . date('Y-m-d H:i:s'),
        'persona' => null,
        'chat_type' => 'global',
        'preferred_model' => 'gemini-2.5-flash-image'
    ]);

    echo "✓ Created test session: {$session->id}\n";

    // Simulate API request
    $postData = [
        'message' => 'buatkan gambar kucing lucu',
        'selected_model' => 'gemini-2.5-flash-image'
    ];

    echo "🔄 Simulating API request to /chat/{$session->id}/send...\n";
    echo "📤 Request data: " . json_encode($postData) . "\n\n";

    // Create a mock request
    $request = Request::create("/chat/{$session->id}/send", 'POST', $postData);
    $request->headers->set('Accept', 'application/json');
    $request->headers->set('Content-Type', 'application/json');

    // Get the controller
    $controller = app(\App\Http\Controllers\ChatController::class);

    // Call the sendMessage method
    $response = $controller->sendMessage($request, $session);

    echo "📥 Response received:\n";
    echo "   - Status: " . $response->getStatusCode() . "\n";

    $responseData = json_decode($response->getContent(), true);

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
        echo "Raw response: " . $response->getContent() . "\n";
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