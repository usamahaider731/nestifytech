@props(['main' => false])
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    {{-- Smart SEO & Meta Management --}}
    @php
        $seo_title = $seo['title'] ?? $setting['site']['site_name']['value'] ?? config('app.name', 'Laravel');
        $seo_desc = $seo['description'] ?? $setting['site']['site_description']['value'] ?? '';
        $seo_keys = $seo['keywords'] ?? '';
    @endphp

    <title>{{ $seo_title }}</title>
    <meta name="description" content="{{ $seo_desc }}">
    <meta name="keywords" content="{{ $seo_keys }}">

    {{-- Dynamic theme variables --}}
    <link rel="stylesheet" href="{{ route('colors') }}?v={{ filemtime(storage_path('app/data/setting.json')) }}">
    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
    {{-- Icons --}}
    <link rel="stylesheet" href="{{ url('assets/icon/font awesome/css/font-awesome.min.css') }}">
    <link rel="stylesheet" href="{{ url('assets/icon/line awesome/css/line-awesome.css') }}">
    <link rel="stylesheet" href="{{ url('assets/icon/remix/remixicon.css') }}">
    {{-- Scripts --}}
    <script src="{{url('assets/js/function.js')}}"></script>
    {{-- Tailwind + Custom CSS --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('header')
</head>

<body class="font-primary antialiased font-normal text-res text-[13px] leading-5.5" id="">
    <!-- 🌀 Premium Preloader -->
    <div id="preloader">
        <div class="loader-ripple"><div></div><div></div></div>
    </div>

    <x-header />
    <div class="min-h-screen bg-white">
        <a href="#" id="scrollToTop" class="fixed z-140 opacity-0 translate-y-10 transition-all duration-700 ease-in-out flex rounded-full size-8 items-center justify-center shadow bg-primary/60 backdrop-blur-3xl hover:bg-primary bottom-1/10 right-1/10"><i class="ri-arrow-up-s-line text-xl text-white"></i></a>
        <main>
            {{ $slot }}
        </main>
    </div>
    <x-footer />
</body>
@stack('footer')
<script src="{{url('assets/js/script.js')}}"></script>

<script>
    // 🌀 Hide Preloader
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.visibility = 'hidden';
            }, 600);
        }
    });

    // ✨ Scroll Reveal Observer
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.1
    });

    window.addEventListener('scroll', () => {
        document.querySelectorAll('.reveal').forEach(el => {
            revealObserver.observe(el);
        });
    });
</script>

</html>