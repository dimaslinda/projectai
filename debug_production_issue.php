<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Production Environment Analysis ===\n\n";

try {
    // Check environment
    echo "🔍 Environment Information:\n";
    echo "  - Environment: " . app()->environment() . "\n";
    echo "  - Database Driver: " . config('database.default') . "\n";
    echo "  - Database Connection: " . config('database.connections.' . config('database.default') . '.driver') . "\n";
    echo "  - PHP Version: " . PHP_VERSION . "\n";
    echo "  - Laravel Version: " . app()->version() . "\n\n";

    // Check specific session and user from the debug output
    echo "🎯 Analyzing Session ID: 1 and User ID: 5\n\n";
    
    // Get raw database data
    $rawSession = DB::table('chat_sessions')->where('id', 1)->first();
    $rawUser = DB::table('users')->where('id', 5)->first();
    
    if (!$rawSession) {
        echo "❌ Session ID 1 not found in database\n";
        exit;
    }
    
    if (!$rawUser) {
        echo "❌ User ID 5 not found in database\n";
        exit;
    }
    
    echo "📊 Raw Database Values:\n";
    echo "  - Session user_id: " . var_export($rawSession->user_id, true) . " (type: " . gettype($rawSession->user_id) . ")\n";
    echo "  - User id: " . var_export($rawUser->id, true) . " (type: " . gettype($rawUser->id) . ")\n";
    echo "  - User email: {$rawUser->email}\n";
    echo "  - User name: {$rawUser->name}\n\n";
    
    // Test comparisons
    echo "🔬 Comparison Tests:\n";
    echo "  - Strict (===): " . ($rawSession->user_id === $rawUser->id ? 'TRUE' : 'FALSE') . "\n";
    echo "  - Loose (==): " . ($rawSession->user_id == $rawUser->id ? 'TRUE' : 'FALSE') . "\n";
    echo "  - String comparison: " . ((string)$rawSession->user_id === (string)$rawUser->id ? 'TRUE' : 'FALSE') . "\n";
    echo "  - Integer comparison: " . ((int)$rawSession->user_id === (int)$rawUser->id ? 'TRUE' : 'FALSE') . "\n\n";
    
    // Check for potential issues
    echo "🚨 Potential Issues Analysis:\n";
    
    // 1. Data type mismatch
    if (gettype($rawSession->user_id) !== gettype($rawUser->id)) {
        echo "  ⚠️  DATA TYPE MISMATCH DETECTED!\n";
        echo "      Session user_id type: " . gettype($rawSession->user_id) . "\n";
        echo "      User id type: " . gettype($rawUser->id) . "\n";
        echo "      This could be the cause of the issue in production.\n\n";
    } else {
        echo "  ✅ Data types match: " . gettype($rawSession->user_id) . "\n\n";
    }
    
    // 2. Check if values are actually different
    if ($rawSession->user_id != $rawUser->id) {
        echo "  ❌ VALUES ARE DIFFERENT!\n";
        echo "      Session belongs to user_id: {$rawSession->user_id}\n";
        echo "      Current user id: {$rawUser->id}\n";
        echo "      This user should NOT be able to edit this session.\n\n";
    } else {
        echo "  ✅ Values match (loose comparison)\n\n";
    }
    
    // 3. Check using Eloquent models
    echo "🔍 Eloquent Model Analysis:\n";
    $session = ChatSession::find(1);
    $user = User::find(5);
    
    if ($session && $user) {
        echo "  - Session user_id (Eloquent): " . var_export($session->user_id, true) . " (type: " . gettype($session->user_id) . ")\n";
        echo "  - User id (Eloquent): " . var_export($user->id, true) . " (type: " . gettype($user->id) . ")\n";
        echo "  - Eloquent strict comparison: " . ($session->user_id === $user->id ? 'TRUE' : 'FALSE') . "\n";
        echo "  - Eloquent loose comparison: " . ($session->user_id == $user->id ? 'TRUE' : 'FALSE') . "\n\n";
    }
    
    // 4. Check database schema (SQLite compatible)
    echo "🗄️  Database Schema Analysis:\n";
    try {
        if (config('database.default') === 'sqlite') {
            $sessionSchema = DB::select("PRAGMA table_info(chat_sessions)");
            $userSchema = DB::select("PRAGMA table_info(users)");
            
            foreach ($sessionSchema as $column) {
                if ($column->name === 'user_id') {
                    echo "  - chat_sessions.user_id: {$column->type} (Not Null: {$column->notnull}, PK: {$column->pk})\n";
                }
            }
            
            foreach ($userSchema as $column) {
                if ($column->name === 'id') {
                    echo "  - users.id: {$column->type} (Not Null: {$column->notnull}, PK: {$column->pk})\n";
                }
            }
        } else {
            // MySQL/PostgreSQL
            $sessionColumns = DB::select("DESCRIBE chat_sessions");
            $userColumns = DB::select("DESCRIBE users");
            
            foreach ($sessionColumns as $column) {
                if ($column->Field === 'user_id') {
                    echo "  - chat_sessions.user_id: {$column->Type} (Null: {$column->Null}, Key: {$column->Key})\n";
                }
            }
            
            foreach ($userColumns as $column) {
                if ($column->Field === 'id') {
                    echo "  - users.id: {$column->Type} (Null: {$column->Null}, Key: {$column->Key})\n";
                }
            }
        }
    } catch (Exception $e) {
        echo "  ⚠️  Could not retrieve schema info: " . $e->getMessage() . "\n";
    }
    echo "\n";
    
    // 5. Check for caching issues
    echo "🗂️  Cache Analysis:\n";
    echo "  - Cache driver: " . config('cache.default') . "\n";
    echo "  - Session driver: " . config('session.driver') . "\n\n";
    
    // 6. Additional Production-Specific Checks
    echo "🔍 Production-Specific Analysis:\n";
    
    // Check if we're actually in production environment
    if (app()->environment() === 'local') {
        echo "  ⚠️  WARNING: This is running in LOCAL environment!\n";
        echo "      The issue reported is in PRODUCTION environment.\n";
        echo "      Results here may not reflect production behavior.\n\n";
        
        echo "  📋 To debug production issue, you need to:\n";
        echo "      1. Run this script on the production server\n";
        echo "      2. Or add temporary debug logging to ChatController\n";
        echo "      3. Check production database directly\n";
        echo "      4. Compare environment configurations\n\n";
    }
    
    // Check for common production issues
    echo "🚨 Common Production Issues to Check:\n";
    echo "  1. Database Connection: Different database server in production\n";
    echo "  2. Data Migration: Production database might have different data types\n";
    echo "  3. Caching: Redis/Memcached might cache old user data\n";
    echo "  4. Load Balancer: Session affinity issues\n";
    echo "  5. PHP Version: Different PHP version might handle type casting differently\n";
    echo "  6. Environment Variables: Different .env settings\n";
    echo "  7. Code Deployment: Different code version deployed\n\n";
    
    // 7. Recommendations
    echo "💡 Recommendations:\n";
    
    if (gettype($rawSession->user_id) !== gettype($rawUser->id)) {
        echo "  1. ⚠️  Fix data type mismatch by ensuring both IDs are integers\n";
        echo "  2. 🔧 Consider using loose comparison (==) as a temporary fix\n";
        echo "  3. 🗄️  Check database migration and ensure proper integer types\n";
    } else if ($rawSession->user_id !== $rawUser->id) {
        echo "  1. ❌ This user should NOT have edit access to this session\n";
        echo "  2. 🔍 Verify the correct user is logged in\n";
        echo "  3. 🔐 Check authentication and session handling\n";
    } else {
        echo "  1. ✅ Data looks correct in local environment\n";
        echo "  2. 🏭 Issue is likely production-specific\n";
        echo "  3. 🔧 Add temporary debug logging to production ChatController\n";
        echo "  4. 🗄️  Check production database schema and data types\n";
        echo "  5. 🌐 Verify production environment configuration\n";
    }
    
    echo "\n🔧 Immediate Action Items:\n";
    echo "  1. Deploy the enhanced debug logging to production\n";
    echo "  2. Check production logs after deployment\n";
    echo "  3. Compare the debug output between local and production\n";
    echo "  4. Focus on data type differences if any\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Production Analysis Complete ===\n";