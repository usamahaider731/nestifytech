import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ImageViwer from './Admin/ImageViwer';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { normalizeProduct } from '@/Utils/normalizeProduct';
import {
    RiArrowRightLine,
    RiHeart2Line,
    RiShoppingBagLine,
    RiStackLine,
    RiStarFill,
    RiStarHalfFill,
} from 'react-icons/ri';

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
        <article className={`group flex h-full flex-col overflow-hidden rounded border border-border bg-white shadow-sm transition duration-300 hover:border-primary/40 hover:shadow-xl sm:flex-row ${className}`}>
            <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-white sm:aspect-auto sm:w-64 lg:w-72">
                {cardSetting.show_product_stock_info && (
                    <span className={`absolute top-3 left-3 z-10 rounded px-2 text-[10px] font-bold uppercase ${stock === 0 ? 'bg-secondary text-white' : 'bg-primary text-heading'}`}>
                        {stock === 0 ? __('Out of Stock') : __('In Stock')}
                    </span>
                )}
                {cardSetting.show_product_brand && brandTitle && (
                    <span className="absolute top-3 right-3 z-10 rounded bg-secondary px-2 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {brandTitle}
                    </span>
                )}
                {productHref ? (
                    <Link href={productHref} className="block size-full">
                        <ImageViwer image={product.image} height={900} width={900} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    </Link>
                ) : (
                    <ImageViwer image={product.image} height={900} width={900} className="size-full object-cover" />
                )}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5 border-l border-border">
                <div className="flex items-start justify-between gap-3">
                    {cardSetting.show_product_category && categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {categories.map((category, idx) => (
                                <span key={idx} className="rounded bg-common px-2.5 text-[10px] font-semibold uppercase tracking-wide text-res">
                                    {category.title}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                        {cardSetting.show_product_compare_button && (
                            <button type="button" title={__('Add to Compare')} className="rounded-full p-2 text-res transition hover:bg-accent hover:text-heading">
                                <RiStackLine className="size-4" />
                            </button>
                        )}
                        {cardSetting.show_product_wishlist_button && (
                            <button type="button" title={__('Add to Wish List')} className="rounded-full p-2 text-res transition hover:bg-red-50 hover:text-red-500">
                                <RiHeart2Line className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    {productHref ? (
                        <Link href={productHref}>
                            <h3 className="text-lg font-medium font-poppins leading-snug text-heading transition group-hover:text-primary">
                                {product.title}
                            </h3>
                        </Link>
                    ) : (
                        <h3 className="text-lg font-medium font-poppins leading-snug text-heading">{product.title}</h3>
                    )}
                    {cardSetting.show_product_rating && (
                        <div className="flex shrink-0 items-center gap-0.5 text-amber-400">
                            <RiStarFill className="size-3.5" />
                            <RiStarFill className="size-3.5" />
                            <RiStarFill className="size-3.5" />
                            <RiStarFill className="size-3.5" />
                            <RiStarHalfFill className="size-3.5" />
                        </div>
                    )}
                </div>

                {shortDescription && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-res" dangerouslySetInnerHTML={{ __html: shortDescription }} />
                )}

                {cardSetting.show_product_price !== false && (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xl font-bold font-oswald text-heading">
                            {currency} {salePrice.toLocaleString()}
                        </span>
                        {firstPrice > secondPrice && secondPrice > 0 && (
                            <span className="text-sm font-medium text-res font-oswald line-through">
                                {currency} {firstPrice.toLocaleString()}
                            </span>
                        )}
                        {cardSetting.show_product_discount_price && discount > 0 && (
                            <span className="rounded-full bg-primary font-poppins px-2.5 py-1 text-xs font-semibold text-white">
                                {Math.round(discount)}% {__('Off')}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">

                    {cardSetting.show_product_view_button && productHref && (
                        <Link
                            href={productHref}
                            className="inline-flex items-center justify-center gap-2 rounded border border-border px-5 py-2.5 text-sm font-bold text-heading transition hover:border-primary hover:bg-primary"
                        >
                            {__('View Product')}
                            <RiArrowRightLine className="size-4" />
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
};

export default ProductCardV2;
