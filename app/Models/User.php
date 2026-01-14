<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use function PHPUnit\Framework\isArray;
use function PHPUnit\Framework\returnSelf;

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
        'last_seen_at',
        'active',
        'roles'
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
    protected $casts = [
        'roles' => 'array',
        'image' => 'array'
    ];
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    protected $appends = ['user_role'];

    public static function online()
    {
        return User::where('active', true);
    }
    public static function recentlyActive($limit = null)
    {
        $query = User::where('active', true)
            ->whereNotNull('last_seen_at')
            ->orderByDesc('last_seen_at');
        if ($limit) {
            $query->limit($limit);
        }
        return $query->get();
    }
    public function image(): HasOne
    {
        return $this->hasOne(Media::class, 'parent_id')->where('type', 'user');
    }
    public function password(): HasOne
    {
        return $this->password;
    }

    public function getUserRoleAttribute()
    {
        $roles = $this->roles;

        // ✅ Only decode if it's a string
        if (is_string($roles)) {
            $roles = json_decode($roles, true);
        }

        if (!is_array($roles) || empty($roles)) {
            return [];
        }

        if (count($roles) === 1 && is_numeric($roles[0])) {
            return Roles::where('id', $roles[0])->pluck('title')->toArray();
        }

        if (count($roles) > 1) {
            return Roles::whereIn('id', $roles)->pluck('title')->toArray();
        }

        return [];
    }
}
