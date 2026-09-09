import { usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import ImageViwer from '../Admin/ImageViwer';
import Slider from '../Slider';

const MainSlider = ({ data }) => {
    console.log(data)
    const { setting } = usePage().props;
    const [Setting, SetSetting] = useState(setting || [])
    const effect = Setting.layout.Home.banner_slider_effect
    const [Sliders, SetSliders] = useState(data);
    const Autoplay = Setting.layout.Home.banner_slider_autoplay == 1 ? true : false
    const Navigation = Setting.layout.Home.banner_slider_navigation == 1 ? true : false
    const container_type = Setting.layout.Home.container_type
    const Duration = Number(Setting.layout.Home.banner_slider_speed) || 25;
    const Delay = Number(Setting.layout.Home.banner_slider_duration);
    const DelaySlider = Delay || 5000;
    return (
        <Slider autoplay={Autoplay} autoplayOptions={{delay: DelaySlider, stopOnInteraction: false}} effect={effect} options={{loop: true, duration: Duration}} showNavigation={Navigation} containerClass={container_type === "container" ? "container mx-auto" : ""}>
            {Sliders && Sliders &&
                Sliders.map((value, idx) => (
                    <div className="embla__slide" key={idx}>
                        <ImageViwer image={value} width="100%" />
                    </div>
                ))}
        </Slider>
    );
};

export default MainSlider;