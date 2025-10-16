<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Changelog extends Model
{
    protected $fillable = [
        'version',
        'release_date',
        'type',
        'title',
        'description',
        'changes',
        'technical_notes',
        'is_published',
        'created_by',
    ];

    protected $casts = [
        'release_date' => 'date',
        'changes' => 'array',
        'technical_notes' => 'array',
        'is_published' => 'boolean',
    ];

    /**
     * Get the user who created this changelog entry.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get only published changelogs.
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope to get changelogs ordered by release date (newest first).
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('release_date', 'desc')->orderBy('created_at', 'desc');
    }

    /**
     * Get the type badge color for UI.
     */
    public function getTypeBadgeColorAttribute(): string
    {
        return match ($this->type) {
            'major' => 'bg-red-100 text-red-800',
            'minor' => 'bg-blue-100 text-blue-800',
            'patch' => 'bg-green-100 text-green-800',
            'hotfix' => 'bg-yellow-100 text-yellow-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }
}
