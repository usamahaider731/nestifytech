<?php

namespace App\Providers;

use App\Models\Menu;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Vite;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind 'files' to avoid "Target class [files] does not exist"
        $this->app->bind('files', function () {
            return new Filesystem();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $filesystem = new Filesystem();

        // Read your JSON files safely
        $settingsPath = public_path('data/setting.json');
        $layoutPath = public_path('data/layout.json');

        $settings = $filesystem->exists($settingsPath) ? $filesystem->get($settingsPath) : '{}';
        $layout = $filesystem->exists($layoutPath) ? $filesystem->get($layoutPath) : '{}';

        $layoutArr = json_decode($layout, true);
        $qes = [];
        $datas = [];

        if (!empty($layoutArr['layout'])) {
            foreach ($layoutArr['layout'] as $key => $value) {
                foreach ($value as $keys => $values) {
                    foreach ($values['fields'] as $k => $val) {
                        $qes[$val['name']] = $val['value'];
                    }
                }
                $datas[$key] = $qes;
            }
        }

        $data = json_decode($settings, true) ?: [];
        if (table_exists('menu') === true) {
        $menu = Menu::where('parent_id', 0)->with('children')->get();
        } else {
            $menu = [];
        }
        $data = array_merge($data, ['menu' => $menu], ['layout' => $datas]);

        // Prefetch Vite assets
        Vite::prefetch(concurrency: 3);

        // Share with Inertia & Blade
        Inertia::share(['setting' => $data]);
        View::share(['setting' => $data]);
    }
}