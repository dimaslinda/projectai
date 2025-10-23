<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use App\Models\ChatHistory;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Checking Current Session Configuration\n";
echo "========================================\n\n";

// Get test user
$user = User::where('email', 'test@example.com')->first();
if (!$user) {
    echo "❌ Test user not found!\n";
    exit(1);
}

// Look for sessions with "Gemini" in title (from screenshot)
$geminiSessions = ChatSession::where('user_id', $user->id)
    ->where('title', 'like', '%Gemini%')
    ->orWhere('title', 'like', '%Flash%')
    ->orWhere('title', 'like', '%Image%')
    ->orderBy('updated_at', 'desc')
    ->get();

echo "🔍 Sessions matching 'Gemini/Flash/Image':\n";
foreach ($geminiSessions as $session) {
    $type = $session->chat_type === 'global' ? '🌍 Global' : "👤 Persona ({$session->persona})";
    echo "  - ID: {$session->id} | {$session->title} | {$type}\n";
    echo "    Chat Type: {$session->chat_type}\n";
    echo "    Persona: " . ($session->persona ?? 'null') . "\n";
    echo "    Updated: {$session->updated_at}\n\n";

    // Check recent messages in this session
    $recentMessages = ChatHistory::where('chat_session_id', $session->id)
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get();

    echo "    Recent messages:\n";
    foreach ($recentMessages as $msg) {
        echo "      - {$msg->sender}: " . substr($msg->message, 0, 50) . "...\n";
        echo "        Time: {$msg->created_at}\n";
        if ($msg->metadata && isset($msg->metadata['generated_image'])) {
            echo "        ✅ Has image: {$msg->metadata['generated_image']}\n";
        }
    }
    echo "\n";
}

// Check the most recent session activity
echo "🕐 Most Recent Session Activity:\n";
$latestSession = ChatSession::where('user_id', $user->id)
    ->orderBy('updated_at', 'desc')
    ->first();

if ($latestSession) {
    echo "  Session ID: {$latestSession->id}\n";
    echo "  Title: {$latestSession->title}\n";
    echo "  Type: {$latestSession->chat_type}\n";
    echo "  Persona: " . ($latestSession->persona ?? 'null') . "\n";
    echo "  Updated: {$latestSession->updated_at}\n\n";

    // Check if this session can generate images
    if ($latestSession->chat_type === 'global' || $latestSession->persona === null) {
        echo "  ✅ This session SHOULD be able to generate images\n";
    } else {
        echo "  ❌ This session may NOT generate images (persona: {$latestSession->persona})\n";
    }
}

// Look for recent image requests that failed
echo "\n🔍 Recent Failed Image Requests:\n";
$failedRequests = ChatHistory::where('user_id', $user->id)
    ->where('created_at', '>', now()->subHours(2))
    ->where(function ($query) {
        $query->where('message', 'like', '%gambar%')
            ->orWhere('message', 'like', '%image%')
            ->orWhere('message', 'like', '%buatkan%');
    })
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($failedRequests as $request) {
    $session = ChatSession::find($request->chat_session_id);
    echo "  Request: " . substr($request->message, 0, 50) . "...\n";
    echo "  Session: {$request->chat_session_id} ({$session->chat_type})\n";
    echo "  Persona: " . ($session->persona ?? 'null') . "\n";
    echo "  Time: {$request->created_at}\n";

    // Look for AI response
    $aiResponse = ChatHistory::where('chat_session_id', $request->chat_session_id)
        ->where('sender', 'ai')
        ->where('created_at', '>', $request->created_at)
        ->first();

    if ($aiResponse) {
        echo "  AI Response: " . substr($aiResponse->message, 0, 100) . "...\n";
        if ($aiResponse->metadata && isset($aiResponse->metadata['generated_image'])) {
            echo "  ✅ Generated image successfully\n";
        } else {
            echo "  ❌ No image generated\n";
        }
    }
    echo "\n";
}

echo "✅ Session analysis completed!\n";
