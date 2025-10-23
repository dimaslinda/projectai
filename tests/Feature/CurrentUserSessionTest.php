<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Current User Session Access ===\n\n";

try {
    // Get the user who is experiencing the issue (Mike Drafter)
    $user = User::where('email', 'mike.drafter@company.com')->first();
    
    if (!$user) {
        echo "❌ User not found. Let's check all users:\n";
        $users = User::all();
        foreach ($users as $u) {
            echo "  - {$u->name} ({$u->email}) - Role: {$u->role}\n";
        }
        exit;
    }
    
    echo "✅ Found user: {$user->name} ({$user->email}) - Role: {$user->role}\n\n";
    
    // Get their chat sessions
    $userSessions = ChatSession::where('user_id', $user->id)->get();
    
    echo "User has {$userSessions->count()} chat sessions:\n\n";
    
    foreach ($userSessions as $session) {
        echo "--- Session: {$session->title} (ID: {$session->id}) ---\n";
        echo "Owner ID: {$session->user_id}\n";
        echo "User ID: {$user->id}\n";
        echo "Is Owner: " . ($session->user_id === $user->id ? 'Yes' : 'No') . "\n";
        echo "Chat Type: {$session->chat_type}\n";
        echo "Persona: " . ($session->persona ?? 'null') . "\n";
        echo "Is Shared: " . ($session->is_shared ? 'Yes' : 'No') . "\n";
        echo "Shared with roles: " . json_encode($session->shared_with_roles) . "\n";
        
        // Test all authorization checks
        $canViewByRole = $session->canBeViewedByRole($user->role);
        $canView = $session->user_id === $user->id || $canViewByRole;
        $canEdit = $session->user_id === $user->id;
        $canSendMessage = $session->user_id === $user->id;
        
        echo "\nAuthorization Results:\n";
        echo "  - Can view by role: " . ($canViewByRole ? '✅ Yes' : '❌ No') . "\n";
        echo "  - Can view (controller): " . ($canView ? '✅ Yes' : '❌ No') . "\n";
        echo "  - Can edit (frontend): " . ($canEdit ? '✅ Yes' : '❌ No') . "\n";
        echo "  - Can send message: " . ($canSendMessage ? '✅ Yes' : '❌ No') . "\n";
        
        // Simulate the exact controller logic
        echo "\nSimulating Controller Logic:\n";
        
        // Show method logic
        $showWouldAbort = !($session->user_id === $user->id || $session->canBeViewedByRole($user->role));
        echo "  - Show method would abort: " . ($showWouldAbort ? '❌ Yes (403 error)' : '✅ No') . "\n";
        
        // SendMessage method logic
        $sendMessageWouldAbort = !($session->user_id === $user->id);
        echo "  - SendMessage would abort: " . ($sendMessageWouldAbort ? '❌ Yes (403 error)' : '✅ No') . "\n";
        
        // Frontend canEdit prop
        $frontendCanEdit = $session->user_id === $user->id;
        echo "  - Frontend canEdit prop: " . ($frontendCanEdit ? '✅ true' : '❌ false') . "\n";
        
        if (!$canEdit || !$canSendMessage || $showWouldAbort || $sendMessageWouldAbort) {
            echo "\n⚠️  PROBLEM DETECTED! This session would show the authorization message.\n";
            
            // Let's check the raw database values
            $dbSession = DB::table('chat_sessions')->where('id', $session->id)->first();
            echo "\nRaw Database Values:\n";
            echo "  - user_id: {$dbSession->user_id} (type: " . gettype($dbSession->user_id) . ")\n";
            echo "  - Current user ID: {$user->id} (type: " . gettype($user->id) . ")\n";
            echo "  - IDs match: " . ($dbSession->user_id == $user->id ? 'Yes' : 'No') . "\n";
            echo "  - IDs match (strict): " . ($dbSession->user_id === $user->id ? 'Yes' : 'No') . "\n";
            
        } else {
            echo "\n✅ This session should work correctly.\n";
        }
        
        echo "\n" . str_repeat("-", 50) . "\n\n";
    }
    
    // Create a new session to test
    echo "=== Creating New Test Session ===\n";
    $newSession = ChatSession::create([
        'user_id' => $user->id,
        'title' => 'Test Session - Debug',
        'chat_type' => 'persona',
        'persona' => $user->role,
        'description' => 'Testing authorization issue',
        'is_shared' => true,
        'shared_with_roles' => [$user->role],
        'last_activity_at' => now(),
    ]);
    
    echo "✅ Created new session: {$newSession->title} (ID: {$newSession->id})\n";
    
    // Test the new session
    $canEdit = $newSession->user_id === $user->id;
    echo "New session canEdit: " . ($canEdit ? '✅ true' : '❌ false') . "\n";
    echo "New session owner ID: {$newSession->user_id}\n";
    echo "Current user ID: {$user->id}\n";
    
    // Clean up
    $newSession->delete();
    echo "✅ Cleaned up test session\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";