<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;

class CheckInstallation
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Don't intercept static assets, health checks, or live build files
        if ($request->is('build/*', 'assets/*', 'storage/*', 'up', 'favicon.ico')) {
            return $next($request);
        }

        $isInstalled = File::exists(storage_path('installed')) || env('APP_INSTALLED', false);

        // If not installed and not requesting install routes, redirect to /install
        if (!$isInstalled) {
            if (!$request->is('install*') && !$request->is('api/install*')) {
                return redirect()->route('install.index');
            }
        } else {
            // If already installed and user tries to access /install, redirect to home
            if ($request->is('install*')) {
                return redirect('/');
            }
        }

        return $next($request);
    }
}

