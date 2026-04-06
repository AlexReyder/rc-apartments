<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_SUPERADMIN = 'superadmin';
    public const ROLE_ADMIN = 'admin';

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
        'email_verified_at',
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

    public function isSuperadmin(): bool
    {
        return $this->role === self::ROLE_SUPERADMIN;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function canManageRole(string $role): bool
    {
        if ($this->isSuperadmin()) {
            return in_array($role, [self::ROLE_SUPERADMIN, self::ROLE_ADMIN], true);
        }

        return $role === self::ROLE_ADMIN;
    }

    /**
     * @return array<int, string>
     */
    public function manageableRoles(): array
    {
        if ($this->isSuperadmin()) {
            return [self::ROLE_SUPERADMIN, self::ROLE_ADMIN];
        }

        return [self::ROLE_ADMIN];
    }

    public function scopeVisibleFor(Builder $query, User $actingUser): Builder
    {
        if ($actingUser->isSuperadmin()) {
            return $query;
        }

        return $query->where('role', self::ROLE_ADMIN);
    }
}