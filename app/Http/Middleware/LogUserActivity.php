<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $path = $request->path();

        // 1. Ignore assets, debugbar, and system files
        if ($request->is('build/*', 'assets/*', '_debugbar/*', 'storage/*') || preg_match('/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i', $path)) {
            return $next($request);
        }

        // 2. Ignore pure AJAX background requests (but keep Inertia page visits)
        if ($request->isMethod('GET') && $request->ajax() && !$request->header('X-Inertia')) {
            return $next($request);
        }

        try {
            // Strip sensitive fields AND unnecessary massive fields like 'style'
            $payload = $request->except(['password', 'password_confirmation', '_token', 'card_number', 'style']);
            
            \App\Models\UserActivity::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'payload' => empty($payload) ? null : $payload,
            ]);
        } catch (\Exception $e) {
            // Silently fail if logging fails so it doesn't break the app
        }

        return $next($request);
    }
}
