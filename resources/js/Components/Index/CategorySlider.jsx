import { Link, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import ImageViwer from '../Admin/ImageViwer';
import Slider from '../Slider';

const CategorySlider = ({categories}) => {
    const { setting } = usePage().props;
    const [Categories, setCategories] = useState(categories);

    return (
        <div className='flex flex-col items-center justify-between mt-10 md:mt-16'>
            <div className='flex justify-between items-end w-full mb-8'>
                <div className='flex flex-col'>
                    <h2 className='text-2xl md:text-3xl font-extrabold text-slate-900'>Featured Categories</h2>
                    <p className='text-slate-500 text-sm md:text-base mt-2'>Explore our top selections tailored for you</p>
                </div>
                <Link className='text-primary font-semibold text-sm hover:text-primary-dark transition-colors flex items-center gap-1 group'>
                    View All
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
            </div>
            
            <div className='flex w-full'>
                <Slider show={8} options={{ loop: true, align: 'start', dragFree: true }}>
                    {Categories.length > 0 && Categories.map((cat) => {
                        return (
                            <div key={cat.id} className='flex flex-col embla__slide cursor-pointer items-center group py-4'>
                                <div className='size-24 md:size-28 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 transition-all duration-300 relative'>
                                    {/* Subtle highlight ring on hover */}
                                    <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-primary/30 transition-colors z-10 pointer-events-none"></div>
                                    <ImageViwer image={cat.image?.filename} alt={cat.title} className='size-full object-cover img-scale-hover z-0' />
                                </div>
                                <h4 className='text-slate-800 font-semibold text-sm mt-4 group-hover:text-primary transition-colors text-center px-2 line-clamp-1'>{cat.title}</h4>
                            </div>
                        )
                    })}
                </Slider>
            </div>
        </div>
    );
}

export default CategorySlider;
