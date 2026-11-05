<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'Laravel') }}</title>
    <!-- Links -->
    @php
        $isAdminPage = str_starts_with($page['component'] ?? '', 'Admin/') || request()->is('admin*');
        $colorRoute = $isAdminPage ? 'backend.colors' : 'colors';
    @endphp
    <link rel="stylesheet" href="{{ route($colorRoute) }}?v={{ filemtime(storage_path('app/data/setting.json')) }}">
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
        href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&ampdisplay=swap"
        rel="stylesheet" />
    <!-- Anti-FOUC: Apply saved color theme before React loads -->
<script>
    (function () {
        try {
            @if(!$isAdminPage)
            var STORAGE_KEY = 'nestify-site-color-theme';

            @php
                $settings = json_decode(@file_get_contents(storage_path('app/data/setting.json')), true) ?? [];
                $rawThemes = $settings['color']['color_types']['value'] ?? [];
                
                $themes = collect($rawThemes)->mapWithKeys(function($item) {
                    $key = !empty($item['key']) 
                        ? strtolower(preg_replace('/\s+/', '-', trim($item['key']))) 
                        : strtolower(preg_replace('/[^a-z0-9]+/', '-', trim(strtolower($item['label'] ?? ''))));
                    return [$key => $item];
                });

                $defaultKey = strtolower($settings['color']['color_type']['value'] ?? '');
            @endphp

            var themes = @json($themes);
            var defaultKey = @json($defaultKey);

            var savedKey = localStorage.getItem(STORAGE_KEY);
            var palette = savedKey && themes[savedKey] ? themes[savedKey] : null;

            if (!palette) {
                palette = defaultKey && themes[defaultKey] ? themes[defaultKey] : null;
            }

            if (palette) {
                var root = document.documentElement;
                var skip = { key: 1, label: 1, swatch: 1 };
                for (var k in palette) {
                    if (!skip[k] && typeof palette[k] === 'string' && palette[k].trim() !== '') {
                        root.style.setProperty('--' + k, palette[k]);
                    }
                }
            }
            @endif
        } catch (e) {}
    })();
</script>
    @routes
    @viteReactRefresh
    <link rel="shortcut icon" href="{{'/storage/uploads/image/' . $setting['site']['favicon']['value']}}" type="image/x-icon">
    @vite(['resources/css/backapp.css', 'resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">

    @inertia
</body>

</html>