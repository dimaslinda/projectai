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
        echo "Is Shared: " . ($session->is_shared ? 'Yes' : 'No') . "\n";
        echo "Shared with roles: " . json_encode($session->shared_with_roles) . "\n";
        echo "Created: {$session->created_at}\n";
        echo "Last Activity: {$session->last_activity_at}\n";
        
        // Test authorization for the owner
        $owner = $session->user;
        $canViewByRole = $session->canBeViewedByRole($owner->role);
        $canView = $session->user_id === $owner->id || $canViewByRole;
        $canEdit = $session->user_id === $owner->id;
        
        echo "Authorization for owner:\n";
        echo "  - Can view by role: " . ($canViewByRole ? 'Yes' : 'No') . "\n";
        echo "  - Can view (controller): " . ($canView ? 'Yes' : 'No') . "\n";
        echo "  - Can edit (frontend): " . ($canEdit ? 'Yes' : 'No') . "\n";
        
        // Check if there are any issues
        $issues = [];
        
        if (!$canEdit) {
            $issues[] = "Owner cannot edit their own session";
        }
        
        if (!$canView) {
            $issues[] = "Owner cannot view their own session";
        }
        
        if ($session->is_shared && empty($session->shared_with_roles)) {
            $issues[] = "Session is marked as shared but has no shared roles";
        }
        
        if (!$session->is_shared && !empty($session->shared_with_roles)) {
            $issues[] = "Session is not shared but has shared roles defined";
        }
        
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
    
    $problemSessions = ChatSession::where(function($query) {
        $query->where('is_shared', true)
              ->whereNull('shared_with_roles');
    })->orWhere(function($query) {
        $query->where('is_shared', false)
              ->whereNotNull('shared_with_roles');
    })->get();
    
    if ($problemSessions->count() > 0) {
        echo "Found {$problemSessions->count()} sessions with potential issues:\n\n";
        foreach ($problemSessions as $session) {
            echo "Session ID {$session->id}: {$session->title}\n";
            echo "  - is_shared: " . ($session->is_shared ? 'true' : 'false') . "\n";
            echo "  - shared_with_roles: " . json_encode($session->shared_with_roles) . "\n\n";
        }
    } else {
        echo "No sessions with obvious configuration issues found.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Check Complete ===\n";