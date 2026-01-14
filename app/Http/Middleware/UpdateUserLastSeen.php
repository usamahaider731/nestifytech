<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Middleware;

class UpdateUserLastSeen extends Middleware
{
    public function handle(Request $request, Closure $next)
    {        
        if (Auth::check()) {
            $user = Auth::user();

            $user->update([
                'last_seen_at' => Carbon::now(),
                'active' => true,
            ]);
        }

        return $next($request);
    }
}
