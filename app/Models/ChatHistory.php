<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatHistory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'chat_session_id',
        'message',
        'sender',
        'metadata',
        'input_tokens',
        'output_tokens',
        'total_tokens',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Get the user that owns the chat history.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the chat session that owns the chat history.
     */
    public function chatSession(): BelongsTo
    {
        return $this->belongsTo(ChatSession::class);
    }

    /**
     * Check if the message is from user.
     */
    public function isFromUser(): bool
    {
        return $this->sender === 'user';
    }

    /**
     * Check if the message is from AI.
     */
    public function isFromAi(): bool
    {
        return $this->sender === 'ai';
    }

    /**
     * Scope to get user messages.
     */
    public function scopeFromUser($query)
    {
        return $query->where('sender', 'user');
    }

    /**
     * Scope to get AI messages.
     */
    public function scopeFromAi($query)
    {
        return $query->where('sender', 'ai');
    }

    /**
     * Scope to get messages for a specific session.
     */
    public function scopeForSession($query, int $sessionId)
    {
        return $query->where('chat_session_id', $sessionId);
    }
}