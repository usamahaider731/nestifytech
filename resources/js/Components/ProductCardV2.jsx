import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import ImageViwer from './Admin/ImageViwer';
import Slider from './Slider';
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
    RiStarLine,
} from 'react-icons/ri';

const ProductCardV2 = ({ className = '', product = {} }) => {
    const { setting } = usePage().props;
    const cardSetting = setting.layout.Product_Card_V2;
    const currency = setting.site.currency.value ?? 'PKR';
    const { addItem } = useCart();
    const { __ } = useLang();

    const [categories] = useState(product.category ?? []);
    const [stock, setStock] = useState(0);
    const [discount, setDiscount] = useState(0);

    useEffect(() => {
        if (product.variations?.length > 0) {
            setStock(product.variations.reduce((acc, variation) => {
                if (variation.combinations && variation.combinations.length > 0) {
                    return acc + variation.combinations.reduce((cAcc, c) => cAcc + Number(c.stock || 0), 0);
                }
                if (variation.sizes && variation.sizes.length > 0) {
                    return acc + variation.sizes.reduce((sAcc, s) => sAcc + Number(s.stock || 0), 0);
                }
                return acc + Number(variation.stock || 0);
            }, 0));
        } else {
            setStock(product.stock ?? 0);
        }

        const firstPrice = Number(product.meta?.first_price?.value ?? 0);
        const secondPrice = Number(product.meta?.second_price?.value ?? firstPrice);
        if (firstPrice > secondPrice) {
            setDiscount(((firstPrice - secondPrice) / firstPrice) * 100);
        }
    }, [product]);

    const productHref =
        product.sku && product.id
            ? route('singleproduct', { sku: product.sku, id: product.id })
            : null;

    const handleAddToCart = () => {
        const cartItem = normalizeProduct(product, currency);
        if (cartItem) {
            addItem(cartItem);
        }
    };

    return (
        <article
            className={`group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${className}`}
        >
            <div className="relative aspect-[4/3] bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
                {cardSetting.show_product_brand && product.brand?.title && (
                    <span className="absolute top-3 right-3 z-10 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-text uppercase tracking-wide">
                        {product.brand.title}
                    </span>
                )}

                {cardSetting.show_product_stock_info && (
                    <span
                        className={`absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold text-text uppercase ${
                            stock === 0 ? 'bg-red-500' : 'bg-primary'
                        }`}
                    >
                        {stock === 0 ? 'Out of Stock' : 'In Stock'}
                    </span>
                )}

                {cardSetting.show_product_rating && (
                    <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-amber-600 shadow-sm">
                        <RiStarFill className="size-3.5" />
                        4.5
                    </span>
                )}

                {cardSetting.product_image == 1 ? (
                    <Slider
                        show={1}
                        options={{ loop: true, align: 'start', dragFree: true }}
                        showNavigation={false}
                        autoplay={true}
                        containerClass="h-full w-full"
                    >
                        {product.gallery?.map((image, idx) => (
                            <div className="embla__slide w-full mx-auto" key={idx}>
                                <ImageViwer
                                    image={image}
                                    className="max-h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                        ))}
                    </Slider>
                ) : (
                    <ImageViwer
                        image={product.image}
                        className="max-h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                )}
            </div>

            <div className="flex flex-col flex-1 p-4 gap-3 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                    {cardSetting.show_product_category && categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {categories.map((category, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] font-medium text-slate-400 uppercase tracking-wide"
                                >
                                    {category.title}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                        {cardSetting.show_product_compare_button && (
                            <button type="button" title="Add to Compare" aria-label="Add to Compare">
                                <RiStackLine className="size-4 cursor-pointer text-primary" />
                            </button>
                        )}
                        {cardSetting.show_product_wishlist_button && (
                            <button type="button" title="Add to Wish List" aria-label="Add to Wish List">
                                <RiHeart2Line className="size-4 cursor-pointer text-primary" />
                            </button>
                        )}
                    </div>
                </div>

                {productHref ? (
                    <Link href={productHref}>
                        <h3 className="text-sm font-semibold text-heading line-clamp-2 min-h-10 group-hover:text-primary transition-colors">
                            {product.title}
                        </h3>
                    </Link>
                ) : (
                    <h3 className="text-sm font-semibold text-heading line-clamp-2 min-h-10">
                        {product.title}
                    </h3>
                )}

                {cardSetting.show_product_rating && (
                    <div className="flex items-center gap-1">
                        <RiStarFill className="size-3.5 text-amber-400" />
                        <RiStarFill className="size-3.5 text-amber-400" />
                        <RiStarFill className="size-3.5 text-amber-400" />
                        <RiStarFill className="size-3.5 text-amber-400" />
                        <RiStarHalfFill className="size-3.5 text-amber-400" />
                    </div>
                )}

                {cardSetting.show_product_price !== false && (
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                        <div className="flex items-center gap-2">
                            {Number(product.meta?.first_price?.value) >
                            Number(product.meta?.second_price?.value) ? (
                                <>
                                    <span className="text-lg font-bold text-heading">
                                        {currency}{' '}
                                        {Number(product.meta.second_price.value).toLocaleString()}
                                    </span>
                                    <span className="text-sm text-slate-400 line-through">
                                        {currency}{' '}
                                        {Number(product.meta.first_price.value).toLocaleString()}
                                    </span>
                                </>
                            ) : (
                                <span className="text-lg font-bold text-heading">
                                    {currency}{' '}
                                    {Number(product.meta?.first_price?.value ?? 0).toLocaleString()}
                                </span>
                            )}
                        </div>
                        {cardSetting.show_product_discount_price && discount > 0 && (
                            <span className="rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-text">
                                {Math.round(discount)}% {__('Off')}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-auto flex items-center gap-2">
                    {cardSetting.product_add_to_cart_button && (
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-text transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-sm"
                        >
                            <RiShoppingBagLine className="size-4" />
                            {__('Add to Cart')}
                        </button>
                    )}
                    {cardSetting.show_product_view_button && productHref && (
                        <Link
                            href={productHref}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-xs font-bold text-primary transition-all duration-200 hover:bg-primary/5"
                        >
                            <RiArrowRightLine className="size-4" />
                            {__('View Product')}
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
};

export default ProductCardV2;
