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

    return (
        <div className='flex w-full flex-col'>
            <div className='relative w-full rounded-2xl h-110'>
                <Slider setApi={setMainApi} containerClass='w-full h-full' show={1} autoplayOptions={{ delay: 3000, pause: 'hover' }} showNavigation={true}>
                    {Gallery && Gallery.map((slide, index) => {
                        const name = (slide.name ?? slide.filename.split('.').at(0))
                        slide.name = name
                        return (
                            <div key={slide?.id || index} className='flex embla__slide w-full h-full items-center justify-center overflow-hidden rounded-2xl'>
                                <ImageViwer image={slide} width='600' height='600' className='max-w-full max-h-9/10 object-cover transition-transform duration-500 hover:scale-110' />
                            </div>
                        )
                    })}
                </Slider>
            </div>
            <div className='w-full mt-2'>
                <Slider setApi={setThumbApi} show={Gallery.length + 5} options={{ loop: true, dragFree: true, align: 'start', slidesToScroll: 'visible', gap: 20 }} showNavigation={false} autoplayOptions={{ delay: 3000, pause: 'hover' }} >
                    {Gallery && Gallery.map((slide, index) => {
                        return (
                            <div key={slide?.id || index} onClick={() => onThumbClick(index)} className={`flex embla__slide rounded-lg overflow-hidden cursor-pointer justify-center w-full transition-all ${index === selectedIndex ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'}`}>
                                <ImageViwer image={slide?.filename || slide} className='w-full h-24 object-cover' />
                            </div>
                        )
                    })}
                </Slider>
            </div>
        </div>
    );
}

export default SingleProductSlider;
