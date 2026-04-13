
<x-app-layout>
    @push('header')
        <link rel="stylesheet" href="{{ url('assets/swiper/swiper-bundle.min.css') }}">
    @endpush
    <div class="w-full">
        <x-home.main-slider />
    </div>
    @push('footer')
        <script src="{{ url('assets/swiper/swiper-bundle.min.js') }}"></script>
    @endpush
</x-app-layout>