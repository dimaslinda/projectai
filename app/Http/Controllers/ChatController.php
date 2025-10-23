<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Services\AIService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Display the chat interface
     */
    public function index(): Response
    {
        $user = auth()->user();

        // Get user's chat sessions (both persona and global)
        $mySessions = ChatSession::where('user_id', $user->id)
            ->with(['latestMessage', 'user'])
            ->orderBy('last_activity_at', 'desc')
            ->get();

        // Get shared sessions from other users with same role
        $sharedSessions = ChatSession::viewableByRole($user->role)
            ->where('user_id', '!=', $user->id)
            ->where('is_shared', true)
            ->with(['latestMessage', 'user'])
            ->orderBy('last_activity_at', 'desc')
            ->get();

        return Inertia::render('Chat/Index', [
            'mySessions' => $mySessions,
            'sharedSessions' => $sharedSessions,
            'userRole' => $user->role,
        ]);
    }

    /**
     * Create a new chat session
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($user) {
                    $exists = ChatSession::where('user_id', $user->id)
                        ->where('title', $value)
                        ->exists();

                    if ($exists) {
                        $fail('Judul sesi sudah ada. Silakan gunakan judul yang berbeda.');
                    }
                }
            ],
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:global,persona',
            'preferred_model' => 'nullable|string|in:gemini-2.5-pro,gemini-2.5-flash-image',
        ]);

        // Tambahan pembatasan: role "user" hanya boleh membuat chat global
        if ($request->type === 'persona' && $user->role === 'user') {
            return back()->withErrors(['type' => 'Role pengguna umum hanya diperbolehkan membuat chat global.']);
        }

        // Determine persona based on chat type and user role
        $persona = null;
        if ($request->type === 'persona') {
            // For persona chat, automatically use user's role as persona
            $persona = $user->role;

            // Validate that user role is a valid persona
            if (!in_array($persona, ['engineer', 'drafter', 'esr'])) {
                return back()->withErrors(['type' => 'Role Anda tidak memiliki persona yang sesuai untuk chat persona.']);
            }
        }

        $session = ChatSession::create([
            'user_id' => $user->id,
            'title' => $request->title,
            'chat_type' => $request->type,
            'preferred_model' => $request->preferred_model ?? 'gemini-2.5-pro',
            'persona' => $persona,
            'description' => $request->description,
            'is_shared' => false, // Do not share by default
            'shared_with_roles' => null, // No shared roles by default
            'last_activity_at' => now(),
        ]);

        // If a message is provided, process it as the first message
        if ($request->has('message') && !empty($request->message)) {
            try {
                // Create user message history
                $userHistory = ChatHistory::create([
                    'user_id' => $user->id,
                    'chat_session_id' => $session->id,
                    'message' => $request->message,
                    'sender' => 'user',
                    'metadata' => json_encode([
                        'timestamp' => now()->toISOString(),
                        'user_agent' => $request->userAgent(),
                    ]),
                ]);

                // Generate AI response
                $aiResponse = $this->generateAIResponse(
                    $request->message,
                    $persona,
                    [],
                    $request->type ?? 'global',
                    [],
                    null,
                    $session
                );

                // Create AI response history
                ChatHistory::create([
                    'user_id' => $user->id,
                    'chat_session_id' => $session->id,
                    'message' => $aiResponse['response'],
                    'sender' => 'ai',
                    'metadata' => json_encode([
                        'timestamp' => now()->toISOString(),
                        'model' => $session->preferred_model,
                        'type' => $aiResponse['type'] ?? 'text',
                        'image_url' => $aiResponse['image_url'] ?? null,
                    ]),
                ]);

                // Return JSON response for API requests with AI response
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Chat session created and message sent successfully',
                        'session_id' => $session->id,
                        'user_message_id' => $userHistory->id,
                        'response' => $aiResponse['response'],
                        'type' => $aiResponse['type'] ?? 'text',
                        'image_url' => $aiResponse['image_url'] ?? null,
                        'redirect_url' => route('chat.show', $session)
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Error processing first message in store method: ' . $e->getMessage());
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Chat session created but failed to send first message: ' . $e->getMessage(),
                        'session_id' => $session->id,
                        'redirect_url' => route('chat.show', $session)
                    ], 500);
                }
            }
        }

        // Return JSON response for API requests, redirect for web requests
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Chat session created successfully',
                'session_id' => $session->id,
                'redirect_url' => route('chat.show', $session)
            ]);
        }

        return redirect()->route('chat.show', $session);
    }

    /**
     * Display a specific chat session
     */
    public function show(ChatSession $session): Response
    {
        $user = auth()->user();

        // Check if user can view this session
        // User can view if they own the session OR if it's shared with their role
        $isOwner = ($session->user_id === $user->id) ||
            ((int)$session->user_id === (int)$user->id) ||
            ($session->user_id == $user->id);
        $canViewShared = $session->canBeViewedByRole($user->role);
        $canView = $isOwner || $canViewShared;

        if (!$canView) {
            abort(403, 'Anda tidak memiliki izin untuk melihat sesi chat ini.');
        }

        $session->load(['user', 'chatHistories' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }]);

        // Check if user can edit this session
        $canEdit = $this->canUserEditSession($session, $user);

        return Inertia::render('Chat/Show', [
            'session' => $session,
            'userRole' => $user->role,
            'canEdit' => $canEdit,
        ]);
    }

    /**
     * Send a message in a chat session
     */
    public function sendMessage(Request $request, ChatSession $session)
    {
        $request->validate([
            'message' => 'nullable|string|max:5000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp,svg|max:10240', // 10MB max per image, SVG now supported
            'image_urls' => 'nullable|array|max:10',
            'image_urls.*' => 'url|max:2048',
            'selected_model' => 'nullable|string|in:gemini-2.5-pro,gemini-2.5-flash-image',
        ]);

        $user = auth()->user();

        // Check if user can send messages to this session (owner or shared access)
        if (!$this->canUserEditSession($session, $user)) {
            abort(403, 'Anda tidak memiliki akses untuk mengirim pesan ke sesi chat ini.');
        }

        // Validate that either message, images, or image URLs are provided
        if (empty($request->message) && empty($request->images) && empty($request->image_urls)) {
            return back()->withErrors(['message' => 'Pesan, gambar, atau URL gambar harus disediakan.']);
        }

        // Handle image uploads
        $imageUrls = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('chat-images', 'public');
                $imageUrls[] = asset('storage/' . $path);
            }
        }

        // Add image URLs from request
        if ($request->has('image_urls') && is_array($request->image_urls)) {
            $imageUrls = array_merge($imageUrls, $request->image_urls);
        }

        // Prepare message content
        $messageContent = $request->message ?? '';
        $metadata = [
            'images' => $imageUrls,
            'has_images' => !empty($imageUrls),
        ];

        // Save user message
        $userMessage = ChatHistory::create([
            'user_id' => $user->id,
            'chat_session_id' => $session->id,
            'message' => $messageContent,
            'sender' => 'user',
            'metadata' => $metadata,
        ]);

        // Get chat history for context
        $chatHistory = $session->chatHistories()
            ->orderBy('created_at', 'asc')
            ->get(['message', 'sender', 'metadata'])
            ->toArray();

        // Generate AI response based on persona with context and images
        try {
            $aiResult = $this->generateAIResponse(
                $messageContent,
                $session->persona,
                $chatHistory,
                $session->chat_type,
                $imageUrls,
                $request->selected_model,
                $session
            );

            $aiResponse = $aiResult['response'];
            $tokenUsage = $aiResult['token_usage'];

            // Check if response is empty or null
            if (empty(trim($aiResponse))) {
                $aiResponse = $this->getErrorMessage('empty_response', $session->persona);
                $tokenUsage = null; // No token usage for error messages
            }
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('AI Response Generation Failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'session_id' => $session->id,
                'persona' => $session->persona,
                'message_length' => strlen($messageContent),
                'has_images' => !empty($imageUrls)
            ]);

            // Generate user-friendly error message
            $aiResponse = $this->getErrorMessage('generation_failed', $session->persona, $e->getMessage());
            $tokenUsage = null; // No token usage for error messages
        }

        // Prepare metadata for AI response
        $metadata = [
            'persona' => $session->persona,
            'chat_type' => $session->chat_type,
            'timestamp' => now()->toISOString(),
            'images' => $imageUrls,
            'is_error' => strpos($aiResponse, 'Maaf, saya mengalami kesulitan') === 0,
        ];

        // Add image_url to metadata if this is an image generation response
        if (isset($aiResult['image_url']) && !empty($aiResult['image_url'])) {
            $metadata['generated_image'] = $aiResult['image_url'];
            $metadata['response_type'] = $aiResult['type'] ?? 'image';
        }

        // Save AI response (including error messages)
        ChatHistory::create([
            'user_id' => $user->id,
            'chat_session_id' => $session->id,
            'message' => $aiResponse,
            'sender' => 'ai',
            'input_tokens' => $tokenUsage['input_tokens'] ?? null,
            'output_tokens' => $tokenUsage['output_tokens'] ?? null,
            'total_tokens' => $tokenUsage['total_tokens'] ?? null,
            'metadata' => $metadata,
        ]);

        // Update session last activity
        $session->updateLastActivity();

        // Return JSON response for API requests, redirect for web requests
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'user_message_id' => $userMessage->id
            ]);
        }

        return back();
    }

    /**
     * Create a new message with streaming AI response
     */
    public function createMessageStream(Request $request, ChatSession $session)
    {
        $user = auth()->user();

        // Check if user can edit this session
        if (!$this->canUserEditSession($session, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'message' => 'required|string|max:10000',
            'images.*' => 'image|mimes:jpeg,jpg,png,gif,webp|max:10240', // 10MB max per image
            'selected_model' => 'nullable|string|in:gemini-2.5-pro,gemini-2.5-flash-image',
        ]);

        // Handle image uploads
        $imageUrls = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('chat-images', 'public');
                $imageUrls[] = asset('storage/' . $path);
            }
        }

        // Handle image URLs from request
        if ($request->has('image_urls') && is_array($request->image_urls)) {
            $imageUrls = array_merge($imageUrls, $request->image_urls);
        }

        // Prepare message content
        $messageContent = $request->message ?? '';
        $metadata = [
            'images' => $imageUrls,
            'has_images' => !empty($imageUrls),
        ];

        // Save user message
        $userMessage = ChatHistory::create([
            'user_id' => $user->id,
            'chat_session_id' => $session->id,
            'message' => $messageContent,
            'sender' => 'user',
            'metadata' => $metadata,
        ]);

        // Get chat history for context
        $chatHistory = $session->chatHistories()
            ->orderBy('created_at', 'asc')
            ->get(['message', 'sender', 'metadata'])
            ->toArray();

        // Return streaming response
        return response()->stream(function () use ($messageContent, $session, $chatHistory, $imageUrls, $user, $request) {
            // Set headers for SSE
            echo "data: " . json_encode(['type' => 'start', 'message' => 'AI mulai mengetik...']) . "\n\n";
            ob_flush();
            flush();

            try {
                // Generate AI response with streaming
                $fullResponse = '';
                $aiResult = $this->generateAIResponseStream(
                    $messageContent,
                    $session->persona,
                    $chatHistory,
                    $session->chat_type,
                    $imageUrls,
                    function ($chunk) use (&$fullResponse) {
                        $fullResponse .= $chunk;
                        echo "data: " . json_encode(['type' => 'chunk', 'content' => $chunk]) . "\n\n";
                        ob_flush();
                        flush();
                        usleep(50000); // 50ms delay for typing effect
                    },
                    $request->selected_model,
                    $session
                );

                $tokenUsage = $aiResult['token_usage'];

                // Check if response is empty or null
                if (empty(trim($fullResponse))) {
                    $fullResponse = $this->getErrorMessage('empty_response', $session->persona);
                    $tokenUsage = null; // No token usage for error messages
                    echo "data: " . json_encode(['type' => 'chunk', 'content' => $fullResponse]) . "\n\n";
                    ob_flush();
                    flush();
                }

                // Prepare metadata for AI response
                $metadata = [
                    'persona' => $session->persona,
                    'chat_type' => $session->chat_type,
                    'timestamp' => now()->toISOString(),
                    'images' => $imageUrls,
                    'is_error' => strpos($fullResponse, 'Maaf, saya mengalami kesulitan') === 0,
                ];

                // Add image_url to metadata if this is an image generation response
                if (isset($aiResult['image_url']) && !empty($aiResult['image_url'])) {
                    $metadata['generated_image'] = $aiResult['image_url'];
                    $metadata['response_type'] = $aiResult['type'] ?? 'image';

                    // Send image information to frontend
                    echo "data: " . json_encode([
                        'type' => 'image',
                        'image_url' => $aiResult['image_url'],
                        'image_type' => $aiResult['type'] ?? 'image'
                    ]) . "\n\n";
                    ob_flush();
                    flush();
                }

                // Save AI response
                $aiMessage = ChatHistory::create([
                    'user_id' => $user->id,
                    'chat_session_id' => $session->id,
                    'message' => $fullResponse,
                    'sender' => 'ai',
                    'input_tokens' => $tokenUsage['input_tokens'] ?? null,
                    'output_tokens' => $tokenUsage['output_tokens'] ?? null,
                    'total_tokens' => $tokenUsage['total_tokens'] ?? null,
                    'metadata' => $metadata,
                ]);

                // Update session last activity
                $session->updateLastActivity();

                echo "data: " . json_encode(['type' => 'complete', 'message_id' => $aiMessage->id]) . "\n\n";
                ob_flush();
                flush();
            } catch (\Exception $e) {
                // Log the error
                Log::error('AI Response Generation Failed', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id,
                    'session_id' => $session->id,
                    'persona' => $session->persona,
                    'message_length' => strlen($messageContent),
                    'has_images' => !empty($imageUrls)
                ]);

                // Send error message
                $errorMessage = $this->getErrorMessage('generation_failed', $session->persona, $e->getMessage());
                echo "data: " . json_encode(['type' => 'error', 'content' => $errorMessage]) . "\n\n";
                ob_flush();
                flush();

                // Save error message
                ChatHistory::create([
                    'user_id' => $user->id,
                    'chat_session_id' => $session->id,
                    'message' => $errorMessage,
                    'sender' => 'ai',
                    'metadata' => [
                        'persona' => $session->persona,
                        'chat_type' => $session->chat_type,
                        'timestamp' => now()->toISOString(),
                        'images' => $imageUrls,
                        'is_error' => true,
                    ],
                ]);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Disable nginx buffering
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Headers' => 'Cache-Control',
        ]);
    }

    /**
     * Toggle sharing status of a chat session
     */
    public function toggleSharing(ChatSession $session)
    {
        $user = auth()->user();

        // Only the actual owner can toggle sharing, not users with shared access
        // Use type-safe comparison to handle production data type issues
        $sessionUserId = $session->user_id;
        $currentUserId = $user->id;

        $isOwner = ($sessionUserId === $currentUserId) ||
            ((int)$sessionUserId === (int)$currentUserId) ||
            ($sessionUserId == $currentUserId);

        if (!$isOwner) {
            abort(403, 'Anda hanya dapat memodifikasi pengaturan berbagi sesi chat Anda sendiri.');
        }

        $session->update([
            'is_shared' => !$session->is_shared,
            'shared_with_roles' => !$session->is_shared ? [$user->role] : null,
        ]);

        return back()->with('message', 'Status berbagi berhasil diperbarui.');
    }

    /**
     * Delete a chat session
     */
    public function destroy(ChatSession $session)
    {
        $user = auth()->user();

        // Only the actual owner can delete the session
        // Use type-safe comparison to handle production data type issues
        $sessionUserId = $session->user_id;
        $currentUserId = $user->id;

        $isOwner = ($sessionUserId === $currentUserId) ||
            ((int)$sessionUserId === (int)$currentUserId) ||
            ($sessionUserId == $currentUserId);

        if (!$isOwner) {
            abort(403, 'Anda hanya dapat menghapus sesi chat Anda sendiri.');
        }

        $session->delete();

        return redirect()->route('chat.index')->with('message', 'Sesi chat berhasil dihapus.');
    }

    /**
     * Delete multiple chat sessions
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'session_ids' => 'required|array|min:1',
            'session_ids.*' => 'integer|exists:chat_sessions,id',
        ]);

        $user = auth()->user();

        // Get sessions that belong to the user
        $sessions = ChatSession::whereIn('id', $request->session_ids)
            ->where('user_id', $user->id)
            ->get();

        if ($sessions->count() !== count($request->session_ids)) {
            abort(403, 'Anda hanya dapat menghapus sesi chat Anda sendiri.');
        }

        $deletedCount = $sessions->count();

        // Delete all sessions
        ChatSession::whereIn('id', $request->session_ids)
            ->where('user_id', $user->id)
            ->delete();

        return back()->with('message', "Berhasil menghapus {$deletedCount} sesi chat.");
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats()
    {
        $user = auth()->user();

        // Total chat sessions
        $totalSessions = ChatSession::where('user_id', $user->id)->count();

        // Active sessions (with activity in last 7 days)
        $activeSessions = ChatSession::where('user_id', $user->id)
            ->where('last_activity_at', '>=', now()->subDays(7))
            ->count();

        // Sessions by persona
        $sessionsByPersona = ChatSession::where('user_id', $user->id)
            ->selectRaw('persona, COUNT(*) as count')
            ->groupBy('persona')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->persona ?? 'global' => $item->count];
            });

        // Recent sessions
        $recentSessions = ChatSession::where('user_id', $user->id)
            ->with(['latestMessage'])
            ->orderBy('last_activity_at', 'desc')
            ->limit(5)
            ->get();

        // Total messages
        $totalMessages = ChatHistory::whereIn(
            'chat_session_id',
            ChatSession::where('user_id', $user->id)->pluck('id')
        )->count();

        // AI messages count
        $aiMessages = ChatHistory::whereIn(
            'chat_session_id',
            ChatSession::where('user_id', $user->id)->pluck('id')
        )->where('sender', 'ai')->count();

        return response()->json([
            'totalSessions' => $totalSessions,
            'activeSessions' => $activeSessions,
            'sessionsByPersona' => $sessionsByPersona,
            'recentSessions' => $recentSessions,
            'totalMessages' => $totalMessages,
            'aiMessages' => $aiMessages,
        ]);
    }

    /**
     * Get AI traffic data for dashboard
     */
    public function getAITrafficData()
    {
        $user = auth()->user();

        // Check if user has admin access
        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get data for different time periods
        $dailyData = $this->getTrafficDataByPeriod('daily', 30); // Last 30 days
        $weeklyData = $this->getTrafficDataByPeriod('weekly', 12); // Last 12 weeks
        $monthlyData = $this->getTrafficDataByPeriod('monthly', 12); // Last 12 months
        $yearlyData = $this->getTrafficDataByPeriod('yearly', 5); // Last 5 years

        return response()->json([
            'dailyData' => $dailyData,
            'weeklyData' => $weeklyData,
            'monthlyData' => $monthlyData,
            'yearlyData' => $yearlyData,
        ]);
    }

    /**
     * Get user report data for dashboard
     */
    public function getUserReportData()
    {
        $user = auth()->user();

        // Check if user has admin access
        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get persona statistics
        $personaStats = $this->getPersonaStatistics();

        // Get top users
        $topUsers = $this->getTopUsers();

        // Get user growth data
        $userGrowth = $this->getUserGrowthData();

        // Get user counts
        $totalUsers = \App\Models\User::count();
        $activeUsers = \App\Models\User::whereHas('chatSessions', function ($query) {
            $query->where('last_activity_at', '>=', now()->subDays(30));
        })->count();
        $inactiveUsers = $totalUsers - $activeUsers;

        // Get token usage data
        $tokenUsageData = $this->getTokenUsageData();

        return response()->json([
            'personaStats' => $personaStats,
            'topUsers' => $topUsers,
            'userGrowth' => $userGrowth,
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'inactiveUsers' => $inactiveUsers,
            'tokenUsage' => $tokenUsageData,
        ]);
    }

    /**
     * Get traffic data by period
     */
    private function getTrafficDataByPeriod(string $period, int $limit)
    {
        $data = [];
        $personas = ['global', 'drafter', 'engineer'];

        for ($i = $limit - 1; $i >= 0; $i--) {
            $startDate = null;
            $endDate = null;
            $periodLabel = '';

            switch ($period) {
                case 'daily':
                    $date = now()->subDays($i);
                    $startDate = $date->copy()->startOfDay();
                    $endDate = $date->copy()->endOfDay();
                    $periodLabel = $date->format('M j');
                    break;
                case 'weekly':
                    $date = now()->subWeeks($i);
                    $startDate = $date->copy()->startOfWeek();
                    $endDate = $date->copy()->endOfWeek();
                    $periodLabel = 'Week ' . $date->format('W');
                    break;
                case 'monthly':
                    $date = now()->subMonths($i);
                    $startDate = $date->copy()->startOfMonth();
                    $endDate = $date->copy()->endOfMonth();
                    $periodLabel = $date->format('M Y');
                    break;
                case 'yearly':
                    $date = now()->subYears($i);
                    $startDate = $date->copy()->startOfYear();
                    $endDate = $date->copy()->endOfYear();
                    $periodLabel = $date->format('Y');
                    break;
            }

            // Create data for each persona and aggregated data
            foreach ($personas as $persona) {
                // Get sessions for this persona in this period
                $sessions = ChatSession::whereBetween('created_at', [$startDate, $endDate])
                    ->where(function ($query) use ($persona) {
                        if ($persona === 'global') {
                            $query->whereNull('persona');
                        } else {
                            $query->where('persona', $persona);
                        }
                    })
                    ->get();

                $sessionIds = $sessions->pluck('id');

                // Get messages for this persona in this period
                $messages = ChatHistory::whereIn('chat_session_id', $sessionIds)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->get();

                $aiMessages = $messages->where('sender', 'ai')->count();
                $userMessages = $messages->where('sender', 'user')->count();

                // Calculate average response time (mock data for now)
                $avgResponseTime = rand(100, 300) / 100; // 1-3 seconds

                $data[] = [
                    'period' => $periodLabel,
                    'aiMessages' => $aiMessages,
                    'userMessages' => $userMessages,
                    'sessions' => $sessions->count(),
                    'avgResponseTime' => $avgResponseTime,
                    'persona' => $persona,
                ];
            }

            // Also create aggregated data for "all" personas
            $allSessions = ChatSession::whereBetween('created_at', [$startDate, $endDate])->get();
            $allSessionIds = $allSessions->pluck('id');
            $allMessages = ChatHistory::whereIn('chat_session_id', $allSessionIds)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $data[] = [
                'period' => $periodLabel,
                'aiMessages' => $allMessages->where('sender', 'ai')->count(),
                'userMessages' => $allMessages->where('sender', 'user')->count(),
                'sessions' => $allSessions->count(),
                'avgResponseTime' => rand(100, 300) / 100,
                'persona' => 'all',
            ];
        }

        return $data;
    }

    /**
     * Get persona statistics
     */
    private function getPersonaStatistics()
    {
        $personas = ['global', 'drafter', 'engineer'];
        $colors = ['#3b82f6', '#10b981', '#f59e0b'];
        $stats = [];

        foreach ($personas as $index => $persona) {
            $userCount = \App\Models\User::whereHas('chatSessions', function ($query) use ($persona) {
                if ($persona === 'global') {
                    $query->whereNull('persona');
                } else {
                    $query->where('persona', $persona);
                }
            })->count();

            $activeUsers = \App\Models\User::whereHas('chatSessions', function ($query) use ($persona) {
                if ($persona === 'global') {
                    $query->whereNull('persona');
                } else {
                    $query->where('persona', $persona);
                }
                $query->where('last_activity_at', '>=', now()->subDays(30));
            })->count();

            $totalSessions = ChatSession::where(function ($query) use ($persona) {
                if ($persona === 'global') {
                    $query->whereNull('persona');
                } else {
                    $query->where('persona', $persona);
                }
            })->count();

            $avgSessionsPerUser = $userCount > 0 ? $totalSessions / $userCount : 0;

            $stats[] = [
                'persona' => $persona,
                'userCount' => $userCount,
                'activeUsers' => $activeUsers,
                'totalSessions' => $totalSessions,
                'avgSessionsPerUser' => $avgSessionsPerUser,
                'color' => $colors[$index],
            ];
        }

        return $stats;
    }

    /**
     * Get top users by activity
     */
    private function getTopUsers()
    {
        return \App\Models\User::withCount(['chatSessions', 'chatHistories'])
            ->with(['chatSessions' => function ($query) {
                $query->select('user_id', 'persona')
                    ->groupBy('user_id', 'persona')
                    ->orderBy('created_at', 'desc');
            }])
            ->orderBy('chat_sessions_count', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($user) {
                $favoritePersona = $user->chatSessions
                    ->groupBy('persona')
                    ->map(function ($sessions) {
                        return $sessions->count();
                    })
                    ->sortDesc()
                    ->keys()
                    ->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'totalSessions' => $user->chat_sessions_count,
                    'totalMessages' => $user->chat_histories_count,
                    'lastActivity' => $user->chatSessions->max('last_activity_at'),
                    'favoritePersona' => $favoritePersona ?? 'global',
                ];
            });
    }

    /**
     * Get user growth data
     */
    private function getUserGrowthData()
    {
        $data = [];

        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $startDate = $date->copy()->startOfMonth();
            $endDate = $date->copy()->endOfMonth();

            $newUsers = \App\Models\User::whereBetween('created_at', [$startDate, $endDate])->count();
            $totalUsers = \App\Models\User::where('created_at', '<=', $endDate)->count();
            $activeUsers = \App\Models\User::whereHas('chatSessions', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('last_activity_at', [$startDate, $endDate]);
            })->count();

            $data[] = [
                'period' => $date->format('M Y'),
                'newUsers' => $newUsers,
                'activeUsers' => $activeUsers,
                'totalUsers' => $totalUsers,
            ];
        }

        return $data;
    }

    /**
     * Generate AI response based on persona with chat history context
     */
    private function generateAIResponse(string $message, ?string $persona, array $chatHistory = [], string $chatType = 'persona', array $imageUrls = [], ?string $selectedModel = null, ?ChatSession $session = null): array
    {
        // Set unlimited execution time for AI processing
        set_time_limit(0);

        // Use session's preferred model as fallback if no specific model is selected
        if (!$selectedModel && $session && $session->preferred_model) {
            $selectedModel = $session->preferred_model;
        }

        // Log the parameters being passed to AIService
        Log::info('ChatController calling AIService', [
            'message' => $message,
            'persona' => $persona,
            'chat_type' => $chatType,
            'selected_model' => $selectedModel,
            'has_images' => !empty($imageUrls),
            'image_count' => count($imageUrls),
            'session_id' => $session ? $session->id : null
        ]);

        $aiService = new AIService();
        $response = $aiService->generateResponse($message, $persona, $chatHistory, $chatType, $imageUrls, $selectedModel);
        $tokenUsage = $aiService->getLastTokenUsage();

        // Handle both string and array responses
        if (is_array($response)) {
            // Image generation response
            Log::info('AIService image response received', [
                'response_length' => strlen($response['response'] ?? ''),
                'response_preview' => substr($response['response'] ?? '', 0, 100),
                'image_url' => $response['image_url'] ?? null,
                'type' => $response['type'] ?? 'unknown',
                'token_usage' => $tokenUsage
            ]);

            return [
                'response' => $response['response'] ?? '',
                'image_url' => $response['image_url'] ?? null,
                'type' => $response['type'] ?? 'text',
                'token_usage' => $tokenUsage
            ];
        } else {
            // Regular text response
            Log::info('AIService text response received', [
                'response_length' => strlen($response),
                'response_preview' => substr($response, 0, 100),
                'token_usage' => $tokenUsage
            ]);

            return [
                'response' => $response,
                'token_usage' => $tokenUsage
            ];
        }
    }

    /**
     * Generate AI response with streaming support
     */
    private function generateAIResponseStream(string $message, ?string $persona, array $chatHistory = [], string $chatType = 'persona', array $imageUrls = [], callable $callback = null, ?string $selectedModel = null, ?ChatSession $session = null): array
    {
        // Set unlimited execution time for AI processing
        set_time_limit(0);

        // Generate AI response using the original method
        $aiResult = $this->generateAIResponse($message, $persona, $chatHistory, $chatType, $imageUrls, $selectedModel, $session);
        $response = $aiResult['response'];
        $tokenUsage = $aiResult['token_usage'];

        if ($callback && !empty($response)) {
            // Split response into words for streaming effect
            $words = explode(' ', $response);
            $currentChunk = '';

            foreach ($words as $index => $word) {
                $currentChunk .= $word;

                // Send chunk every 3-5 words or at sentence endings
                if (($index + 1) % rand(3, 5) === 0 ||
                    str_ends_with($word, '.') ||
                    str_ends_with($word, '!') ||
                    str_ends_with($word, '?') ||
                    $index === count($words) - 1
                ) {

                    $callback($currentChunk . ' ');
                    $currentChunk = '';
                } else {
                    $currentChunk .= ' ';
                }
            }
        }

        return [
            'response' => $response,
            'token_usage' => $tokenUsage,
            'image_url' => $aiResult['image_url'] ?? null,
            'type' => $aiResult['type'] ?? 'text'
        ];
    }

    /**
     * Generate user-friendly error messages for different failure scenarios
     */
    private function getErrorMessage(string $errorType, ?string $persona = null, string $technicalError = ''): string
    {
        $personaName = $this->getPersonaDisplayName($persona);

        switch ($errorType) {
            case 'empty_response':
                return "Maaf, saya mengalami kesulitan dalam memproses permintaan Anda saat ini. " .
                    "Sebagai {$personaName}, saya tidak dapat memberikan respons yang memadai untuk pertanyaan ini. " .
                    "Silakan coba dengan pertanyaan yang lebih spesifik atau coba lagi dalam beberapa saat.";

            case 'generation_failed':
                $baseMessage = "Maaf, saya mengalami kesulitan teknis dalam memproses permintaan Anda. ";

                // Provide specific guidance based on technical error
                if (strpos($technicalError, 'timeout') !== false || strpos($technicalError, 'cURL error 28') !== false) {
                    $baseMessage .= "Sistem sedang mengalami keterlambatan respons. ";
                } elseif (strpos($technicalError, 'API') !== false) {
                    $baseMessage .= "Layanan AI sedang mengalami gangguan. ";
                } elseif (strpos($technicalError, 'image') !== false) {
                    $baseMessage .= "Terjadi masalah dalam memproses gambar yang Anda kirim. ";
                } elseif (strpos($technicalError, 'token') !== false || strpos($technicalError, 'MAX_TOKENS') !== false) {
                    $baseMessage .= "Permintaan Anda terlalu kompleks untuk diproses sekaligus. ";
                }

                $baseMessage .= "Sebagai {$personaName}, saya menyarankan untuk:\n\n";
                $baseMessage .= "• Mencoba dengan pertanyaan yang lebih sederhana\n";
                $baseMessage .= "• Mengurangi jumlah gambar jika ada\n";
                $baseMessage .= "• Mencoba lagi dalam beberapa menit\n\n";
                $baseMessage .= "Jika masalah berlanjut, silakan hubungi administrator sistem.";

                return $baseMessage;

            case 'image_processing_failed':
                return "Maaf, saya mengalami kesulitan dalam memproses gambar yang Anda kirim. " .
                    "Sebagai {$personaName}, saya menyarankan untuk:\n\n" .
                    "• Pastikan gambar dalam format yang didukung (JPG, PNG, GIF, SVG)\n" .
                    "• Ukuran gambar tidak terlalu besar (maksimal 10MB)\n" .
                    "• Coba kirim gambar satu per satu\n\n" .
                    "Silakan coba kirim ulang gambar atau ajukan pertanyaan tanpa gambar.";

            default:
                return "Maaf, saya mengalami kesulitan dalam memproses permintaan Anda saat ini. " .
                    "Sebagai {$personaName}, silakan coba lagi dalam beberapa saat atau hubungi administrator jika masalah berlanjut.";
        }
    }

    /**
     * Get display name for persona
     */
    private function getPersonaDisplayName(?string $persona): string
    {
        $personaNames = [
            'engineer' => 'Insinyur Sipil',
            'drafter' => 'Drafter Teknis',
            'esr' => 'Spesialis Tower Survey',
            'hr' => 'Spesialis Human Resources',
            'finance' => 'Spesialis Keuangan',
            'marketing' => 'Spesialis Marketing',
            'sales' => 'Spesialis Sales',
            'operations' => 'Spesialis Operations',
            'legal' => 'Spesialis Legal',
        ];

        return $personaNames[$persona] ?? 'Asisten AI';
    }

    /**
     * Check if user can edit/send messages to a session
     * Uses type-safe comparison to handle production data type issues
     * Also checks if user can access shared sessions based on their role
     */
    private function canUserEditSession(ChatSession $session, $user): bool
    {
        // Get the IDs
        $sessionUserId = $session->user_id;
        $currentUserId = $user->id;

        // Only the actual owner can edit/send messages
        // Use type-safe comparisons to handle production data type issues
        if ($sessionUserId === $currentUserId) {
            return true;
        }
        if ((int)$sessionUserId === (int)$currentUserId) {
            return true;
        }
        if ($sessionUserId == $currentUserId) {
            return true;
        }

        // Shared access is view-only; non-owners cannot edit
        return false;
    }

    /**
     * Get token usage data for users
     */
    private function getTokenUsageData()
    {
        // Get top users by token usage (last 30 days)
        $topTokenUsers = \App\Models\User::select('users.id', 'users.name', 'users.email', 'users.role')
            ->selectRaw('SUM(COALESCE(chat_histories.total_tokens, 0)) as total_tokens')
            ->selectRaw('SUM(COALESCE(chat_histories.input_tokens, 0)) as input_tokens')
            ->selectRaw('SUM(COALESCE(chat_histories.output_tokens, 0)) as output_tokens')
            ->selectRaw('COUNT(chat_histories.id) as message_count')
            ->leftJoin('chat_histories', function ($join) {
                $join->on('users.id', '=', 'chat_histories.user_id')
                    ->where('chat_histories.sender', '=', 'ai')
                    ->where('chat_histories.created_at', '>=', now()->subDays(30));
            })
            ->groupBy('users.id', 'users.name', 'users.email', 'users.role')
            ->orderByDesc('total_tokens')
            ->limit(10)
            ->get();

        // Get overall token statistics
        $totalTokensUsed = \App\Models\ChatHistory::where('sender', 'ai')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('total_tokens') ?? 0;

        $totalInputTokens = \App\Models\ChatHistory::where('sender', 'ai')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('input_tokens') ?? 0;

        $totalOutputTokens = \App\Models\ChatHistory::where('sender', 'ai')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('output_tokens') ?? 0;

        // Get token usage by persona (excluding global)
        $tokensByPersona = \App\Models\ChatHistory::select('metadata->persona as persona')
            ->selectRaw('SUM(COALESCE(total_tokens, 0)) as total_tokens')
            ->selectRaw('COUNT(*) as message_count')
            ->where('sender', 'ai')
            ->where('created_at', '>=', now()->subDays(30))
            ->whereNotNull('metadata->persona')
            ->groupBy('metadata->persona')
            ->get()
            ->map(function ($item) {
                return [
                    'persona' => $item->persona ?? 'global',
                    'total_tokens' => (int) $item->total_tokens,
                    'message_count' => (int) $item->message_count,
                    'avg_tokens_per_message' => $item->message_count > 0 ? round($item->total_tokens / $item->message_count, 2) : 0
                ];
            });

        // Get token usage for global chat (where persona is null)
        $globalTokenUsage = \App\Models\ChatHistory::selectRaw('SUM(COALESCE(total_tokens, 0)) as total_tokens')
            ->selectRaw('COUNT(*) as message_count')
            ->where('sender', 'ai')
            ->where('created_at', '>=', now()->subDays(30))
            ->where(function ($query) {
                $query->whereNull('metadata->persona')
                      ->orWhere('metadata->persona', '')
                      ->orWhereJsonContains('metadata->persona', null);
            })
            ->first();

        // Add global chat data to the persona collection
        if ($globalTokenUsage && $globalTokenUsage->total_tokens > 0) {
            $tokensByPersona->push([
                'persona' => 'global',
                'total_tokens' => (int) $globalTokenUsage->total_tokens,
                'message_count' => (int) $globalTokenUsage->message_count,
                'avg_tokens_per_message' => $globalTokenUsage->message_count > 0 ? round($globalTokenUsage->total_tokens / $globalTokenUsage->message_count, 2) : 0
            ]);
        }

        // Get daily token usage for the last 7 days
        $dailyTokenUsage = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $startDate = $date->copy()->startOfDay();
            $endDate = $date->copy()->endOfDay();

            $dayTokens = \App\Models\ChatHistory::where('sender', 'ai')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('total_tokens') ?? 0;

            $dailyTokenUsage[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'tokens' => (int) $dayTokens
            ];
        }

        return [
            'topUsers' => $topTokenUsers->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'total_tokens' => (int) $user->total_tokens,
                    'input_tokens' => (int) $user->input_tokens,
                    'output_tokens' => (int) $user->output_tokens,
                    'message_count' => (int) $user->message_count,
                    'avg_tokens_per_message' => $user->message_count > 0 ? round($user->total_tokens / $user->message_count, 2) : 0
                ];
            }),
            'overview' => [
                'total_tokens' => (int) $totalTokensUsed,
                'input_tokens' => (int) $totalInputTokens,
                'output_tokens' => (int) $totalOutputTokens,
                'period' => 'Last 30 days'
            ],
            'byPersona' => $tokensByPersona,
            'dailyUsage' => $dailyTokenUsage
        ];
    }
}