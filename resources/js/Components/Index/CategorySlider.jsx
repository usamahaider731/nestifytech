import { Link, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import ImageViwer from '../Admin/ImageViwer';
import Slider from '../Slider';
import { useLang } from '@/contexts/LanguageContext';

const CategorySlider = ({categories}) => {
    const { setting } = usePage().props;
    const { __ } = useLang();
    const [Categories, setCategories] = useState(categories);

    return (
        <div className='flex flex-col items-center justify-between'>
            <div className='flex justify-between items-end w-full mb-8'>
                <div className='flex flex-col'>
                    <p className='mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary'>{__('Browse the store')}</p>
                    <h2 className='text-2xl font-extrabold text-heading md:text-3xl'>{__('Featured Categories')}</h2>
                    <p className='mt-2 text-sm text-res md:text-base'>{__('Explore our top selections tailored for you')}</p>
                </div>
                <Link className='group flex items-center gap-1 text-sm font-bold text-primary transition-colors hover:opacity-75'>
                    {__('View All')}
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
            </div>
            
            <div className='flex w-full'>
                <Slider show={8} options={{ loop: true, align: 'start', dragFree: true }}>
                    {Categories.length > 0 && Categories.map((cat) => {
                        return (
                            <div key={cat.id} className='flex flex-col embla__slide cursor-pointer items-center group py-4'>
                                <div className='relative flex size-24 items-center justify-center overflow-hidden rounded-full border border-border shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-md md:size-28'>
                                    <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-primary/30 transition-colors z-10 pointer-events-none"></div>
                                    <ImageViwer image={cat.image?.filename} alt={cat.title} className='size-full object-cover img-scale-hover z-0' />
                                </div>
                                <h4 className='mt-4 line-clamp-1 px-2 text-center text-sm font-semibold text-heading transition-colors group-hover:text-primary'>{cat.title}</h4>
                            </div>
                        )
                    })}
                </Slider>
            </div>
        </div>
    );
}

export default CategorySlider;