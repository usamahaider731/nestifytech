import React, { useEffect, useState } from 'react';
import Slider from '../Slider';
import ImageViwer from '../Admin/ImageViwer';

const SingleProductSlider = ({ product }) => {
    // Combine the main image and gallery images
    const initialGallery = [];
    if (product?.image) {
        initialGallery.push(product.image);
    }
    if (product?.gallery && Array.isArray(product.gallery)) {
        initialGallery.push(...product.gallery);
    }

    const [Gallery, SetGallery] = useState(initialGallery);
    const [mainApi, setMainApi] = useState(null);
    const [thumbApi, setThumbApi] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!mainApi || !thumbApi) return;

        const onSelect = () => {
            setSelectedIndex(mainApi.selectedScrollSnap());
            thumbApi.scrollTo(mainApi.selectedScrollSnap());
        };

        mainApi.on('select', onSelect);
        onSelect(); // set initial

        return () => {
            mainApi.off('select', onSelect);
        };
    }, [mainApi, thumbApi]);

    const onThumbClick = (index) => {
        if (!mainApi || !thumbApi) return;
        mainApi.scrollTo(index);
    };

    // Compute responsive slides count based on number of gallery images
    const totalSlides = Gallery?.length || 0;
    const thumbSlidesToShow = Math.min(Math.max(totalSlides, 1), 6);

    return (
        <div className='flex w-full flex-col'>
            {/* Main Image Slider */}
            <div className='relative w-full rounded-lg sm:rounded-2xl h-80 sm:h-96 md:h-110 bg-white border border-border/60 overflow-hidden'>
                <Slider setApi={setMainApi} containerClass='w-full h-full' show={1} autoplayOptions={{ delay: 3000, pause: 'hover' }} showNavigation={totalSlides > 1}>
                    {Gallery && Gallery.map((slide, index) => {
                        const name = (slide.name ?? slide?.filename?.split('.').at(0));
                        slide.name = name;
                        return (
                            <div key={slide?.id || index} className='flex embla__slide w-full h-full items-center justify-center overflow-hidden rounded-2xl p-4'>
                                <ImageViwer image={slide} width='600' height='600' className='max-w-full max-h-full object-contain transition-transform duration-500 hover:scale-105' />
                            </div>
                        );
                    })}
                </Slider>
            </div>

            {/* Thumbnail Slider */}
            {totalSlides > 1 && (
                <div className='w-full mt-3 px-1'>
                    <Slider
                        setApi={setThumbApi}
                        show={thumbSlidesToShow}
                        options={{
                            loop: totalSlides > thumbSlidesToShow,
                            dragFree: true,
                            align: 'start',
                            slidesToScroll: 1,
                            gap: 10,
                        }}
                        showNavigation={totalSlides > thumbSlidesToShow}
                    >
                        {Gallery.map((slide, index) => (
                            <div
                                key={slide?.id || index}
                                onClick={() => onThumbClick(index)}
                                className={`flex embla__slide rounded-lg overflow-hidden cursor-pointer justify-center border-2 transition-all p-1 bg-white aspect-square ${
                                    index === selectedIndex
                                        ? 'border-primary ring-2 ring-primary/30 opacity-100 shadow-sm'
                                        : 'border-border/60 opacity-60 hover:opacity-100 hover:border-primary/50'
                                }`}
                            >
                                <ImageViwer image={slide?.filename || slide} className='w-full h-full object-contain' />
                            </div>
                        ))}
                    </Slider>
                </div>
            )}
        </div>
    );
}

export default SingleProductSlider;
