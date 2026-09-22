import React, { useEffect, useState } from 'react';
import ImageViwer from './Admin/ImageViwer';
import Slider from './Slider';
import { RiArrowRightLine, RiEyeLine, RiHeart2Line, RiMapPin2Fill, RiShoppingBagLine, RiStackLine, RiStarFill, RiStarHalfFill } from 'react-icons/ri';
import { usePage, Link } from '@inertiajs/react';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { normalizeProduct } from '@/Utils/normalizeProduct';

const ProductCardV1 = ({ className = '', product = {} }) => {
    const { setting } = usePage().props;
    const cardSetting = setting.layout.Product_Card_V1;
    const currency = setting.site.currency.value ?? 'PKR';
    const { addItem } = useCart();
    const { __ } = useLang();
    const [Categories, setCategories] = useState(product.category ?? []);
    const [Stock, SetStock] = useState(0);
    const [discount, setDiscount] = useState(0);
    const parsePrice = (priceVal) => {
        if (typeof priceVal === 'number') return priceVal;
        if (!priceVal) return 0;
        const cleanedValue = String(priceVal).replace(/,/g, '');
        const parsed = Number(cleanedValue);
        return isNaN(parsed) ? 0 : parsed;
    };

    const first_price = parsePrice(product.meta?.first_price?.value);
    const second_price = parsePrice(product.meta?.second_price?.value);
    useEffect(() => {
        if (product.variations?.length > 0) {
            SetStock(product.variations.reduce((acc, variation) => {
                if (variation.combinations && variation.combinations.length > 0) {
                    return acc + variation.combinations.reduce((cAcc, c) => cAcc + Number(c.stock || 0), 0);
                }
                if (variation.sizes && variation.sizes.length > 0) {
                    return acc + variation.sizes.reduce((sAcc, s) => sAcc + Number(s.stock || 0), 0);
                }
                return acc + Number(variation.stock || 0);
            }, 0));
        } else {
            SetStock(product.stock ?? 0);
        }
        if (first_price > second_price) {
            setDiscount(((first_price - second_price) / first_price) * 100);
        }
    }, [product]);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cartItem = normalizeProduct(product, currency);
        if (cartItem) {
            addItem(cartItem);
        }
    };

    return (
        <div className={`bg-white hover-lift overflow-hidden relative group ${className}`}>

            {/* Image & Badges Section */}
            <div className="relative w-full aspect-square bg-white flex items-center justify-center p-4 overflow-hidden group-hover:bg-slate-50/50 transition-colors duration-300">

                {/* Floating Badges */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-start z-30 size-full pointer-events-none">


                    {cardSetting.show_product_discount_price && discount > 0 && (
                        <span className='bottom-5 right-5 absolute bg-primary/90 text-white px-2.5 py-1 text-xs font-bold rounded-full shadow-sm'>
                            -{Math.round(discount)}%
                        </span>
                    )}
                </div>

                {/* Floating Actions (Right Side) */}
                <div className="absolute top-3 -right-12 group-hover:right-3 flex flex-col gap-2 z-30 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                    {cardSetting.show_product_wishlist_button && (
                        <button className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <RiHeart2Line className='size-4' />
                        </button>
                    )}
                    {cardSetting.show_product_compare_button && (
                        <button className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors delay-75">
                            <RiStackLine className='size-4' />
                        </button>
                    )}
                </div>
                <div className='h-full w-full'>
                    <ImageViwer image={product.image} className="max-h-full max-w-full object-cover mx-auto img-scale-hover" />
                </div>
            </div>

            <div className="p-4 flex flex-col border-t border-t-border transition-transform z-30 bg-white gap-2">

                <div className='flex items-center justify-between'>
                    {cardSetting.show_product_category && Categories.length > 0 && (
                        <div className='flex flex-wrap items-center gap-x-1'>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                                {Categories[0]?.title}
                            </span>
                        </div>
                    )}

                    {cardSetting.show_product_rating && (
                        <div className="flex items-center gap-0.5">
                            <RiStarFill className="text-amber-400 text-[10px]" />
                            <RiStarFill className="text-amber-400 text-[10px]" />
                            <RiStarFill className="text-amber-400 text-[10px]" />
                            <RiStarFill className="text-amber-400 text-[10px]" />
                            <RiStarHalfFill className="text-amber-400 text-[10px]" />
                        </div>
                    )}
                </div>

                {/* Title */}
                <Link href={route('post', { sku: product.sku, id: product.id, type: "product" })} className="block">
                    <h3 className="text-md font-bold text-slate-800 line-clamp-2 hover:text-primary transition-colors leading-snug cursor-pointer">
                        {product.title}
                    </h3>
                </Link>

                {/* Price */}
                <div className="mt-1 flex items-center gap-2">
                    {/* if aready a number then fix this satuation */}
                    {first_price > second_price ? (
                        <div className="flex items-baseline gap-3">
                            <span className="text-sm font-bold text-slate-900">{currency} {second_price?.toLocaleString()}</span>
                            <span className="text-[12px] font-medium text-slate-400 line-through decoration-slate-300">{currency} {first_price?.toLocaleString()}</span>
                        </div>
                    ) : (
                        <span className="text-sm font-extrabold text-slate-900">{currency} {first_price?.toLocaleString()}</span>
                    )}
                </div>
                <div className='flex gap-2 items-center absolute bottom-0 px-5 pb-5 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-in-out'>
                    {cardSetting.product_add_to_cart_button && (
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="flex-1 bg-primary backdrop-blur-sm text-text py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                            <RiShoppingBagLine className="size-4" /> {__('Add to Cart')}
                        </button>
                    )}
                </div>


            </div>
        </div>
    );
}

export default ProductCardV1;