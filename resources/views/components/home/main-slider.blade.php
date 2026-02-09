
<div class="w-full">
    <div class="container mx-auto px-3.75">
        <div class="swiper mainSlider relative w-full">
            <div class="swiper-wrapper">
                @foreach($setting['layout']['Home']['main_slider'] as $slide)
                    <div class="swiper-slide">
                        <img src="{{ url('storage/uploads/image/'.$slide) }}" alt="{{ $slide }}">
                    </div>
                @endforeach
            </div>
            <div class="swiper-navigation">
                <div class="mainSliderPrev z-5 absolute top-1/2 -translate-y-1/2 rounded left-5 size-8 bg-primary text-white flex items-center justify-center"><i class="ri-arrow-left-s-line  text-xl"></i></div>
                <div class="mainSliderNext z-5 absolute top-1/2 -translate-y-1/2 rounded right-5 size-8 bg-primary text-white flex items-center justify-center"><i class="ri-arrow-right-s-line text-xl"></i></div>
            </div>
        </div>
    </div>
</div>