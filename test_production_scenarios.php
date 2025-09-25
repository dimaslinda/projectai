<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Production Scenarios ===\n\n";

// Test different data type scenarios that might occur in production
function testCanEditLogic($sessionUserId, $currentUserId, $description) {
    echo "🧪 Test: {$description}\n";
    echo "   Session user_id: " . var_export($sessionUserId, true) . " (type: " . gettype($sessionUserId) . ")\n";
    echo "   Current user_id: " . var_export($currentUserId, true) . " (type: " . gettype($currentUserId) . ")\n";
    
    // Test different comparison methods
    $strictComparison = $sessionUserId === $currentUserId;
    $looseComparison = $sessionUserId == $currentUserId;
    
    echo "   Strict (===): " . ($strictComparison ? 'TRUE' : 'FALSE') . "\n";
    echo "   Loose (==): " . ($looseComparison ? 'TRUE' : 'FALSE') . "\n";
    
    // Simulate the current ChatController logic
    $canEdit = $sessionUserId === $currentUserId;
    echo "   canEdit result: " . ($canEdit ? 'TRUE' : 'FALSE') . "\n";
    
    if (!$canEdit && $looseComparison) {
        echo "   ⚠️  ISSUE DETECTED: Loose comparison works but strict fails!\n";
        echo "   🔧 SOLUTION: Use loose comparison or fix data types\n";
    }
    
    echo "\n";
    return $canEdit;
}

try {
    echo "🔬 Simulating Different Production Scenarios:\n\n";
    
    // Scenario 1: Normal case (both integers)
    testCanEditLogic(5, 5, "Normal case - both integers");
    
    // Scenario 2: String vs Integer (common in some databases)
    testCanEditLogic("5", 5, "String vs Integer");
    testCanEditLogic(5, "5", "Integer vs String");
    
    // Scenario 3: Float vs Integer
    testCanEditLogic(5.0, 5, "Float vs Integer");
    testCanEditLogic(5, 5.0, "Integer vs Float");
    
    // Scenario 4: Different values
    testCanEditLogic(5, 6, "Different values");
    
    // Scenario 5: Null values
    testCanEditLogic(null, 5, "Null session user_id");
    testCanEditLogic(5, null, "Null current user_id");
    
    // Scenario 6: Boolean values (edge case)
    testCanEditLogic(true, 1, "Boolean true vs 1");
    testCanEditLogic(false, 0, "Boolean false vs 0");
    
    echo "🔍 Real Database Test with Session ID 1 and User ID 5:\n";
    
    $session = ChatSession::find(1);
    $user = User::find(5);
    
    if ($session && $user) {
        $realCanEdit = testCanEditLogic($session->user_id, $user->id, "Real database data");
        
        echo "📊 Additional Real Data Analysis:\n";
        echo "   Session created_at: {$session->created_at}\n";
        echo "   Session updated_at: {$session->updated_at}\n";
        echo "   User created_at: {$user->created_at}\n";
        echo "   User updated_at: {$user->updated_at}\n\n";
        
        // Test with raw database values
        $rawSession = DB::table('chat_sessions')->where('id', 1)->first();
        $rawUser = DB::table('users')->where('id', 5)->first();
        
        if ($rawSession && $rawUser) {
            testCanEditLogic($rawSession->user_id, $rawUser->id, "Raw database query");
        }
    }
    
    echo "🛠️  Proposed Solutions for Production:\n\n";
    
    echo "1. 🔧 IMMEDIATE FIX - Use loose comparison:\n";
    echo "   Change: \$canEdit = \$session->user_id === \$currentUserId;\n";
    echo "   To:     \$canEdit = \$session->user_id == \$currentUserId;\n\n";
    
    echo "2. 🗄️  LONG-TERM FIX - Ensure data type consistency:\n";
    echo "   - Check production database schema\n";
    echo "   - Ensure both user_id fields are INTEGER\n";
    echo "   - Run migration if needed\n\n";
    
    echo "3. 🔍 DEBUGGING - Add type casting:\n";
    echo "   \$canEdit = (int)\$session->user_id === (int)\$currentUserId;\n\n";
    
    echo "4. 🚨 PRODUCTION DEBUGGING - Add this to ChatController:\n";
    echo "   Log::info('canEdit Debug', [\n";
    echo "       'session_user_id' => \$session->user_id,\n";
    echo "       'session_user_id_type' => gettype(\$session->user_id),\n";
    echo "       'current_user_id' => \$currentUserId,\n";
    echo "       'current_user_id_type' => gettype(\$currentUserId),\n";
    echo "       'strict_comparison' => \$session->user_id === \$currentUserId,\n";
    echo "       'loose_comparison' => \$session->user_id == \$currentUserId,\n";
    echo "   ]);\n\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "=== Production Scenario Testing Complete ===\n";