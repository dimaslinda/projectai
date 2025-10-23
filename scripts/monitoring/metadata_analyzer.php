<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\ChatHistory;
use App\Models\ChatSession;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Comprehensive Metadata Analyzer ===\n\n";

class MetadataAnalyzer
{
    public function analyzeImageMetadata()
    {
        echo "🖼️  ANALYZING IMAGE METADATA\n";
        echo str_repeat("=", 50) . "\n\n";

        try {
            // Find chat histories with generated images
            $imageHistories = ChatHistory::whereRaw("JSON_EXTRACT(metadata, '$.generated_image') IS NOT NULL")
                ->latest()
                ->take(10)
                ->get();

            if ($imageHistories->count() > 0) {
                echo "✓ Found {$imageHistories->count()} chat histories with image metadata:\n\n";

                foreach ($imageHistories as $history) {
                    echo "📝 Chat History ID: {$history->id}\n";
                    echo "   - Session ID: {$history->chat_session_id}\n";
                    echo "   - User ID: {$history->user_id}\n";
                    echo "   - Sender: {$history->sender}\n";
                    echo "   - Created: {$history->created_at}\n";
                    echo "   - Message: " . substr($history->message, 0, 100) . "...\n";

                    $metadata = $history->metadata;
                    if (isset($metadata['generated_image'])) {
                        echo "   - Generated Image: {$metadata['generated_image']}\n";

                        // Check if file exists
                        $imagePath = str_replace('https://projectai.test/storage/', '', $metadata['generated_image']);
                        $fullPath = storage_path('app/public/' . $imagePath);

                        if (file_exists($fullPath)) {
                            echo "   - ✅ Image file exists: $fullPath\n";
                        } else {
                            echo "   - ❌ Image file missing: $fullPath\n";
                        }
                    }

                    if (isset($metadata['response_type'])) {
                        echo "   - Response Type: {$metadata['response_type']}\n";
                    }

                    echo "\n";
                }
            } else {
                echo "❌ No chat histories with image metadata found\n\n";
            }
        } catch (Exception $e) {
            echo "❌ Error analyzing image metadata: " . $e->getMessage() . "\n\n";
        }
    }

    public function analyzeRecentMetadata()
    {
        echo "📊 ANALYZING RECENT METADATA\n";
        echo str_repeat("=", 50) . "\n\n";

        try {
            // Get the most recent chat histories
            $recentChats = ChatHistory::orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            echo "Found " . $recentChats->count() . " recent chat histories:\n\n";

            foreach ($recentChats as $chat) {
                echo "Chat ID: {$chat->id}\n";
                echo "Session ID: {$chat->chat_session_id}\n";
                echo "Sender: {$chat->sender}\n";
                echo "Message: " . substr($chat->message, 0, 100) . "...\n";
                echo "Created: {$chat->created_at}\n";

                if ($chat->metadata) {
                    echo "Metadata: " . json_encode($chat->metadata, JSON_PRETTY_PRINT) . "\n";

                    // Check specifically for image-related metadata
                    if (isset($chat->metadata['generated_image'])) {
                        echo "✅ Has generated_image: {$chat->metadata['generated_image']}\n";
                    } else {
                        echo "❌ No generated_image metadata\n";
                    }

                    if (isset($chat->metadata['response_type'])) {
                        echo "✅ Has response_type: {$chat->metadata['response_type']}\n";
                    }
                } else {
                    echo "❌ No metadata found\n";
                }

                echo "\n" . str_repeat("-", 30) . "\n\n";
            }
        } catch (Exception $e) {
            echo "❌ Error analyzing recent metadata: " . $e->getMessage() . "\n\n";
        }
    }

