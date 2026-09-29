import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ImageViwer from './Admin/ImageViwer';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { normalizeProduct } from '@/Utils/normalizeProduct';
import {
    RiArrowRightLine,
    RiHeart2Line,
    RiRepeat2Line,
    RiShoppingBagLine,
    RiStackLine,
    RiStarFill,
    RiStarHalfFill,
} from 'react-icons/ri';
import { FaCompass, FaEye } from 'react-icons/fa';
import { MdCompareArrows } from 'react-icons/md';

const ProductCardV2 = ({ className = '', product = {} }) => {
    const { setting } = usePage().props;
    const cardSetting = setting.layout.Product_Card_V2;
    const currency = setting.site.currency.value ?? 'PKR';
    const { addItem } = useCart();
    const { __ } = useLang();

    const categories = product.category ?? [];
    const [stock, setStock] = useState(0);
    const [discount, setDiscount] = useState(0);

    const parsePrice = (priceVal) => {
        if (typeof priceVal === 'number') return priceVal;
        if (!priceVal) return 0;
        const parsed = Number(String(priceVal).replace(/,/g, ''));
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const firstPrice = parsePrice(product.meta?.first_price?.value);
    const secondPrice = parsePrice(product.meta?.second_price?.value);
    const salePrice = firstPrice > secondPrice && secondPrice > 0 ? secondPrice : firstPrice;
    const brandTitle = Array.isArray(product.brand) ? product.brand[0]?.title : product.brand?.title;
    const shortDescription = String(product.meta?.short_description?.value ?? '');

    const productHref =
        product.sku && product.id
            ? route('post', { sku: product.sku, id: product.id, type: 'product' })
            : null;

    useEffect(() => {
        if (product.variations?.length > 0) {
            setStock(product.variations.reduce((acc, variation) => {
                if (variation.combinations?.length > 0) {
                    return acc + variation.combinations.reduce((cAcc, c) => cAcc + Number(c.stock || 0), 0);
                }
                if (variation.sizes?.length > 0) {
                    return acc + variation.sizes.reduce((sAcc, s) => sAcc + Number(s.stock || 0), 0);
                }
                return acc + Number(variation.stock || 0);
            }, 0));
        } else {
            setStock(product.meta?.stock?.value ?? 0);
        }

        if (firstPrice > secondPrice && firstPrice > 0) {
            setDiscount(((firstPrice - secondPrice) / firstPrice) * 100);
        } else {
            setDiscount(0);
        }
    }, [product, firstPrice, secondPrice]);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cartItem = normalizeProduct(product, currency);
        if (cartItem) {
            addItem(cartItem);
        }
    };

    return (
        <article className={`group flex flex-col overflow-hidden rounded h-40 border border-border bg-white shadow-sm transition duration-300 hover:border-primary/40 hover:shadow-xl sm:flex-row ${className}`}>
            <div className="relative shrink-0 overflow-hidden bg-white sm:w-32 p-3 lg:w-40">

                {productHref ? (
                    <Link href={productHref} className="block size-full">
                        <ImageViwer image={product.image} height={900} width={900} className="size-full object-cover rounded transition duration-500 group-hover:scale-105" />
                    </Link>
                ) : (
                    <ImageViwer image={product.image} height={900} width={900} className="size-full object-cover rounded" />
                )}
                <div className='flex items-center absolute group-hover:bottom-5 -bottom-full duration-200 ease-in-out left-auto right-auto gap-1'>
                    {cardSetting.show_product_stock_info && (
                        <span className={`z-10 rounded px-2 text-[8px] font-bold uppercase ${stock === 0 ? 'bg-secondary text-white' : 'bg-primary text-heading'}`}>
                            {stock === 0 ? __('Out of Stock') : __('In Stock')}
                        </span>
                    )}
                    {cardSetting.show_product_brand && brandTitle && (
                        <span className="z-10 rounded bg-secondary px-1 text-[8px] font-semibold uppercase tracking-wide text-white">
                            {brandTitle}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3 border-l border-border">
                <div className="flex items-start justify-between gap-5">

                    {cardSetting.show_product_category && categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {categories.map((category, idx) => (
                                <span key={idx} className="rounded bg-common px-2 text-[9px] font-semibold uppercase tracking-wide text-res">
                                    {category.title}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                        {cardSetting.show_product_wishlist_button && (
                            <button type="button" title={__('Add to Wish List')} className=" text-res transition hover:text-red-500">
                                <RiHeart2Line className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1 sm:items-start sm:justify-between">
                    {productHref ? (
                        <Link href={productHref}>
                            <h3 className="text-base line-clamp-1 font-medium font-poppins leading-snug text-heading transition group-hover:text-primary">
                                {product.title}
                            </h3>
                        </Link>
                    ) : (
                        <h3 className="text-base font-medium font-poppins leading-snug text-heading">{product.title}</h3>
                    )}
                    {cardSetting.show_product_rating && (
                        <div className="flex shrink-0 items-center gap-0.5 text-amber-400">
                            <RiStarFill className="size-3" />
                            <RiStarFill className="size-3" />
                            <RiStarFill className="size-3" />
                            <RiStarFill className="size-3" />
                            <RiStarHalfFill className="size-3" />
                        </div>
                    )}
                </div>
                {cardSetting.show_product_price !== false && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold font-oswald text-heading">
                            {currency} {salePrice.toLocaleString()}
                        </span>
                        {firstPrice > secondPrice && secondPrice > 0 && (
                            <span className="text-xs font-medium text-res font-oswald line-through">
                                {currency} {firstPrice.toLocaleString()}
                            </span>
                        )}

                        {cardSetting.show_product_discount_price && discount > 0 && (
                            <span className="ml-5 text-primary font-poppins text-xs font-medium">
                                {Math.round(discount)}% {__('Off')}
                            </span>
                        )}

                    </div>
                )}

                <div className="flex flex-wrap mt-auto items-center gap-1.5">

                    {cardSetting.show_product_view_button && productHref && (
                        <Link
                            href={productHref}
                            className="inline-flex items-center justify-center gap-2 rounded border border-border px-3 py-2 text-xs font-semibold text-heading transition hover:border-primary hover:bg-primary"
                        >
                            {__('View Details')}
                            <FaEye className="size-3" />
                        </Link>
                    )}
                    {cardSetting.show_product_compare_button && productHref && (
                        <button
                            type='button'
                            onClick={() => handleAddToCart()}
                            className="inline-flex items-center justify-center gap-2 rounded border border-border px-2.5  py-2 text-xs font-semibold transition hover:border-primary bg-primary text-white hover:bg-primary"
                        >
                            <RiRepeat2Line className="size-4" />
                            {__('Add To Comapre')}
                        </button>
                    )}

                </div>
            </div>
        </article>
    );
};

export default ProductCardV2;
