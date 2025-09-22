<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\ChatHistory;
use App\Services\AIService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
        if ($session->user_id !== $user->id && !$session->canBeViewedByRole($user->role)) {
            abort(403, 'Anda tidak memiliki izin untuk melihat sesi chat ini.');
        }

        $session->load(['user', 'chatHistories' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }]);

        return Inertia::render('Chat/Show', [
            'session' => $session,
            'userRole' => $user->role,
            'canEdit' => $session->user_id === $user->id,
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
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10MB max per image
        ]);

        $user = auth()->user();
        
        // Check if user can send messages to this session
        if ($session->user_id !== $user->id) {
            abort(403, 'Anda hanya dapat mengirim pesan ke sesi chat Anda sendiri.');
        }

        // Validate that either message or images are provided
        if (empty($request->message) && empty($request->images)) {
            return back()->withErrors(['message' => 'Pesan atau gambar harus disediakan.']);
        }

        // Handle image uploads
        $imageUrls = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('chat-images', 'public');
                $imageUrls[] = asset('storage/' . $path);
            }
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
        $aiResponse = $this->generateAIResponse(
            $messageContent, 
            $session->persona, 
            $chatHistory, 
            $session->chat_type,
            $imageUrls
        );
        
        // Save AI response
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
        
        if ($session->user_id !== $user->id) {
            abort(403, 'Anda hanya dapat memodifikasi sesi chat Anda sendiri.');
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
        
        if ($session->user_id !== $user->id) {
            abort(403, 'Anda hanya dapat menghapus sesi chat Anda sendiri.');
        }

        $session->delete();

        return redirect()->route('chat.index')->with('message', 'Sesi chat berhasil dihapus.');
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
        $totalMessages = ChatHistory::whereIn('chat_session_id', 
            ChatSession::where('user_id', $user->id)->pluck('id')
        )->count();
        
        // AI messages count
        $aiMessages = ChatHistory::whereIn('chat_session_id', 
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
        $aiService = new AIService();
        return $aiService->generateResponse($message, $persona, $chatHistory, $chatType, $imageUrls);
    }
}