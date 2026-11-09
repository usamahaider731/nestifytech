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

        $isInstalled = File::exists(storage_path('installed'))
            || filter_var(env('APP_INSTALLED', false), FILTER_VALIDATE_BOOLEAN)
            || (function () {
                $settingPath = storage_path('app/data/setting.json');
                if (File::exists($settingPath)) {
                    $json = json_decode(File::get($settingPath), true);
                    return !empty($json['site']['installed']['value']);
                }
                return false;
            })();

        // If not installed and not requesting install routes, redirect to /install
        if (!$isInstalled) {
            if (!$request->is('install*') && !$request->is('api/install*')) {
                return redirect()->route('install.index');
            }
        } else {
            // If already installed and any user (or attacker) tries to access /install routes:
            if ($request->is('install*') || $request->is('api/install*')) {
                if ($request->expectsJson() || $request->is('api/*') || $request->isMethod('post')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'NestifyTech is already installed. Access denied.',
                    ], 403);
                }
                return redirect('/')->with('error', 'NestifyTech is already installed.');
            }
        }

        return $next($request);
    }
}

