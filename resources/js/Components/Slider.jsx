import React, { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import '../../css/embla.css';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

import Fade from 'embla-carousel-fade';
import Autoplay from 'embla-carousel-autoplay';

const Slider = ({ children, containerClass = "", options = { loop: true, align: 'start', slidesToScroll: 1, duration: 25, gap: null }, effect = 'slide', show = 1, showNavigation = true, autoplay = false, autoplayOptions = { delay: 4000, stopOnInteraction: false }, setApi }) => {
    // Prepare plugins
    const plugins = React.useMemo(() => {
        const p = [];
        if (effect === 'fade') {
            p.push(Fade());
        }
        if (autoplay) {
            p.push(Autoplay(autoplayOptions));
        }
        return p;
    }, [effect, autoplay]); // Avoid changing references on every render

    // Initialize Embla carousel with options and plugins
    const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins);

    // Navigation handlers
    const scrollPrev = () => {
        if (emblaApi) emblaApi.scrollPrev();
    };

    const scrollNext = () => {
        if (emblaApi) emblaApi.scrollNext();
    };

    // Effect for optional autoplay or side‑effects
    useEffect(() => {
        if (!emblaApi) return;
        if (setApi) {
            setApi(emblaApi);
        }
    }, [emblaApi, setApi]);

    return (
        <div className="embla relative" style={{ '--slides-to-show': show }}>
            <div className="embla__viewport" ref={emblaRef}>
                <div className={`embla__container ${containerClass}`} style={{ gap: options?.gap ? `${options.gap}px` : undefined }}>
                    {children}
                </div>
            </div>
            {/* Navigation Buttons */}
            {showNavigation && (
                <>
                    <button type="button" className="embla__prev z-20 flex items-center justify-center size-9 bg-primary/80 rounded-full text-white hover:bg-primary shadow-md" onClick={scrollPrev} aria-label="Previous slide">
                        <RiArrowLeftSLine className='size-6' />
                    </button>
                    <button type="button" className="embla__next z-20 flex items-center justify-center size-9 bg-primary/80 rounded-full text-white hover:bg-primary shadow-md" onClick={scrollNext} aria-label="Next slide">
                        <RiArrowRightSLine className='size-6' />
                    </button>
                </>
            )}
            {/* Progress bar */}
            <div className="embla__progress">
                <div className="embla__progress__bar" />
            </div>
        </div>
    );
};

export default Slider;
