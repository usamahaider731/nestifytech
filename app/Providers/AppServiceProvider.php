<?php

namespace App\Providers;

use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
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
                $qes = [];
                foreach ($value as $keys => $values) {
                    foreach ($values['fields'] as $k => $val) {
                        $qes[$val['name']] = $val['value'];
                    }
                }
                $datas[$key] = $qes;
            }
        }
        $data = json_decode($settings, true) ?: [];
        $menu = [];

        // Dynamically apply email settings from Admin Settings (Mailtrap/SMTP)
        if (!empty($data['mail'])) {
            $mailSettings = $data['mail'];
            if (!empty($mailSettings['mail_host']['value'])) {
                config(['mail.mailers.smtp.host' => $mailSettings['mail_host']['value']]);
            }
            if (!empty($mailSettings['mail_port']['value'])) {
                config(['mail.mailers.smtp.port' => (int) $mailSettings['mail_port']['value']]);
            }
            if (!empty($mailSettings['mail_username']['value'])) {
                config(['mail.mailers.smtp.username' => $mailSettings['mail_username']['value']]);
            }
            if (!empty($mailSettings['mail_password']['value'])) {
                config(['mail.mailers.smtp.password' => $mailSettings['mail_password']['value']]);
            }
            if (isset($mailSettings['mail_encryption']['value'])) {
                $enc = $mailSettings['mail_encryption']['value'];
                config(['mail.mailers.smtp.encryption' => $enc === 'none' ? null : $enc]);
            }
            if (!empty($mailSettings['mail_from_address']['value'])) {
                config(['mail.from.address' => $mailSettings['mail_from_address']['value']]);
            }
            if (!empty($mailSettings['mail_from_name']['value'])) {
                config(['mail.from.name' => $mailSettings['mail_from_name']['value']]);
            }
        }

        if (!$this->app->runningInConsole()) {
            try {
                // Auto-recovery guard: if database is emptied, auto-restore immediately
                if (DB::getSchemaBuilder()->hasTable('posts') && DB::table('posts')->count() === 0) {
                    \Illuminate\Support\Facades\Artisan::call('db:auto-restore');
                }

                if (DB::getSchemaBuilder()->hasTable('menu')) {
                    $allMenus = DB::table('menu')->get()->toArray();
                    $menu = $this->buildMenuTree($allMenus);
                }
            } catch (\Throwable $e) {
                $menu = [];
            }
        }

        $sidebarMenu = json_decode($sidebarMenuContent, true) ?: [];
        $data = array_merge($data, ['menu' => $menu], ['layout' => $datas], ['sidebar_menu' => $sidebarMenu]);

        // Never expose secrets or sensitive server-side credentials in shared browser props.
        unset($data['ai']['api_key']);
        unset($data['payment']['stripe_secret_key'], $data['payment']['stripe_webhook_secret']);
        unset($data['payment']['paypal_secret']);
        unset($data['payment']['payoneer_api_password']);
        unset($data['whatsapp']['api_key']);
        unset($data['mail']['mail_password']);

        if (! request()->is('admin', 'admin/*')) {
            unset($data['ai'], $data['backend-color'], $data['sidebar_menu'], $data['whatsapp'], $data['mail']);
            // Frontend only needs public payment status, public keys, and currencies
            if (isset($data['payment'])) {
                unset(
                    $data['payment']['stripe_secret_key'],
                    $data['payment']['stripe_webhook_secret'],
                    $data['payment']['paypal_secret'],
                    $data['payment']['payoneer_api_password']
                );
            }
        }

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