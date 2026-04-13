<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class Authorization {
    public function handle(Request $request, Closure $next): Response
    {
        $settingRow = DB::table('settings')->where('a', 'api_keys')->first();
        $api_keys = $settingRow ? json_decode($settingRow->value, true) : [];

        $key = $request->header('Authorization');
        $valid = false;

        if ($key && isset($api_keys['keys'])) {
            foreach ($api_keys['keys'] as $v) {
                if ($v['api_key'] == $key) {
                    $valid = true;
                }
            }
        }

        if (!$valid) {
            return response(['error' => true, 'message' => 'Invalid API key'], 200);
        }
        return $next($request);
    }
}