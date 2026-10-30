import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { RiArrowLeftLine, RiArrowRightSLine, RiEye2Line, RiEyeFill, RiEyeLine, RiHeart2Line, RiHeart2Fill, RiHeartLine, RiHeartFill } from 'react-icons/ri';
import SingleProductSlider from './Slider';
import ImageViwer from '../Admin/ImageViwer';
import Variations from './Variations';
import { stripTags } from '@/Utils/helper';
import { useLang } from '@/contexts/LanguageContext';
import { FaEye, FaRegEye } from 'react-icons/fa';
import ProductQRCode from './ProductQRCode';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist, selectIsInWishlist } from '@/store/wishListSlice';
import { recordWishlistActivity } from '@/Utils/recordWishlistActivity';
import { toast } from 'react-toastify';

const ProductTopSection = ({ product }) => {
    const { auth } = usePage().props;
    const { __ } = useLang();
    const dispatch = useDispatch();
    const isWishlist = useSelector(selectIsInWishlist(product?.id));

    const isOwner = Boolean(auth?.user?.id && product?.user_id && Number(auth.user.id) === Number(product.user_id));

    const handleWishlistToggle = () => {
        if (!product?.id) return;
        if (isOwner) {
            toast.info(__('You cannot like or wishlist your own product.'));
            return;
        }

        if (isWishlist) {
            dispatch(removeFromWishlist(product.id));
            if (auth?.user) recordWishlistActivity('wishlist_removed', product.id);
            toast.info(__('Removed from Wishlist'));
        } else {
            dispatch(addToWishlist({ productId: product.id, product }));
            if (auth?.user) recordWishlistActivity('wishlist_added', product.id);
            toast.success(__('Added to Wishlist'));
        }
    };

    return (
        <div className='flex flex-col w-full'>
            <div className='flex flex-wrap-reverse gap-y-3 justify-between mx-auto w-full'>
                <div className='flex font-oswald gap-2 md:gap-3 items-center'>
                    <span className='text-dynamic text-xs md:text-sm font-medium'>{__('Home')}</span>
                    <span className=''>
                        <RiArrowRightSLine className='md:text-base text-sm' />
                    </span>
                    <Link href={route('taxonomy.view', {type: "category", id: product.category[0].id, slug: product.category[0].slug, time: new Date().getTime()})} className='bg-bg p-1.5 md:p-2 text-xs rounded font-oswald font-medium'>
                        {product.category[0].title}
                    </Link>
                    <span className=''>
                        <RiArrowRightSLine className='md:text-base text-sm' />
                    </span>
                    <span className='text-text text-xs md:text-sm font-medium'>
                        {product.title}
                    </span>
                </div>
                <div className='flex items-center gap-1.5 md:gap-2'>
                    <button
                        type='button'
                        onClick={handleWishlistToggle}
                        title={isWishlist ? __('Remove from Wish List') : __('Add to Wish List')}
                        className={`flex transition-all cursor-pointer size-6 md:size-7.5 rounded items-center justify-center md:border-2 border ${
                            isWishlist
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'text-primary hover:text-white hover:bg-primary border-primary'
                        }`}
                    >
                        {isWishlist ? <RiHeartFill className='md:size-4 size-3 text-white' /> : <RiHeartLine className='size-4' />}
                    </button>
                    {product.meta?.views?.value > 0 && (
                    <button className='flex text-secondary text-xs font-semibold hover:text-white gap-1.5 hover:bg-secondary transition-all cursor-pointer h-6 md:h-7.5 w-auto px-1.5 rounded items-center justify-center border-1 md:border-2 border-secondary'>
                        <FaRegEye  className='size-3 md:size-4' />
                        <span>
                            {product.meta?.views?.value} Views
                        </span>
                    </button>
                    )}
                    <ProductQRCode product={product} />
                </div>

            </div>
            <div className='flex w-full mt-10 relative gap-10'>
                <div className='flex flex-col flex-1'>
                    <SingleProductSlider product={product} />
                </div>
                <div className='flex-1 h-fit sticky top-20'>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col gap-5'>
                            <h1 className='text-primary font-semibold font-poppins text-2xl'>
                                {product.title}
                            </h1>
                            <div className='flex flex-col gap-2 font-roboto'>
                                <div className='flex gap-4 items-start flex-col'>
                                    {product?.brand && Object.keys(product.brand).length !== 0 && 
                                    <div className='flex flex-col items-start'>
                                        <Link href={route('taxonomy.view', {type: "brand", id: product.brand.id, slug: product.brand.slug, time: new Date().getTime()})} title={product.brand.title}><ImageViwer image={product.brand?.image?.filename} alt={product.brand?.title} className='cursor-pointer max-w-36 flex items-start text-start justify-start h-12' /></Link>
                                    </div>}
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
                                {product?.store && (
                                    <div className='flex gap-2 items-center'>
                                        <span className='text-sm text-heading font-semibold'>{__('Store / Branch:')}</span>
                                        <span className='inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md bg-bg text-primary text-xs font-semibold font-roboto'>
                                            <span>{product.store.title}</span>
                                            {(product.store.city || product.store.state) && (
                                                <span className='text-primary/70 font-normal'>
                                                    ({[product.store.city, product.store.state].filter(Boolean).join(', ')})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                                {product?.tags && 
                                <div className='flex gap-2 items-center'>
                                    <span className='text-sm text-heading font-semibold'>{__('Tags:')}</span>
                                    <div className='flex gap-2'>
                                        {
                                            product?.tags?.map((tag, index) => (
                                                <Link key={tag.id} className='flex gap-2 text-xs items-center py-0.75 px-2 rounded-md bg-bg text-primary   font-medium'>
                                                    {tag.title}
                                                </Link>
                                            ))
                                        }</div>
                                </div>
                                }
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
