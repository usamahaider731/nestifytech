<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthorized action.');
        }

        // ── Administrator bypass ──────────────────────────────────────────────
        // If the user holds an "Administrator" role, they have full access.
        $userRoles = is_string($user->roles)
            ? json_decode($user->roles, true)
            : (array) $user->roles;

        if (!empty($userRoles)) {
            $isAdmin = DB::table('roles')
                ->whereIn('id', $userRoles)
                ->where('title', 'Administrator')
                ->exists();

            if ($isAdmin) {
                return $next($request);
            }
        }

        // ── Standard permission check ─────────────────────────────────────────
        $userPermissions = $user->user_permissions;

        if (!in_array($permission, $userPermissions)) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
