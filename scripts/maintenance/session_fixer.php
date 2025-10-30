<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
        
        // Enforce private-only sessions: disable sharing and clear shared roles
        // Guard in case sharing columns have been removed by migration
        $hasIsShared = Schema::hasColumn('chat_sessions', 'is_shared');
        $hasSharedRoles = Schema::hasColumn('chat_sessions', 'shared_with_roles');

        if ($hasIsShared || $hasSharedRoles) {
            $isShared = $hasIsShared ? (bool)($session->is_shared ?? false) : false;
            $sharedRoles = $hasSharedRoles ? $session->shared_with_roles : null;

            if ($isShared || !empty($sharedRoles)) {
                $needsFix = true;
                $fixes[] = "Disabling sharing and clearing shared_with_roles";
                if ($hasIsShared) {
                    $session->is_shared = false;
                }
                if ($hasSharedRoles) {
                    $session->shared_with_roles = null;
                }
            }
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