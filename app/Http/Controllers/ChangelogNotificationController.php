<?php

namespace App\Http\Controllers;

use App\Models\Changelog;
use App\Models\UserChangelogView;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChangelogNotificationController extends Controller
{
    /**
     * Get unread changelogs for the authenticated user.
     */
    public function getUnreadChangelogs(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get published changelogs that user hasn't viewed yet
        $unreadChangelogs = Changelog::where('is_published', true)
            ->whereNotIn('id', function ($query) use ($user) {
                $query->select('changelog_id')
                      ->from('user_changelog_views')
                      ->where('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->limit(5) // Limit to 5 most recent unread
            ->get();

        return response()->json([
            'unread_count' => $unreadChangelogs->count(),
            'changelogs' => $unreadChangelogs,
        ]);
    }

    /**
     * Mark a changelog as read by the authenticated user.
     */
    public function markAsRead(Request $request, int $changelogId): JsonResponse
    {
        $user = $request->user();
        
        // Check if changelog exists
        $changelog = Changelog::find($changelogId);
        if (!$changelog) {
            return response()->json(['error' => 'Changelog not found'], 404);
        }

        // Mark as viewed
        $user->markChangelogAsViewed($changelogId);

        return response()->json(['message' => 'Changelog marked as read']);
    }

    /**
     * Mark all changelogs as read by the authenticated user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get all published changelog IDs that user hasn't viewed
        $unreadChangelogIds = Changelog::where('is_published', true)
            ->whereNotIn('id', function ($query) use ($user) {
                $query->select('changelog_id')
                      ->from('user_changelog_views')
                      ->where('user_id', $user->id);
            })->pluck('id');

        // Mark all as viewed
        foreach ($unreadChangelogIds as $changelogId) {
            $user->markChangelogAsViewed($changelogId);
        }

        return response()->json([
            'message' => 'All changelogs marked as read',
            'marked_count' => $unreadChangelogIds->count(),
        ]);
    }

    /**
     * Get changelog notification status for dashboard banner.
     */
    public function getNotificationStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get the latest published changelog that user hasn't viewed
        $latestUnreadChangelog = Changelog::where('is_published', true)
            ->whereNotIn('id', function ($query) use ($user) {
                $query->select('changelog_id')
                      ->from('user_changelog_views')
                      ->where('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json([
            'has_unread' => $latestUnreadChangelog !== null,
            'latest_changelog' => $latestUnreadChangelog,
        ]);
    }
}
