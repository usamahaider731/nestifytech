import { Link, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import ImageViwer from '../Admin/ImageViwer';
import Slider from '../Slider';
import { useLang } from '@/contexts/LanguageContext';

const CategorySlider = ({categories}) => {
    const { setting } = usePage().props;
    const { __ } = useLang();
    const [Categories, setCategories] = useState(categories);
    console.log(Categories)
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
                <div show={8} options={{ loop: true, align: 'start', dragFree: true }} className='grid grid-cols-8 w-full'>
                    {Categories.length > 0 && Categories.map((cat) => {
                        return (
                            <Link href={route('taxonomy.view', {type: 'category', id: cat.id, slug: cat.slug, time: Date.now()})} key={cat.id} className='flex flex-col embla__slide cursor-pointer items-center group py-4'>
                                <div className='relative flex size-24 bg-white items-center justify-center overflow-hidden rounded-full border-2 border-primary p-1 transition-all duration-300 md:size-28'>
                                    <div className="roundedn-full transition-colors z-10 pointer-events-none">
                                    <ImageViwer image={cat.image?.filename} alt={cat.title} className='size-full object-cover rounded-full img-scale-hover z-0' />
                                    </div>
                                </div>
                                <h4 className='mt-2 line-clamp-1 px-2 text-center text-sm font-medium text-heading transition-colors group-hover:text-primary'>{cat.title}</h4>
                                <span className='mt-0.75 line-clamp-1 px-3 rounded-full py-0.25 bg-common text-center text-[10px] font-medium text-text transition-colors group-hover:text-primary'>{cat.all_products?.length || 0}  {__('item') + (cat.all_products?.length > 2 ? 's' : '')}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

export default CategorySlider;