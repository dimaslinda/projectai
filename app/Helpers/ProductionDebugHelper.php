<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProductionDebugHelper
{
    /**
     * Log comprehensive debugging information for canEdit issues
     */
    public static function logCanEditDebug($session, $user, $canEditResult, $context = 'unknown')
    {
        // Check if debugging should be enabled
        if (!self::shouldLogDebug()) {
            return;
        }

        $debugData = [
            'context' => $context,
            'timestamp' => now()->toISOString(),
            'environment' => app()->environment(),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            
            // Session data
            'session_id' => $session->id,
            'session_user_id' => $session->user_id,
            'session_user_id_type' => gettype($session->user_id),
            'session_user_id_raw' => var_export($session->user_id, true),
            'session_created_at' => $session->created_at,
            'session_updated_at' => $session->updated_at,
            
            // User data
            'current_user_id' => $user->id,
            'current_user_id_type' => gettype($user->id),
            'current_user_id_raw' => var_export($user->id, true),
            'user_email' => $user->email,
            'user_role' => $user->role,
            'user_created_at' => $user->created_at,
            'user_updated_at' => $user->updated_at,
            
            // Comparison results
            'can_edit_result' => $canEditResult,
            'comparison_strict' => ($session->user_id === $user->id),
            'comparison_loose' => ($session->user_id == $user->id),
            'comparison_type_cast_int' => ((int)$session->user_id === (int)$user->id),
            'comparison_type_cast_string' => ((string)$session->user_id === (string)$user->id),
            
            // Database configuration
            'database_driver' => config('database.default'),
            'database_connection' => config('database.connections.' . config('database.default')),
            
            // Cache configuration
            'cache_driver' => config('cache.default'),
            'session_driver' => config('session.driver'),
        ];

        // Get raw database values for comparison
        try {
            $rawSession = DB::table('chat_sessions')->where('id', $session->id)->first();
            $rawUser = DB::table('users')->where('id', $user->id)->first();
            
            if ($rawSession && $rawUser) {
                $debugData['raw_database'] = [
                    'session_user_id' => $rawSession->user_id,
                    'session_user_id_type' => gettype($rawSession->user_id),
                    'user_id' => $rawUser->id,
                    'user_id_type' => gettype($rawUser->id),
                    'raw_comparison_strict' => ($rawSession->user_id === $rawUser->id),
                    'raw_comparison_loose' => ($rawSession->user_id == $rawUser->id),
                    'raw_comparison_type_cast' => ((int)$rawSession->user_id === (int)$rawUser->id),
                ];
            }
        } catch (\Exception $e) {
            $debugData['raw_database_error'] = $e->getMessage();
        }

        // Log with appropriate level based on result
        if (!$canEditResult && ($session->user_id == $user->id)) {
            // This is likely the bug - loose comparison works but result is false
            Log::error('PRODUCTION BUG: canEdit false but should be true', $debugData);
        } elseif ($canEditResult && ($session->user_id != $user->id)) {
            // This would be a security issue
            Log::critical('SECURITY ISSUE: canEdit true but should be false', $debugData);
        } else {
            // Normal case
            Log::info('canEdit Debug Info', $debugData);
        }
    }

    /**
     * Check for common production issues
     */
    public static function checkProductionIssues()
    {
        $issues = [];

        // Check database configuration
        $dbDriver = config('database.default');
        if (!$dbDriver) {
            $issues[] = 'Database driver not configured';
        }

        // Check for type casting issues in database
        try {
            $sampleSession = DB::table('chat_sessions')->first();
            $sampleUser = DB::table('users')->first();
            
            if ($sampleSession && $sampleUser) {
                if (gettype($sampleSession->user_id) !== gettype($sampleUser->id)) {
                    $issues[] = "Data type mismatch: session.user_id is " . gettype($sampleSession->user_id) . 
                               " but user.id is " . gettype($sampleUser->id);
                }
            }
        } catch (\Exception $e) {
            $issues[] = "Database check failed: " . $e->getMessage();
        }

        // Check environment configuration
        if (app()->environment('production') && config('app.debug')) {
            $issues[] = "Debug mode is enabled in production";
        }

        return $issues;
    }

    /**
     * Generate production health report
     */
    public static function generateHealthReport()
    {
        $report = [
            'timestamp' => now()->toISOString(),
            'environment' => app()->environment(),
            'issues' => self::checkProductionIssues(),
            'database_info' => [
                'driver' => config('database.default'),
                'connection_name' => config('database.default'),
            ],
            'cache_info' => [
                'driver' => config('cache.default'),
                'session_driver' => config('session.driver'),
            ],
            'php_info' => [
                'version' => PHP_VERSION,
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
            ],
        ];

        Log::info('Production Health Report', $report);
        return $report;
    }

    /**
     * Determine if debugging should be enabled
     */
    private static function shouldLogDebug(): bool
    {
        // Always log in production
        if (app()->environment('production')) {
            return true;
        }

        // Log in other environments if explicitly enabled
        if (config('app.debug_can_edit', false)) {
            return true;
        }

        // Log if there's a specific debug flag in environment
        if (env('DEBUG_CAN_EDIT', false)) {
            return true;
        }

        return false;
    }

    /**
     * Get environment-specific configuration
     */
    public static function getEnvironmentConfig(): array
    {
        return [
            'environment' => app()->environment(),
            'is_production' => app()->environment('production'),
            'debug_enabled' => config('app.debug'),
            'can_edit_debug_enabled' => self::shouldLogDebug(),
            'log_level' => config('logging.level'),
            'log_channel' => config('logging.default'),
            'database_driver' => config('database.default'),
            'cache_driver' => config('cache.default'),
            'session_driver' => config('session.driver'),
            'app_url' => config('app.url'),
            'app_timezone' => config('app.timezone'),
        ];
    }

    /**
     * Log environment configuration for debugging
     */
    public static function logEnvironmentInfo()
    {
        if (self::shouldLogDebug()) {
            Log::info('Environment Configuration', self::getEnvironmentConfig());
        }
    }

    /**
     * Create a summary report for the canEdit issue
     */
    public static function createIssueSummary($session, $user): array
    {
        $summary = [
            'issue_type' => 'canEdit_false_in_production',
            'reported_at' => now()->toISOString(),
            'environment' => app()->environment(),
            'session_info' => [
                'id' => $session->id,
                'user_id' => $session->user_id,
                'user_id_type' => gettype($session->user_id),
            ],
            'user_info' => [
                'id' => $user->id,
                'id_type' => gettype($user->id),
                'email' => $user->email,
            ],
            'comparisons' => [
                'strict' => ($session->user_id === $user->id),
                'loose' => ($session->user_id == $user->id),
                'type_cast_int' => ((int)$session->user_id === (int)$user->id),
                'type_cast_string' => ((string)$session->user_id === (string)$user->id),
            ],
            'likely_cause' => self::determineLikelyCause($session, $user),
            'recommended_action' => self::getRecommendedAction($session, $user),
        ];

        return $summary;
    }

    /**
     * Determine the likely cause of the canEdit issue
     */
    private static function determineLikelyCause($session, $user): string
    {
        $sessionUserId = $session->user_id;
        $currentUserId = $user->id;

        if ($sessionUserId !== $currentUserId && $sessionUserId != $currentUserId) {
            return 'User IDs are actually different - user should not have edit access';
        }

        if ($sessionUserId == $currentUserId && $sessionUserId !== $currentUserId) {
            return 'Data type mismatch between session.user_id and user.id';
        }

        if (gettype($sessionUserId) !== gettype($currentUserId)) {
            return 'Type casting issue: ' . gettype($sessionUserId) . ' vs ' . gettype($currentUserId);
        }

        return 'Unknown cause - values and types appear to match';
    }

    /**
     * Get recommended action based on the issue
     */
    private static function getRecommendedAction($session, $user): string
    {
        $sessionUserId = $session->user_id;
        $currentUserId = $user->id;

        if ($sessionUserId !== $currentUserId && $sessionUserId != $currentUserId) {
            return 'No action needed - user correctly denied edit access';
        }

        if ($sessionUserId == $currentUserId && $sessionUserId !== $currentUserId) {
            if (gettype($sessionUserId) !== gettype($currentUserId)) {
                return 'Fix database schema to ensure consistent data types';
            }
            return 'Use loose comparison (==) or type casting in canEdit logic';
        }

        return 'Investigate further - issue cause unclear';
    }
}