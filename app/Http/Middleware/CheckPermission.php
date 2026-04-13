<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
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
        if (!$request->user()) {
            abort(403, 'Unauthorized action.');
        }

        $userPermissions = $request->user()->user_permissions;

        if (!in_array($permission, $userPermissions)) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
