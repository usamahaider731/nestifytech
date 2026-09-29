import React, { useEffect, useState } from 'react';
import ImageViwer from './Admin/ImageViwer';
import { RiEyeLine, RiHeart2Line, RiShoppingBagLine, RiStackLine, RiStarFill, RiStarHalfFill } from 'react-icons/ri';
import { usePage, Link } from '@inertiajs/react';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { normalizeProduct } from '@/Utils/normalizeProduct';
import { FaEye } from 'react-icons/fa';

const ProductCardV1 = ({ className = '', product = {} }) => {
    const { setting } = usePage().props;
    const cardSetting = setting.layout.Product_Card_V1;
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
    const productHref = product.sku && product.id
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
            setStock(product?.meta?.stock?.value ?? 0);
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
        <article className={`group relative flex h-full flex-col overflow-hidden rounded border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl ${className}`}>
            <div className="relative aspect-square overflow-hidden bg-white">
                <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between">
                    {cardSetting.show_product_stock_info && (
                        <span className={`rounded-md px-2.5 text-[9px] font-semibold uppercase tracking-wide ${stock > 0 ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
                            {stock > 0 ? __('In Stock') : __('Out of Stock')}
                        </span>
                    )}
                    {cardSetting.show_product_discount_price && discount > 0 && (
                        <span className="rounded-md bg-primary px-2 text-[9px] font-semibold text-white">
                            -{Math.round(discount)}%
                        </span>
                    )}
                </div>

                <div className="absolute top-18 right-3 z-30 flex translate-x-3 flex-col gap-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                    {cardSetting.show_product_wishlist_button && (
                        <button type="button" className="flex size-9 items-center justify-center rounded-full bg-white text-res shadow-md transition hover:bg-red-50 hover:text-red-500" aria-label={__('Add to Wish List')}>
                            <RiHeart2Line className="size-4" />
                        </button>
                    )}
                    {cardSetting.show_product_compare_button && (
                        <button type="button" className="flex size-9 items-center justify-center rounded-full bg-white text-res shadow-md transition hover:bg-primary/10 hover:text-heading" aria-label={__('Add to Compare')}>
                            <RiStackLine className="size-4" />
                        </button>
                    )}
                </div>

                {productHref ? (
                    <Link href={productHref} className="block size-full">
                        <ImageViwer image={product.image} height={450} width={450} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    </Link>
                ) : (
                    <ImageViwer image={product.image} height={450} width={450} className="size-full object-cover" />
                )}
            </div>

            <div className="flex flex-1 border-t border-border flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                    {cardSetting.show_product_category && categories.length > 0 && (
                        <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-widest text-res">
                            {categories.map((category) => category?.title).filter(Boolean).join(', ')}
                        </p>
                    )}
                    {cardSetting.show_product_rating && (
                        <div className="flex items-center gap-0.5 text-amber-400">
                            <RiStarFill className="size-3" />
                            <RiStarFill className="size-3" />
                            <RiStarFill className="size-3" />
                            <RiStarFill className="size-3" />
                            <RiStarHalfFill className="size-3" />
                        </div>
                    )}
                </div>

                {productHref ? (
                    <Link href={productHref}>
                        <h3 className="line-clamp-2 font-poppins min-h-10 text-sm font-semibold leading-snug text-heading transition hover:text-primary">
                            {product.title}
                        </h3>
                    </Link>
                ) : (
                    <h3 className="line-clamp-2 font-poppins min-h-10 text-sm font-bold leading-snug text-heading">{product.title}</h3>
                )}

                <div className="mt-auto flex flex-col items-end justify-between gap-2 pt-1">
                    <div className="flex flex-wrap w-full items-baseline gap-x-2">
                        <span className="text-sm font-bold font-oswald text-heading">
                            {currency} {salePrice.toLocaleString()}
                        </span>
                        {firstPrice > secondPrice && secondPrice > 0 && (
                            <span className="text-xs font-medium text-res font-oswald line-through">
                                {currency} {firstPrice.toLocaleString()}
                            </span>
                        )}
                    </div>
                    {cardSetting.product_add_to_cart_button && (
                        <Link
                            href={productHref}
                            type="button"
                            className="h-10 w-full flex gap-2 shrink-0 items-center justify-center rounded bg-primary text-heading shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={__('Add to Cart')}
                        >
                            <FaEye className="size-4" />
                            <span className='text-sm font-semibold font-poppins text-heading'>{__('Show Details')}</span>
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
};

export default ProductCardV1;
