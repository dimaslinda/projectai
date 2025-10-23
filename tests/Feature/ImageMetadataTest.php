<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Http\Controllers\ChatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Image Metadata Storage ===\n\n";

try {
    // Create a test chat session
    $session = ChatSession::create([
        'user_id' => 1,
        'title' => 'Test Image Metadata - ' . date('Y-m-d H:i:s'),
        'persona' => null,
        'chat_type' => 'global',
        'preferred_model' => 'gemini-2.5-flash-image'
    ]);

    echo "✓ Created test session: {$session->id}\n";

    // Create a mock request for image generation
    $request = new Request();
    $request->merge([
        'message' => 'buatkan gambar kucing lucu',
        'selected_model' => 'gemini-2.5-flash-image'
    ]);

    // Create controller instance
    $controller = new ChatController();

    // Use reflection to access private method
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('generateAIResponse');
    $method->setAccessible(true);

    echo "🔄 Generating AI response for image request...\n";

    // Call the generateAIResponse method
    $result = $method->invoke(
        $controller,
        'buatkan gambar kucing lucu',
        null, // persona
        [], // chat history
        'global', // chat type
        [], // image urls
        'gemini-2.5-flash-image', // selected model
        $session
    );

    echo "📊 AI Response Result:\n";
    echo "   - Response type: " . (is_array($result) ? 'array' : 'string') . "\n";

    if (is_array($result)) {
        echo "   - Response text: " . substr($result['response'] ?? '', 0, 100) . "...\n";
        echo "   - Image URL: " . ($result['image_url'] ?? 'null') . "\n";
        echo "   - Type: " . ($result['type'] ?? 'null') . "\n";

        if (!empty($result['image_url'])) {
            echo "✓ Image URL found in response\n";

            // Now test saving to database with metadata
            $metadata = [
                'persona' => null,
                'chat_type' => 'global',
                'timestamp' => now()->toISOString(),
                'images' => [],
                'is_error' => false,
            ];

            // Add image_url to metadata if this is an image generation response
            if (isset($result['image_url']) && !empty($result['image_url'])) {
                $metadata['generated_image'] = $result['image_url'];
                $metadata['response_type'] = $result['type'] ?? 'image';
            }

            // Save to chat history
            $chatHistory = ChatHistory::create([
                'user_id' => 1,
                'chat_session_id' => $session->id,
                'message' => $result['response'],
                'sender' => 'ai',
                'metadata' => $metadata,
            ]);

            echo "✓ Saved chat history with ID: {$chatHistory->id}\n";

            // Verify metadata was saved correctly
            $savedHistory = ChatHistory::find($chatHistory->id);
            $savedMetadata = $savedHistory->metadata;

            echo "📋 Saved Metadata:\n";
            echo "   - Generated Image: " . ($savedMetadata['generated_image'] ?? 'null') . "\n";
            echo "   - Response Type: " . ($savedMetadata['response_type'] ?? 'null') . "\n";

            if (!empty($savedMetadata['generated_image'])) {
                echo "✅ SUCCESS: Image URL properly saved to metadata!\n";

                // Check if image file exists
                $imagePath = public_path('storage/generated_images/' . basename($savedMetadata['generated_image']));
                if (file_exists($imagePath)) {
                    echo "✅ SUCCESS: Image file exists at: $imagePath\n";
                } else {
                    echo "❌ WARNING: Image file not found at: $imagePath\n";
                }
            } else {
                echo "❌ FAILED: Image URL not saved to metadata\n";
            }
        } else {
            echo "❌ FAILED: No image URL in response\n";
        }
    } else {
        echo "❌ FAILED: Response is not an array (no image generation)\n";
    }

    // Clean up
    $session->delete();
    echo "\n🧹 Cleaned up test session\n";
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";