<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserChangelogView extends Model
{
    protected $fillable = [
        'user_id',
        'changelog_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    /**
     * Get the user that viewed the changelog.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the changelog that was viewed.
     */
    public function changelog(): BelongsTo
    {
        return $this->belongsTo(Changelog::class);
    }
}
