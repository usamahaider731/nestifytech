<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Middleware;

class UpdateUserLastSeen extends Middleware
{
    /**
     * Handle an incoming request.
     *
     * Tracks the user's online presence efficiently using Cache + throttled DB touch.
     * - Keeps 'user-is-online-{id}' in Cache for 5 minutes.
     * - Throttles database updates to at most once every 2 minutes to prevent DB bottleneck.
     * - Does NOT mutate the user's 'active' account status flag.
     */
    public function handle(Request $request, Closure $next)
    {        
        if (Auth::check()) {
            $userId = Auth::id();

            // Set presence in cache for 5 minutes
            Cache::put("user-is-online-{$userId}", true, now()->addMinutes(5));

            // Throttle database last_seen_at write to once every 2 minutes
            $throttleKey = "user-last-seen-db-throttle-{$userId}";
            if (!Cache::has($throttleKey)) {
                Cache::put($throttleKey, true, now()->addMinutes(2));

                // Direct DB update without touching timestamps or triggering Eloquent events
                DB::table('users')
                    ->where('id', $userId)
                    ->update(['last_seen_at' => Carbon::now()]);
            }
        }

        return $next($request);
    }
}

