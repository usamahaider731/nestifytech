<?php

namespace App\Http\Middleware;

use App\Support\LanguageHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function rootView(Request $request): string
    {
        if ($request->is('admin', 'admin/*')) {
            return 'app';
        }

        return 'front';
    }

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $language = LanguageHelper::resolve($request->cookie('locale'));
        $currentLanguage = $language['current'];

        if (! empty($currentLanguage['prefix'])) {
            app()->setLocale($currentLanguage['prefix']);
        }

        View::share('currentLanguage', $currentLanguage);

        $shared = [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'languages' => $language['languages'],
            'currentLanguage' => $currentLanguage,
            'translations' => $request->is('admin', 'admin/*') ? [] : $language['translations'],
        ];

        if (! $request->is('admin', 'admin/*')) {
            $shared['searchCategories'] = get_taxonomy([
                'type' => 'category',
                'status' => 'publish',
            ]);
        }

        return $shared;
    }
}
