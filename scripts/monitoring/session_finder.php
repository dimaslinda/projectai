<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use App\Models\ChatHistory;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Finding Active Session from Screenshot\n";
echo "========================================\n\n";

// Get test user
$user = User::where('email', 'test@example.com')->first();
if (!$user) {
    echo "❌ Test user not found!\n";
    exit(1);
}

// Look for the specific message from screenshot: "buatkan gambar kucing sedang belapan"
$targetMessage = ChatHistory::where('user_id', $user->id)
    ->where('message', 'like', '%kucing sedang belapan%')
    ->orderBy('created_at', 'desc')
    ->first();

if ($targetMessage) {
    echo "🎯 Found target message from screenshot:\n";
    echo "  Message: {$targetMessage->message}\n";
    echo "  Session ID: {$targetMessage->chat_session_id}\n";
    echo "  Time: {$targetMessage->created_at}\n\n";

    // Get the session details
    $session = ChatSession::find($targetMessage->chat_session_id);
    if ($session) {
        echo "📋 Session Details:\n";
        echo "  ID: {$session->id}\n";
        echo "  Title: {$session->title}\n";
        echo "  Chat Type: {$session->chat_type}\n";
        echo "  Persona: " . ($session->persona ?? 'null') . "\n";
        echo "  Created: {$session->created_at}\n";
        echo "  Updated: {$session->updated_at}\n\n";

        // Check if this session can generate images
        if ($session->chat_type === 'global' || $session->persona === null) {
            echo "  ✅ This session SHOULD be able to generate images\n";
        } else {
            echo "  ❌ This session CANNOT generate images (persona: {$session->persona})\n";
            echo "  💡 Persona '{$session->persona}' likely blocks image generation\n";
        }

        // Look for AI response to this message
        $aiResponse = ChatHistory::where('chat_session_id', $session->id)
            ->where('sender', 'ai')
            ->where('created_at', '>', $targetMessage->created_at)
            ->first();

        if ($aiResponse) {
            echo "\n🤖 AI Response:\n";
            echo "  Message: " . substr($aiResponse->message, 0, 200) . "...\n";
            echo "  Time: {$aiResponse->created_at}\n";

            if ($aiResponse->metadata && isset($aiResponse->metadata['generated_image'])) {
                echo "  ✅ Generated image: {$aiResponse->metadata['generated_image']}\n";
            } else {
                echo "  ❌ No image generated\n";
            }
        }
    }
} else {
    echo "❌ Target message not found. Let's check recent messages:\n\n";

    // Show recent messages that might match
    $recentMessages = ChatHistory::where('user_id', $user->id)
        ->where('message', 'like', '%kucing%')
        ->orWhere('message', 'like', '%belapan%')
        ->orWhere('message', 'like', '%balapan%')
        ->orderBy('created_at', 'desc')
        ->limit(10)
        ->get();

    foreach ($recentMessages as $msg) {
        $session = ChatSession::find($msg->chat_session_id);
        echo "📝 Message: {$msg->message}\n";
        echo "   Session: {$msg->chat_session_id} ({$session->title})\n";
        echo "   Type: {$session->chat_type} | Persona: " . ($session->persona ?? 'null') . "\n";
        echo "   Time: {$msg->created_at}\n\n";
    }
}

// Also check all sessions to see which one might be the "Gemini 2.5 Flash Image"
echo "\n🔍 All Sessions (looking for Gemini/Flash/Image):\n";
$allSessions = ChatSession::where('user_id', $user->id)
    ->orderBy('updated_at', 'desc')
    ->get();

foreach ($allSessions as $session) {
    $type = $session->chat_type === 'global' ? '🌍 Global' : "👤 Persona ({$session->persona})";
    echo "  - ID: {$session->id} | {$session->title} | {$type}\n";

    if (
        stripos($session->title, 'gemini') !== false ||
        stripos($session->title, 'flash') !== false ||
        stripos($session->title, 'image') !== false
    ) {
        echo "    ⭐ This might be the session from screenshot!\n";
    }
}

echo "\n✅ Analysis completed!\n";
