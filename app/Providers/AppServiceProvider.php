<?php

namespace App\Providers;

use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\DB;

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
        $settingsPath = storage_path('app/data/setting.json');
        $layoutPath = storage_path('app/data/layout.json');
        $sidebarMenuPath = storage_path('app/data/sidebar-menu.json');

        $settings = $filesystem->exists($settingsPath) ? $filesystem->get($settingsPath) : '{}';
        $layout = $filesystem->exists($layoutPath) ? $filesystem->get($layoutPath) : '{}';
        $sidebarMenuContent = $filesystem->exists($sidebarMenuPath) ? $filesystem->get($sidebarMenuPath) : '[]';

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
        if (DB::getSchemaBuilder()->hasTable('menu')) {
            $allMenus = DB::table('menu')->get()->toArray();
            $menu = $this->buildMenuTree($allMenus);
        } else {
            $menu = [];
        }
        $sidebarMenu = json_decode($sidebarMenuContent, true) ?: [];
        $data = array_merge($data, ['menu' => $menu], ['layout' => $datas], ['sidebar_menu' => $sidebarMenu]);

        // Prefetch Vite assets
        Vite::prefetch(concurrency: 3);

        // Share with Inertia & Blade
        Inertia::share(['setting' => $data]);
        View::share(['setting' => $data]);
    }

    private function buildMenuTree($elements, $parentId = 0)
    {
        $branch = [];
        foreach ($elements as $element) {
            $element = (array) $element;
            if ($element['parent_id'] == $parentId) {
                $children = $this->buildMenuTree($elements, $element['id']);
                if ($children) {
                    $element['children'] = $children;
                } else {
                    $element['children'] = [];
                }
                $branch[] = $element;
            }
        }
        return $branch;
    }
}