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
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'roles' => 'array',
            'image' => 'array'
        ];
    }
    protected $appends = ['user_role', 'user_avater', 'user_permissions'];

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
    public function getUserAvaterAttribute()
    {
        $image = \Illuminate\Support\Facades\DB::table('media')->where(['parent_id' => $this->id, 'type' => 'user'])->first();
        return $image ? $image : null;
    }
    public function getUserRoleAttribute()
    {
        $roles = $this->roles;
        if (is_string($roles)) {
            $roles = json_decode($roles, true);
        }
        if (!is_array($roles) || empty($roles)) {
            return [];
        }

        if (count($roles) === 1 && is_numeric($roles[0])) {
            return \Illuminate\Support\Facades\DB::table('roles')->where('id', $roles[0])->pluck('title')->toArray();
        }

        if (count($roles) > 1) {
            return \Illuminate\Support\Facades\DB::table('roles')->whereIn('id', $roles)->pluck('title')->toArray();
        }

        return [];
    }

    public function getUserPermissionsAttribute()
    {
        $roles = $this->roles;
        if (is_string($roles)) {
            $roles = json_decode($roles, true);
        }
        if (!is_array($roles) || empty($roles)) {
            return [];
        }

        $allPermissions = [];
        $rolesData = \Illuminate\Support\Facades\DB::table('roles')->whereIn('id', $roles)->get();
        foreach ($rolesData as $role) {
            // New system uses 'permissions' (plural) column
            $permissions = isset($role->permissions) ? (is_string($role->permissions) ? json_decode($role->permissions, true) : $role->permissions) : null;
            
            if (is_array($permissions)) {
                // Flatten nested structure: { "content": ["Product-Read", ...], ... }
                foreach ($permissions as $category => $perms) {
                    if (is_array($perms)) {
                        foreach ($perms as $p) {
                            $allPermissions[] = strtolower(trim($p));
                        }
                    }
                }
            } else {
                // Backward compatibility for old flat structure if any
                $legacy = isset($role->permission) ? (is_string($role->permission) ? json_decode($role->permission, true) : $role->permission) : null;
                if (is_array($legacy)) {
                    foreach ($legacy as $key => $value) {
                        if ($value == 1) $allPermissions[] = strtolower(trim($key));
                    }
                }
            }
        }

        return array_values(array_unique($allPermissions));
    }
}