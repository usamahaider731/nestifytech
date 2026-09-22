import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { RiArrowLeftLine, RiArrowRightSLine, RiEye2Line, RiEyeFill, RiEyeLine, RiHeart2Line, RiHeartLine } from 'react-icons/ri';
import SingleProductSlider from './Slider';
import ImageViwer from '../Admin/ImageViwer';
import Variations from './Variations';
import { stripTags } from '@/Utils/helper';
import { useLang } from '@/contexts/LanguageContext';
import { FaEye, FaRegEye } from 'react-icons/fa';
const ProductTopSection = ({ product }) => {
    const { __ } = useLang();
    return (
        <div className='flex flex-col w-full'>
            <div className='flex justify-between mx-auto w-full'>
                <div className='flex gap-3 items-center'>
                    <span className='text-dynamic text-sm font-medium'>{__('Home')}</span>
                    <span className=''>
                        <RiArrowRightSLine className='text-base' />
                    </span>
                    <span className='bg-bg p-2 text-xs rounded font-medium'>
                        {product.category[0].title}
                    </span>
                    <span className=''>
                        <RiArrowRightSLine className='text-base' />
                    </span>
                    <span className='text-text text-sm font-medium'>
                        {product.title}
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    <button title='Add to Wish List' className='flex text-primary hover:text-white hover:bg-primary transition-all cursor-pointer size-7.5 rounded items-center justify-center border-2 border-primary'>
                        <RiHeartLine className='size-4' />
                    </button>
                    <button className='flex text-secondary text-xs font-semibold hover:text-white gap-1.5 hover:bg-secondary transition-all cursor-pointer h-7.5 w-auto px-1.5 rounded items-center justify-center border-2 border-secondary'>
                        <FaRegEye  className='size-4' />
                        <span>
                            {product.meta.views.value} Views
                        </span>
                    </button>
                </div>
            </div>
            <div className='flex w-full mt-10 gap-10'>
                <div className='flex flex-col flex-1'>
                    <SingleProductSlider product={product} />
                </div>
                <div className='flex-1'>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col gap-5'>
                            <h1 className='text-primary font-bold text-2xl'>
                                {product.title}
                            </h1>
                            <div className='flex flex-col gap-2'>
                                <div className='flex gap-4 items-center'>
                                    <div className='flex gap-2 items-center text-center'>
                                        <span className='text-lg text-heading font-semibold'>{__('Brand:')}</span>
                                        <span title={product.brand?.title}><ImageViwer image={product.brand?.image?.filename} alt={product.brand?.title} className='w-auto h-4' /></span>
                                    </div>
                                    <div className='flex gap-2 items-center'>
                                        <span className='text-lg text-heading font-semibold'>{__('SKU:')}</span>
                                        <span className='text-text font-semibold text-lg'>{product.sku}</span>
                                    </div>
                                </div>
                                <div className='flex gap-2 items-center'>
                                    <span className='text-sm text-heading font-semibold'>{__('Category:')}</span>
                                    <div className='flex gap-2'>
                                        {
                                            product.category.map((cat, index) => (
                                                <Link key={cat.id} className='flex gap-2 text-xs items-center py-0.75 px-2 rounded-md bg-bg text-primary   font-medium'>
                                                    {cat.title}
                                                </Link>
                                            ))
                                        }</div>
                                </div>
                                <div className=''>
                                    <Variations product={product} />
                                </div>
                                <div
                                    className='text-xs font-medium text-text mt-5'
                                    dangerouslySetInnerHTML={{ __html: product.meta?.short_description?.value ?? __('No description') }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductTopSection;
