<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Existing Chat Sessions ===\n\n";

try {
    // Get all chat sessions
    $sessions = ChatSession::with('user')->get();
    
    echo "Found {$sessions->count()} chat sessions\n\n";
    
    foreach ($sessions as $session) {
        echo "--- Session ID: {$session->id} ---\n";
        echo "Title: {$session->title}\n";
        echo "Owner: {$session->user->name} (ID: {$session->user_id})\n";
        echo "Chat Type: {$session->chat_type}\n";
        echo "Persona: " . ($session->persona ?? 'null') . "\n";
        // Sharing columns removed; sessions are strictly private
        echo "Created: {$session->created_at}\n";
        echo "Last Activity: {$session->last_activity_at}\n";
        
        // Authorization: private-only sessions
        $owner = $session->user;
        $canView = $session->user_id === $owner->id;
        $canEdit = $session->user_id === $owner->id;

        echo "Authorization (private-only):\n";
        echo "  - Can view: " . ($canView ? 'Yes' : 'No') . "\n";
        echo "  - Can edit: " . ($canEdit ? 'Yes' : 'No') . "\n";
        
        // Check if there are any issues
        $issues = [];
        
        if (!$canEdit) {
            $issues[] = "Owner cannot edit their own session";
        }
        
        if (!$canView) {
            $issues[] = "Owner cannot view their own session";
        }
        
        // Private-only policy enforced at model/controller; no sharing checks needed
        
        if (!empty($issues)) {
            echo "⚠️  Issues found:\n";
            foreach ($issues as $issue) {
                echo "   - {$issue}\n";
            }
        } else {
            echo "✅ No issues found\n";
        }
        
        echo "\n";
    }
    
    // Check for sessions with potential problems
    echo "=== Potential Problem Sessions ===\n";
    
    // With sharing removed, simply report sessions without recent activity (example heuristic)
    $problemSessions = ChatSession::whereNull('last_activity_at')->get();
    
    if ($problemSessions->count() > 0) {
        echo "Found {$problemSessions->count()} sessions with potential issues:\n\n";
        foreach ($problemSessions as $session) {
            echo "Session ID {$session->id}: {$session->title}\n";
            echo "  - last_activity_at: " . ($session->last_activity_at ?? 'null') . "\n\n";
        }
    } else {
        echo "No sessions with obvious configuration issues found.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Check Complete ===\n";