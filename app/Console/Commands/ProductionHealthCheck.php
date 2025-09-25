<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Helpers\ProductionDebugHelper;
use App\Models\ChatSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProductionHealthCheck extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'production:health-check 
                            {--session-id= : Specific session ID to check}
                            {--user-id= : Specific user ID to check}
                            {--fix-types : Attempt to fix data type issues}';

    /**
     * The console command description.
     */
    protected $description = 'Check production health and debug canEdit issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Production Health Check Starting...');
        $this->newLine();

        // Generate overall health report
        $this->info('📊 Generating Health Report...');
        $healthReport = ProductionDebugHelper::generateHealthReport();
        
        if (!empty($healthReport['issues'])) {
            $this->error('⚠️  Issues Found:');
            foreach ($healthReport['issues'] as $issue) {
                $this->line("   - {$issue}");
            }
            $this->newLine();
        } else {
            $this->info('✅ No issues detected in health check');
            $this->newLine();
        }

        // Check specific session/user if provided
        $sessionId = $this->option('session-id');
        $userId = $this->option('user-id');

        if ($sessionId && $userId) {
            $this->checkSpecificSessionUser($sessionId, $userId);
        } else {
            // Check a sample of sessions
            $this->checkSampleSessions();
        }

        // Check for data type issues
        $this->checkDataTypeIssues();

        // Offer to fix issues if requested
        if ($this->option('fix-types')) {
            $this->attemptTypeFixes();
        }

        $this->info('🏁 Production Health Check Complete');
    }

    private function checkSpecificSessionUser($sessionId, $userId)
    {
        $this->info("🎯 Checking Session ID: {$sessionId} with User ID: {$userId}");
        
        $session = ChatSession::find($sessionId);
        $user = User::find($userId);

        if (!$session) {
            $this->error("❌ Session {$sessionId} not found");
            return;
        }

        if (!$user) {
            $this->error("❌ User {$userId} not found");
            return;
        }

        // Test canEdit logic
        $this->testCanEditLogic($session, $user);
    }

    private function checkSampleSessions()
    {
        $this->info('🔍 Checking Sample Sessions...');
        
        // Get a few recent sessions
        $sessions = ChatSession::with('user')->latest()->take(5)->get();
        
        foreach ($sessions as $session) {
            if ($session->user) {
                $this->line("   Session {$session->id} -> User {$session->user->id} ({$session->user->email})");
                $this->testCanEditLogic($session, $session->user, false);
            }
        }
        $this->newLine();
    }

    private function testCanEditLogic($session, $user, $verbose = true)
    {
        if ($verbose) {
            $this->info('🧪 Testing canEdit Logic...');
        }

        // Get raw values
        $sessionUserId = $session->user_id;
        $currentUserId = $user->id;

        // Test different comparisons
        $strictComparison = $sessionUserId === $currentUserId;
        $looseComparison = $sessionUserId == $currentUserId;
        $typeCastComparison = (int)$sessionUserId === (int)$currentUserId;

        if ($verbose) {
            $this->line("   Session user_id: " . var_export($sessionUserId, true) . " (type: " . gettype($sessionUserId) . ")");
            $this->line("   Current user_id: " . var_export($currentUserId, true) . " (type: " . gettype($currentUserId) . ")");
            $this->line("   Strict (===): " . ($strictComparison ? 'TRUE' : 'FALSE'));
            $this->line("   Loose (==): " . ($looseComparison ? 'TRUE' : 'FALSE'));
            $this->line("   Type Cast: " . ($typeCastComparison ? 'TRUE' : 'FALSE'));
        }

        // Check for issues
        if (!$strictComparison && $looseComparison) {
            $this->warn("   ⚠️  ISSUE: Loose comparison works but strict fails!");
            $this->line("   🔧 SOLUTION: Data type mismatch detected");
            return false;
        }

        if ($verbose) {
            $this->info("   ✅ canEdit logic working correctly");
        }
        
        return true;
    }

    private function checkDataTypeIssues()
    {
        $this->info('🗄️  Checking Database Data Types...');

        try {
            // Check a sample of data
            $sessions = DB::table('chat_sessions')->take(10)->get();
            $users = DB::table('users')->take(10)->get();

            $sessionTypes = [];
            $userTypes = [];

            foreach ($sessions as $session) {
                $type = gettype($session->user_id);
                $sessionTypes[$type] = ($sessionTypes[$type] ?? 0) + 1;
            }

            foreach ($users as $user) {
                $type = gettype($user->id);
                $userTypes[$type] = ($userTypes[$type] ?? 0) + 1;
            }

            $this->line("   Session user_id types:");
            foreach ($sessionTypes as $type => $count) {
                $this->line("     - {$type}: {$count} records");
            }

            $this->line("   User id types:");
            foreach ($userTypes as $type => $count) {
                $this->line("     - {$type}: {$count} records");
            }

            // Check for mismatches
            if (count($sessionTypes) > 1 || count($userTypes) > 1) {
                $this->warn("   ⚠️  Multiple data types detected - this could cause issues");
            } else {
                $this->info("   ✅ Data types are consistent");
            }

        } catch (\Exception $e) {
            $this->error("   ❌ Error checking data types: " . $e->getMessage());
        }

        $this->newLine();
    }

    private function attemptTypeFixes()
    {
        $this->info('🔧 Attempting to fix data type issues...');
        
        if (!$this->confirm('This will modify your database. Are you sure?')) {
            $this->info('Skipping type fixes.');
            return;
        }

        try {
            // This is a placeholder - actual implementation would depend on specific issues found
            $this->warn('Type fixing not implemented yet. Please check your database schema manually.');
            
            // Example of what could be done:
            // DB::statement('ALTER TABLE chat_sessions MODIFY user_id INT UNSIGNED NOT NULL');
            // DB::statement('ALTER TABLE users MODIFY id INT UNSIGNED NOT NULL AUTO_INCREMENT');
            
        } catch (\Exception $e) {
            $this->error("Error fixing types: " . $e->getMessage());
        }
    }
}