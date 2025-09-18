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
            'message' => 'required|string|max:5000',
        ]);

        $user = auth()->user();
        
        // Check if user can send messages to this session
        if ($session->user_id !== $user->id) {
            abort(403, 'Anda hanya dapat mengirim pesan ke sesi chat Anda sendiri.');
        }

        // Save user message
        ChatHistory::create([
            'user_id' => $user->id,
            'chat_session_id' => $session->id,
            'message' => $request->message,
            'sender' => 'user',
        ]);

        // Get chat history for context
        $chatHistory = $session->chatHistories()
            ->orderBy('created_at', 'asc')
            ->get(['message', 'sender'])
            ->toArray();

        // Generate AI response based on persona with context
        $aiResponse = $this->generateAIResponse($request->message, $session->persona, $chatHistory, $session->chat_type);
        
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
     * Generate AI response based on persona with chat history context
     */
    private function generateAIResponse(string $message, string $persona, array $chatHistory = [], string $chatType = 'persona'): string
    {
        $aiService = new AIService();
        return $aiService->generateResponse($message, $persona, $chatHistory, $chatType);
    }
}