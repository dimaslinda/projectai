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
        'persona',
        'chat_type',
        'description',
        'is_shared',
        'shared_with_roles',
        'last_activity_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'shared_with_roles' => 'array',
        'is_shared' => 'boolean',
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

    /**
     * Check if the session can be viewed by a user with specific role.
     */
    public function canBeViewedByRole(string $role): bool
    {
        if (!$this->is_shared) {
            return false;
        }

        $sharedRoles = $this->shared_with_roles ?? [];
        return in_array($role, $sharedRoles);
    }

    /**
     * Share the session with specific roles.
     */
    public function shareWithRoles(array $roles): void
    {
        $this->update([
            'is_shared' => true,
            'shared_with_roles' => $roles,
        ]);
    }

    /**
     * Scope to get sessions that can be viewed by a specific role.
     */
    public function scopeViewableByRole($query, string $role)
    {
        return $query->where('is_shared', true)
                    ->whereJsonContains('shared_with_roles', $role);
    }

    /**
     * Scope to get sessions by persona.
     */
    public function scopeByPersona($query, string $persona)
    {
        return $query->where('persona', $persona);
    }
}