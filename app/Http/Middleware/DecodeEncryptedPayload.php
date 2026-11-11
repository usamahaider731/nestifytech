<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DecodeEncryptedPayload
{
    /**
     * Automatically intercept incoming requests containing an encoded/encrypted payload
     * and unpack it into the request inputs transparently.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if request is marked with an encoded payload wrapper
        if ($request->has('_payload') && is_string($request->input('_payload'))) {
            $raw = $request->input('_payload');

            $decoded = null;
            // 1. Try base64 json decode
            $base64 = base64_decode($raw, true);
            if ($base64 !== false) {
                $json = json_decode($base64, true);
                if (is_array($json)) {
                    $decoded = $json;
                }
            }

            if (is_array($decoded)) {
                // Merge decoded parameters directly into request
                $request->merge($decoded);
                // Remove the wrapper token
                $request->request->remove('_payload');
            }
        }

        return $next($request);
    }
}
