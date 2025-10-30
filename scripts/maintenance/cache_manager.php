<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use App\Models\ChatSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Clearing Cache and Testing Session Access ===\n\n";

try {
    // Clear all caches
    echo "🧹 Clearing caches...\n";
    
    // Clear application cache
    Cache::flush();
    echo "  ✅ Application cache cleared\n";
    
    // Clear config cache
    try {
        Artisan::call('config:clear');
        echo "  ✅ Config cache cleared\n";
    } catch (Exception $e) {
        echo "  ⚠️  Config cache clear failed: " . $e->getMessage() . "\n";
    }
    
    // Clear route cache
    try {
        Artisan::call('route:clear');
        echo "  ✅ Route cache cleared\n";
    } catch (Exception $e) {
        echo "  ⚠️  Route cache clear failed: " . $e->getMessage() . "\n";
    }
    
    // Clear view cache
    try {
        Artisan::call('view:clear');
        echo "  ✅ View cache cleared\n";
    } catch (Exception $e) {
        echo "  ⚠️  View cache clear failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    
    // Test fresh session access
    echo "🔍 Testing fresh session access...\n\n";
    
    // Get the user
    $user = User::where('email', 'mike.drafter@company.com')->first();
    
    if (!$user) {
        echo "❌ User not found\n";
        exit;
    }
    
    echo "✅ Found user: {$user->name} (ID: {$user->id})\n";
    
    // Get fresh session data directly from database
    $sessions = DB::table('chat_sessions')
        ->where('user_id', $user->id)
        ->get();
    
    echo "Found {$sessions->count()} sessions in database:\n\n";
    
    foreach ($sessions as $session) {
        echo "--- Session: {$session->title} (ID: {$session->id}) ---\n";
        echo "Raw user_id from DB: {$session->user_id} (type: " . gettype($session->user_id) . ")\n";
        echo "Current user ID: {$user->id} (type: " . gettype($user->id) . ")\n";
        echo "Loose comparison (==): " . ($session->user_id == $user->id ? 'true' : 'false') . "\n";
        echo "Strict comparison (===): " . ($session->user_id === $user->id ? 'true' : 'false') . "\n";
        
        // Test with fresh Eloquent model
        $freshSession = ChatSession::find($session->id);
        echo "Fresh Eloquent user_id: {$freshSession->user_id} (type: " . gettype($freshSession->user_id) . ")\n";
        echo "Fresh Eloquent comparison: " . ($freshSession->user_id === $user->id ? 'true' : 'false') . "\n";
        
        // Test authorization methods
        $canEdit = $freshSession->user_id === $user->id;
        echo "Can edit (fresh): " . ($canEdit ? '✅ true' : '❌ false') . "\n";
        
        echo "\n";
    }
    
    // Create a brand new session to test
    echo "🆕 Creating brand new session...\n";
    $newSession = ChatSession::create([
        'user_id' => $user->id,
        'title' => 'Fresh Test Session - ' . date('Y-m-d H:i:s'),
        'chat_type' => 'persona',
        'persona' => $user->role,
        'description' => 'Testing fresh session creation',
        'last_activity_at' => now(),
    ]);
    
    echo "✅ Created session: {$newSession->title} (ID: {$newSession->id})\n";
    echo "New session user_id: {$newSession->user_id} (type: " . gettype($newSession->user_id) . ")\n";
    echo "Current user ID: {$user->id} (type: " . gettype($user->id) . ")\n";
    echo "New session can edit: " . ($newSession->user_id === $user->id ? '✅ true' : '❌ false') . "\n";
    
    // Test the URL that would be accessed
    echo "\n🌐 Testing URL access simulation...\n";
    echo "URL would be: /chat/{$newSession->id}\n";
    
    // Simulate the controller logic
    $sessionFromRoute = ChatSession::findOrFail($newSession->id);
    // Private-only policy: only owners can view
    $canView = $sessionFromRoute->user_id === $user->id;
    $canEdit = $sessionFromRoute->user_id === $user->id;
    
    echo "Route simulation results:\n";
    echo "  - Can view: " . ($canView ? '✅ true' : '❌ false') . "\n";
    echo "  - Can edit: " . ($canEdit ? '✅ true' : '❌ false') . "\n";
    echo "  - Would show auth message: " . (!$canEdit ? '❌ YES' : '✅ NO') . "\n";
    
    // Clean up
    $newSession->delete();
    echo "\n🧹 Cleaned up test session\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Cache Clear and Test Complete ===\n";