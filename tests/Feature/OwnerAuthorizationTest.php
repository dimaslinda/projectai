<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Owner Authorization Issue ===\n\n";

try {
    // Get a user (preferably the one experiencing the issue)
    $user = User::where('role', 'engineer')->first();
    
    if (!$user) {
        echo "❌ No engineer user found. Creating one...\n";
        $user = User::create([
            'name' => 'Test Engineer',
            'email' => 'test.engineer@example.com',
            'password' => bcrypt('password'),
            'role' => 'engineer',
            'email_verified_at' => now(),
        ]);
        echo "✅ Created test engineer user: {$user->email}\n";
    } else {
        echo "✅ Found engineer user: {$user->email} (ID: {$user->id})\n";
    }

    // Create a new chat session as this user would
    echo "\n--- Creating Chat Session ---\n";
    $session = ChatSession::create([
        'user_id' => $user->id,
        'title' => 'Test Session - Owner Authorization',
        'chat_type' => 'persona',
        'persona' => $user->role,
        'description' => 'Testing owner authorization issue',
        'is_shared' => true,
        'shared_with_roles' => [$user->role],
        'last_activity_at' => now(),
    ]);

    echo "✅ Created session: {$session->title} (ID: {$session->id})\n";
    echo "   - Owner ID: {$session->user_id}\n";
    echo "   - User ID: {$user->id}\n";
    echo "   - Is Shared: " . ($session->is_shared ? 'Yes' : 'No') . "\n";
    echo "   - Shared with roles: " . json_encode($session->shared_with_roles) . "\n";

    // Test authorization logic
    echo "\n--- Testing Authorization Logic ---\n";
    
    // Test 1: Is user the owner?
    $isOwner = $session->user_id === $user->id;
    echo "1. Is user the owner? " . ($isOwner ? '✅ Yes' : '❌ No') . "\n";
    
    // Test 2: Can user view by role?
    $canViewByRole = $session->canBeViewedByRole($user->role);
    echo "2. Can view by role? " . ($canViewByRole ? '✅ Yes' : '❌ No') . "\n";
    
    // Test 3: Controller show logic
    $canView = $session->user_id === $user->id || $session->canBeViewedByRole($user->role);
    echo "3. Can view (controller logic)? " . ($canView ? '✅ Yes' : '❌ No') . "\n";
    
    // Test 4: Can edit (frontend logic)
    $canEdit = $session->user_id === $user->id;
    echo "4. Can edit (frontend logic)? " . ($canEdit ? '✅ Yes' : '❌ No') . "\n";
    
    // Test 5: Can send message (sendMessage logic)
    $canSendMessage = $session->user_id === $user->id;
    echo "5. Can send message? " . ($canSendMessage ? '✅ Yes' : '❌ No') . "\n";

    // Test with different scenarios
    echo "\n--- Testing Different Scenarios ---\n";
    
    // Scenario 1: Session not shared
    $session->update(['is_shared' => false, 'shared_with_roles' => null]);
    $session->refresh();
    
    echo "Scenario 1: Session not shared\n";
    echo "   - Is Shared: " . ($session->is_shared ? 'Yes' : 'No') . "\n";
    echo "   - Can view by role: " . ($session->canBeViewedByRole($user->role) ? 'Yes' : 'No') . "\n";
    echo "   - Can view (controller): " . (($session->user_id === $user->id || $session->canBeViewedByRole($user->role)) ? 'Yes' : 'No') . "\n";
    echo "   - Can edit (frontend): " . (($session->user_id === $user->id) ? 'Yes' : 'No') . "\n";
    
    // Scenario 2: Session shared but with different roles
    $session->update(['is_shared' => true, 'shared_with_roles' => ['drafter']]);
    $session->refresh();
    
    echo "\nScenario 2: Session shared with different role\n";
    echo "   - Is Shared: " . ($session->is_shared ? 'Yes' : 'No') . "\n";
    echo "   - Shared with: " . json_encode($session->shared_with_roles) . "\n";
    echo "   - User role: {$user->role}\n";
    echo "   - Can view by role: " . ($session->canBeViewedByRole($user->role) ? 'Yes' : 'No') . "\n";
    echo "   - Can view (controller): " . (($session->user_id === $user->id || $session->canBeViewedByRole($user->role)) ? 'Yes' : 'No') . "\n";
    echo "   - Can edit (frontend): " . (($session->user_id === $user->id) ? 'Yes' : 'No') . "\n";
    
    // Scenario 3: Session shared with correct role
    $session->update(['is_shared' => true, 'shared_with_roles' => [$user->role]]);
    $session->refresh();
    
    echo "\nScenario 3: Session shared with correct role\n";
    echo "   - Is Shared: " . ($session->is_shared ? 'Yes' : 'No') . "\n";
    echo "   - Shared with: " . json_encode($session->shared_with_roles) . "\n";
    echo "   - User role: {$user->role}\n";
    echo "   - Can view by role: " . ($session->canBeViewedByRole($user->role) ? 'Yes' : 'No') . "\n";
    echo "   - Can view (controller): " . (($session->user_id === $user->id || $session->canBeViewedByRole($user->role)) ? 'Yes' : 'No') . "\n";
    echo "   - Can edit (frontend): " . (($session->user_id === $user->id) ? 'Yes' : 'No') . "\n";

    // Check database values directly
    echo "\n--- Database Values ---\n";
    $dbSession = DB::table('chat_sessions')->where('id', $session->id)->first();
    echo "Database record:\n";
    echo "   - user_id: {$dbSession->user_id}\n";
    echo "   - is_shared: {$dbSession->is_shared}\n";
    echo "   - shared_with_roles: {$dbSession->shared_with_roles}\n";

    // Clean up
    echo "\n--- Cleanup ---\n";
    $session->delete();
    echo "✅ Deleted test session\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";