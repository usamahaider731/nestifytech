<?php

namespace App\Http\Middleware;

use App\Support\LanguageHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];

        if (! $request->is('admin', 'admin/*')) {
            $shared['searchCategories'] = get_taxonomy([
                'type' => 'category',
                'status' => 'publish',
            ]);

            // Share active discount and tax rules for dynamic pricing (DB only, no model)
            try {
                $now = now();
                $rules = DB::table('promotions_and_tax_rules')
                    ->where('status', 'active')
                    ->where(function ($q) use ($now) {
                        $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
                    })
                    ->where(function ($q) use ($now) {
                        $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
                    })
                    ->orderByDesc('priority')
                    ->get()
                    ->map(function ($rule) {
                        $rule->target_ids = $rule->target_ids ? json_decode($rule->target_ids, true) : [];
                        return $rule;
                    });
                $shared['activePricingRules'] = $rules;
            } catch (\Throwable $e) {
                $shared['activePricingRules'] = [];
            }
        }

        return $shared;
    }
}
