<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing Chat Sessions ===\n\n";

try {
    // Get all chat sessions
    $sessions = ChatSession::with('user')->get();
    
    echo "Found {$sessions->count()} chat sessions to check and fix\n\n";
    
    $fixedCount = 0;
    
    foreach ($sessions as $session) {
        echo "Checking Session ID: {$session->id} - {$session->title}\n";
        
        $needsFix = false;
        $fixes = [];
        
        // Check if session has proper sharing configuration
        if ($session->is_shared && empty($session->shared_with_roles)) {
            $needsFix = true;
            $fixes[] = "Setting shared_with_roles to owner's role";
            $session->shared_with_roles = [$session->user->role];
        }
        
        if (!$session->is_shared && !empty($session->shared_with_roles)) {
            $needsFix = true;
            $fixes[] = "Clearing shared_with_roles for non-shared session";
            $session->shared_with_roles = null;
        }
        
        // Ensure all sessions are shared by default (as per current logic)
        if (!$session->is_shared) {
            $needsFix = true;
            $fixes[] = "Enabling sharing and setting shared_with_roles";
            $session->is_shared = true;
            $session->shared_with_roles = [$session->user->role];
        }
        
        // Ensure shared_with_roles includes owner's role
        if ($session->is_shared && !in_array($session->user->role, $session->shared_with_roles ?? [])) {
            $needsFix = true;
            $fixes[] = "Adding owner's role to shared_with_roles";
            $currentRoles = $session->shared_with_roles ?? [];
            $currentRoles[] = $session->user->role;
            $session->shared_with_roles = array_unique($currentRoles);
        }
        
        if ($needsFix) {
            echo "  ⚠️  Fixes needed:\n";
            foreach ($fixes as $fix) {
                echo "     - {$fix}\n";
            }
            
            $session->save();
            $fixedCount++;
            echo "  ✅ Fixed\n";
        } else {
            echo "  ✅ No fixes needed\n";
        }
        
        echo "\n";
    }
    
    echo "=== Summary ===\n";
    echo "Total sessions checked: {$sessions->count()}\n";
    echo "Sessions fixed: {$fixedCount}\n";
    
    if ($fixedCount > 0) {
        echo "\n✅ All sessions have been fixed and should now work correctly.\n";
    } else {
        echo "\n✅ All sessions were already configured correctly.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Fix Complete ===\n";