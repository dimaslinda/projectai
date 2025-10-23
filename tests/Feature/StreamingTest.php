<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use App\Models\ChatHistory;
use Illuminate\Support\Facades\Log;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Testing Streaming Response for Image Generation\n";
echo "================================================\n\n";

// Get or create test user
$user = User::where('email', 'test@example.com')->first();
if (!$user) {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
        'email_verified_at' => now(),
    ]);
}

// Create a new chat session
$session = ChatSession::create([
    'user_id' => $user->id,
    'title' => 'Test Image Generation Streaming',
    'persona' => null,
    'chat_type' => 'global',
    'is_shared' => false,
]);

echo "✅ Created test session: {$session->id}\n\n";

// Simulate the streaming request
echo "🔄 Simulating streaming request...\n";

// Create a mock request
$messageContent = "buatkan gambar kucing sedang bermain";
$imageUrls = [];
$chatHistory = [];

// Import the ChatController
require_once __DIR__ . '/app/Http/Controllers/ChatController.php';

// Create controller instance
$controller = new \App\Http\Controllers\ChatController();

// Use reflection to access private method
$reflection = new ReflectionClass($controller);
$method = $reflection->getMethod('generateAIResponseStream');
$method->setAccessible(true);

echo "📡 Starting streaming simulation...\n";
echo "Message: '$messageContent'\n\n";

$chunks = [];
$imageData = null;

try {
    // Call the streaming method with a callback to capture chunks
    $result = $method->invoke(
        $controller,
        $messageContent,
        $session->persona,
        $chatHistory,
        $session->chat_type,
        $imageUrls,
        function ($chunk) use (&$chunks) {
            $chunks[] = $chunk;
            echo "📝 Chunk: " . trim($chunk) . "\n";
        },
        null, // selected model
        $session
    );

    echo "\n🎯 Final Result:\n";
    echo "Response: " . substr($result['response'], 0, 100) . "...\n";
    echo "Image URL: " . ($result['image_url'] ?? 'null') . "\n";
    echo "Type: " . ($result['type'] ?? 'null') . "\n";
    echo "Token Usage: " . ($result['token_usage'] ?? 'null') . "\n";

    // Check if image URL exists
    if (!empty($result['image_url'])) {
        echo "\n✅ Image URL generated successfully!\n";
        echo "🔗 URL: {$result['image_url']}\n";

        // Check if file exists
        $imagePath = str_replace(asset('storage/'), '', $result['image_url']);
        $fullPath = storage_path('app/public/' . $imagePath);

        if (file_exists($fullPath)) {
            echo "✅ Image file exists at: $fullPath\n";
            echo "📏 File size: " . formatBytes(filesize($fullPath)) . "\n";
        } else {
            echo "❌ Image file not found at: $fullPath\n";
        }

        // Simulate what the streaming response would send
        echo "\n📡 Simulated Streaming Events:\n";
        echo "1. Start event: " . json_encode(['type' => 'start', 'message' => 'AI mulai mengetik...']) . "\n";

        foreach ($chunks as $i => $chunk) {
            echo "2." . ($i + 1) . " Chunk event: " . json_encode(['type' => 'chunk', 'content' => $chunk]) . "\n";
        }

        echo "3. Image event: " . json_encode([
            'type' => 'image',
            'image_url' => $result['image_url'],
            'image_type' => $result['type'] ?? 'image'
        ]) . "\n";

        echo "4. Complete event: " . json_encode(['type' => 'complete']) . "\n";
    } else {
        echo "\n❌ No image URL in result!\n";
        echo "🔍 Full result structure:\n";
        print_r($result);
    }
} catch (Exception $e) {
    echo "\n❌ Error during streaming simulation: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

function formatBytes($size, $precision = 2)
{
    $base = log($size, 1024);
    $suffixes = array('B', 'KB', 'MB', 'GB', 'TB');
    return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[floor($base)];
}

echo "\n✅ Streaming test completed!\n";