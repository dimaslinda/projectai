<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Services\AIService;
use App\Helpers\ProductionDebugHelper;
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
        ]);

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
            'persona' => $persona,
            'description' => $request->description,
            'is_shared' => true, // Enable sharing by default
            'shared_with_roles' => [$user->role], // Share with user's role
            'last_activity_at' => now(),
        ]);



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

        // Production-safe canEdit logic with type-safe comparison
        $canEdit = $this->canUserEditSession($session, $user);
        
        // Comprehensive production debugging using helper
        ProductionDebugHelper::logCanEditDebug($session, $user, $canEdit, 'ChatController::show');
        
        // Log environment info jika ini adalah masalah canEdit
        if (!$canEdit) {
            ProductionDebugHelper::logEnvironmentInfo();
            $issueSummary = ProductionDebugHelper::createIssueSummary($session, $user);
            Log::warning('CanEdit Issue Summary', $issueSummary);
        }

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
            $aiResponse = $this->generateAIResponse(
                $messageContent,
                $session->persona,
                $chatHistory,
                $session->chat_type,
                $imageUrls
            );

            // Check if response is empty or null
            if (empty(trim($aiResponse))) {
                $aiResponse = $this->getErrorMessage('empty_response', $session->persona);
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
        }

        // Save AI response (including error messages)
        ChatHistory::create([
            'user_id' => $user->id,
            'chat_session_id' => $session->id,
            'message' => $aiResponse,
            'sender' => 'ai',
            'metadata' => [
                'persona' => $session->persona,
                'chat_type' => $session->chat_type,
                'timestamp' => now()->toISOString(),
                'images' => $imageUrls,
                'is_error' => strpos($aiResponse, 'Maaf, saya mengalami kesulitan') === 0,
            ],
        ]);

        // Update session last activity
        $session->updateLastActivity();

        return back();
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
     * Generate AI response based on persona with chat history context
     */
    private function generateAIResponse(string $message, ?string $persona, array $chatHistory = [], string $chatType = 'persona', array $imageUrls = []): string
    {
        // Set unlimited execution time for AI processing
        set_time_limit(0);

        $aiService = new AIService();
        $response = $aiService->generateResponse($message, $persona, $chatHistory, $chatType, $imageUrls);

        return $response;
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
        
        // Log the comparison attempt for production debugging
        if (app()->environment('production')) {
            Log::info('canUserEditSession Debug', [
                'session_user_id' => $sessionUserId,
                'session_user_id_type' => gettype($sessionUserId),
                'current_user_id' => $currentUserId,
                'current_user_id_type' => gettype($currentUserId),
                'user_role' => $user->role,
                'session_is_shared' => $session->is_shared,
                'session_shared_with_roles' => $session->shared_with_roles,
                'method' => 'canUserEditSession',
            ]);
        }
        
        // Primary check: Strict comparison (preferred)
        if ($sessionUserId === $currentUserId) {
            return true;
        }
        
        // Fallback 1: Type-cast both to integers and compare
        // This handles cases where one might be string and other integer
        if ((int)$sessionUserId === (int)$currentUserId) {
            // Log this fallback usage for monitoring
            Log::warning('canUserEditSession: Using type-cast fallback', [
                'session_user_id' => $sessionUserId,
                'session_user_id_type' => gettype($sessionUserId),
                'current_user_id' => $currentUserId,
                'current_user_id_type' => gettype($currentUserId),
                'environment' => app()->environment(),
            ]);
            return true;
        }
        
        // Fallback 2: Loose comparison (last resort)
        // This handles edge cases with type coercion
        if ($sessionUserId == $currentUserId) {
            // Log this fallback usage for monitoring
            Log::warning('canUserEditSession: Using loose comparison fallback', [
                'session_user_id' => $sessionUserId,
                'session_user_id_type' => gettype($sessionUserId),
                'current_user_id' => $currentUserId,
                'current_user_id_type' => gettype($currentUserId),
                'environment' => app()->environment(),
            ]);
            return true;
        }
        
        // Check if user can access shared session based on their role
        if ($session->canBeViewedByRole($user->role)) {
            if (app()->environment('production')) {
                Log::info('canUserEditSession: Access granted via shared session', [
                    'user_role' => $user->role,
                    'session_is_shared' => $session->is_shared,
                    'session_shared_with_roles' => $session->shared_with_roles,
                ]);
            }
            return true;
        }
        
        // No match found
        return false;
    }

}