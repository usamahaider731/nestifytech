@props(['main' => false])
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Laravel') }}</title>
    {{-- Dynamic theme variables --}}
    <link rel="stylesheet" href="{{ route('colors') }}">
    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet"> {{-- Icons --}}
    <link rel="stylesheet" href="{{ url('assets/icon/font awesome/css/font-awesome.min.css') }}">
    <link rel="stylesheet" href="{{ url('assets/icon/line awesome/css/line-awesome.css') }}">
    <link rel="stylesheet" href="{{ url('assets/icon/remix/remixicon.css') }}">
    {{-- Scripts --}}
    <script src="{{url('assets/js/function.js')}}"></script>
    {{-- Tailwind + Custom CSS --}}
    @vite(['resources/css/app.css', 'resources/js/app.js', 'resources/js/app.jsx'])
    @stack('header')
</head>

<body class="font-primary antialiased font-normal text-res text-[13px] leading-5.5" id="">
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

</html>