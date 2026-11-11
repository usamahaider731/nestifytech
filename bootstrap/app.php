<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
        $middleware->web(prepend: [
            \App\Http\Middleware\CheckInstallation::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\DecodeEncryptedPayload::class,
        ], append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\UpdateUserLastSeen::class,
            \App\Http\Middleware\LogUserActivity::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->api(prepend: [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\DecodeEncryptedPayload::class,
        ]);
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            '/api/add-lang-key',
            'checkout/create-payment-intent',
            'api/cart/order',
            'api/orders/*/cancel',
            'api/orders/*/attach-payment',
            'admin/module/*/submit*',
            'admin/taxonomy/*/submit*',
            'admin/post/*/submit*',
            'admin/setting/*',
            'admin/setting/*/active-colors',
            'newsletter/subscribe',
            'newsletter/unsubscribe/*',
            'contact/submit',
            'ai/generate/text',
            'ai/generate/image',
            'ai/*',
            'install/*',
        ]);
        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, \Illuminate\Http\Request $request) {
            $status = $response->getStatusCode();

            if (in_array($status, [403, 404, 419, 500, 503])) {
                // If it's an Inertia request or normal browser page visit, render the Error Inertia page
                if ($request->hasHeader('X-Inertia') || (!$request->expectsJson() && !$request->is('api/*'))) {
                    return \Inertia\Inertia::render('Error', [
                        'status' => $status,
                        'message' => ($status === 404 || $status === 419 || $status === 403) 
                            ? $exception->getMessage() ?: null 
                            : (app()->environment(['local', 'testing']) ? $exception->getMessage() : null),
                    ])
                    ->toResponse($request)
                    ->setStatusCode($status);
                }
            }

            return $response;
        });
    })->create();
