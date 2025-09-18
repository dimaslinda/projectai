<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the chat sessions for the user.
     */
    public function chatSessions()
    {
        return $this->hasMany(ChatSession::class);
    }

    /**
     * Get the chat histories for the user.
     */
    public function chatHistories()
    {
        return $this->hasMany(ChatHistory::class);
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user is an engineer.
     */
    public function isEngineer(): bool
    {
        return $this->hasRole('engineer');
    }

    /**
     * Check if user is a drafter.
     */
    public function isDrafter(): bool
    {
        return $this->hasRole('drafter');
    }

    /**
     * Check if user is an ESR.
     */
    public function isEsr(): bool
    {
        return $this->hasRole('esr');
    }

    /**
     * Check if user is a superadmin.
     */
    public function isSuperadmin(): bool
    {
        return $this->hasRole('superadmin');
    }

    /**
     * Check if user can manage users (superadmin only).
     */
    public function canManageUsers(): bool
    {
        return $this->isSuperadmin();
    }
}
