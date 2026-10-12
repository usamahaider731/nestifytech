<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /**
     * Handle an incoming request.
     * Only logs meaningful user activities, strictly filtering out admin/internal spam.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = Auth::id();

        // 1. Only log for authenticated users
        if (!$userId) {
            return $next($request);
        }

        $path = $request->path();

        // 2. Ignore assets, debugbar, images, colors, fonts, and static files
        if (
            $request->is(
                'build/*',
                'assets/*',
                '_debugbar/*',
                'storage/*',
                'image/*',
                '*.min.css',
                'colors.min.css',
                'backend-colors.min.css',
                'search-pages.json',
                'search/*'
            ) ||
            preg_match('/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i', $path)
        ) {
            return $next($request);
        }

        // 3. Strictly ignore admin, builder, AI checks, bulk actions, and background APIs
        if (
            $request->is(
                'admin',
                'admin/*',
                'builder/*',
                'ai/*',
                'api/*',
                'bulk/*',
                'get_languages',
                'set-language/*'
            )
        ) {
            return $next($request);
        }

        // 4. Ignore pure AJAX background poll requests that aren't Inertia visits
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return $next($request);
        }

        // 5. Product view is handled with rich details in FrontendController@singleProduct
        if (str_starts_with($path, 'view/post/')) {
            return $next($request);
        }

        // 6. Only log meaningful GET navigation visits (checkout, blog, faqs, page, etc.)
        // Specific customer POST actions (order placement, reviews, profile changes) are hooked explicitly
        if ($request->isMethod('GET')) {
            try {
                // Prevent duplicate logs within 60 seconds for the same path
                $recentLog = DB::table('user_activities')
                    ->where('user_id', $userId)
                    ->where('url', $request->fullUrl())
                    ->where('created_at', '>=', now()->subSeconds(60))
                    ->exists();

                if (!$recentLog) {
                    $action = 'page_visit';
                    $title = 'Browsed Page';

                    if ($path === '' || $path === '/') {
                        $action = 'visit_home';
                        $title = 'Visited Homepage';
                    } elseif (str_starts_with($path, 'checkout')) {
                        $action = 'view_checkout';
                        $title = 'Viewed Checkout Page';
                    } elseif (str_starts_with($path, 'compare')) {
                        $action = 'view_compare';
                        $title = 'Viewed Product Comparison';
                    } elseif (str_starts_with($path, 'blog/')) {
                        $action = 'read_blog';
                        $title = 'Read Blog Article';
                    } elseif (str_starts_with($path, 'blog')) {
                        $action = 'browse_blog';
                        $title = 'Browsed Blog Articles';
                    } elseif (str_starts_with($path, 'faqs') || str_starts_with($path, 'faq')) {
                        $action = 'view_faqs';
                        $title = 'Browsed Help & FAQs';
                    } elseif (str_starts_with($path, 'page/')) {
                        $slug = str_replace('page/', '', $path);
                        $action = 'view_page';
                        $title = 'Viewed ' . ucwords(str_replace('-', ' ', $slug)) . ' Page';
                    }

                    // Only insert if it is a meaningful categorized customer action
                    if ($action !== 'page_visit' || str_starts_with($path, 'page/')) {
                        DB::table('user_activities')->insert([
                            'user_id' => $userId,
                            'url' => $request->fullUrl(),
                            'method' => 'GET',
                            'ip' => $request->ip(),
                            'user_agent' => $request->userAgent(),
                            'payload' => json_encode([
                                'action' => $action,
                                'title' => $title,
                                'path' => '/' . $path,
                            ]),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                // Silently catch
            }
        }

        return $next($request);
    }
}
