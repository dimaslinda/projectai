<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatSession extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'chat_type',
        'preferred_model',
        'persona',
        'description',
        'last_activity_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_activity_at' => 'datetime',
    ];

    /**
     * Get the user that owns the chat session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the chat histories for the session.
     */
    public function chatHistories(): HasMany
    {
        return $this->hasMany(ChatHistory::class)->orderBy('created_at');
    }

    /**
     * Get the latest chat history for the session.
     */
    public function latestMessage()
    {
        return $this->hasOne(ChatHistory::class)->latestOfMany();
    }

    /**
     * Update the last activity timestamp.
     */
    public function updateLastActivity(): void
    {
        $this->update(['last_activity_at' => now()]);
    }

    // Sharing functionality removed: sessions are private-only

    /**
     * Scope to get sessions by persona.
     */
    public function scopeByPersona($query, string $persona)
    {
        return $query->where('persona', $persona);
    }
}