    public function examineSpecificMetadata($searchTerm = 'gambar kucing')
    {
        echo "🔍 EXAMINING SPECIFIC METADATA\n";
        echo str_repeat("=", 50) . "\n\n";

        try {
            // Get the most recent chat history with specific search term
            $specificHistory = ChatHistory::where('sender', 'ai')
                ->where('message', 'like', "%{$searchTerm}%")
                ->latest()
                ->first();

            if ($specificHistory) {
                echo "📝 Examining Chat History ID: {$specificHistory->id}\n";
                echo "   - Session ID: {$specificHistory->chat_session_id}\n";
                echo "   - User ID: {$specificHistory->user_id}\n";
                echo "   - Created: {$specificHistory->created_at}\n";
                echo "   - Message: " . substr($specificHistory->message, 0, 200) . "...\n\n";

                echo "📋 Full Metadata:\n";
                $metadata = $specificHistory->metadata;
                echo json_encode($metadata, JSON_PRETTY_PRINT) . "\n\n";

                // Check if there's an image URL in the message content
                if (preg_match('/https:\/\/[^\s\)]+\.png/', $specificHistory->message, $matches)) {
                    echo "🔍 Found image URL in message: {$matches[0]}\n";

                    // Check if file exists
                    $imageUrl = $matches[0];
                    $imagePath = str_replace('https://projectai.test/storage/', '', $imageUrl);
                    $fullPath = storage_path('app/public/' . $imagePath);

                    if (file_exists($fullPath)) {
                        echo "✅ Image file exists: $fullPath\n";
                    } else {
                        echo "❌ Image file missing: $fullPath\n";
                    }
                }

                // Check if this was created before our metadata update
                echo "\n🕐 Checking if this was created before metadata update...\n";
                if ($specificHistory->created_at < now()->subMinutes(30)) {
                    echo "⚠️  This chat history was created before our metadata update\n";
                } else {
                    echo "✅ This chat history was created after our metadata update\n";
                }
            } else {
                echo "❌ No chat history found with search term: '{$searchTerm}'\n\n";
            }
        } catch (Exception $e) {
            echo "❌ Error examining specific metadata: " . $e->getMessage() . "\n\n";
        }
    }

    public function generateSummaryReport()
    {
        echo "📈 METADATA SUMMARY REPORT\n";
        echo str_repeat("=", 50) . "\n\n";

        try {
            // Count total chat histories
            $totalChats = ChatHistory::count();
            echo "📊 Total Chat Histories: {$totalChats}\n";

            // Count chat histories with metadata
            $chatsWithMetadata = ChatHistory::whereNotNull('metadata')->count();
            echo "📊 Chats with Metadata: {$chatsWithMetadata}\n";

            // Count chat histories with image metadata
            $chatsWithImages = ChatHistory::whereRaw("JSON_EXTRACT(metadata, '$.generated_image') IS NOT NULL")->count();
            echo "📊 Chats with Image Metadata: {$chatsWithImages}\n";

            // Count by sender
            $aiChats = ChatHistory::where('sender', 'ai')->count();
            $userChats = ChatHistory::where('sender', 'user')->count();
            echo "📊 AI Messages: {$aiChats}\n";
            echo "📊 User Messages: {$userChats}\n";

            // Recent activity (last 24 hours)
            $recentActivity = ChatHistory::where('created_at', '>=', now()->subDay())->count();
            echo "📊 Recent Activity (24h): {$recentActivity}\n\n";

        } catch (Exception $e) {
            echo "❌ Error generating summary report: " . $e->getMessage() . "\n\n";
        }
    }
}

// Main execution
$analyzer = new MetadataAnalyzer();

// Check command line arguments for specific analysis
$args = $argv ?? [];
if (count($args) > 1) {
    switch ($args[1]) {
        case 'images':
            $analyzer->analyzeImageMetadata();
            break;
        case 'recent':
            $analyzer->analyzeRecentMetadata();
            break;
        case 'examine':
            $searchTerm = $args[2] ?? 'gambar kucing';
            $analyzer->examineSpecificMetadata($searchTerm);
            break;
        case 'summary':
            $analyzer->generateSummaryReport();
            break;
        case 'all':
        default:
            $analyzer->generateSummaryReport();
            $analyzer->analyzeImageMetadata();
            $analyzer->analyzeRecentMetadata();
            $analyzer->examineSpecificMetadata();
            break;
    }
} else {
    // Default: run all analyses
    $analyzer->generateSummaryReport();
    $analyzer->analyzeImageMetadata();
    $analyzer->analyzeRecentMetadata();
    $analyzer->examineSpecificMetadata();
}

echo "\n✅ Metadata analysis complete!\n";
echo "\nUsage: php metadata_analyzer.php [images|recent|examine|summary|all] [search_term]\n";
echo "Examples:\n";
echo "  php metadata_analyzer.php images     - Analyze only image metadata\n";
echo "  php metadata_analyzer.php recent     - Analyze only recent metadata\n";
echo "  php metadata_analyzer.php examine    - Examine specific metadata\n";
echo "  php metadata_analyzer.php summary    - Generate summary report only\n";
echo "  php metadata_analyzer.php all        - Run all analyses (default)\n";