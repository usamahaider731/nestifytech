import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import ProfileLayout from './ProfileLayout';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectWishlistItems,
    removeFromWishlist,
    clearWishlist,
} from '@/store/wishListSlice';
import { useLang } from '@/contexts/LanguageContext';
import { recordWishlistActivity } from '@/Utils/recordWishlistActivity';
import ProductCardV2 from '@/Components/ProductCardV2';
import {
    RiHeart3Line,
    RiShoppingBag3Line,
    RiDeleteBinLine,
    RiArrowRightLine,
    RiSparklingLine,
    RiEyeLine,
} from 'react-icons/ri';
import ProductCardV1 from '@/Components/ProductCardV1';

export default function Wishlist({ profile, recommended_products = [] }) {
    const { __ } = useLang();
    const { setting } = usePage().props;
    const currency = setting?.site?.currency?.value || setting?.currency_symbol || 'PKR';

    const dispatch = useDispatch();
    const wishlistItems = useSelector(selectWishlistItems) || [];

    const handleRemove = (productId) => {
        dispatch(removeFromWishlist(productId));
        recordWishlistActivity('wishlist_removed', productId);
    };

    const handleClearAll = () => {
        if (window.confirm(__('Are you sure you want to clear your entire wishlist?'))) {
            recordWishlistActivity('wishlist_cleared', null, wishlistItems.length);
            dispatch(clearWishlist());
        }
    };

    return (
        <ProfileLayout title={__('My Wishlist')} currentTab="wishlist" profile={profile}>
            <div className="space-y-6">
                {/* ── Top Header Bar ── */}
                <div className="bg-bg border border-border rounded p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-text">
                            {__('Saved Products & Wishlist')}
                        </h1>
                        <p className="text-xs text-res mt-0.5">
                            {__('Keep track of the products you love and want to purchase later.')}
                        </p>
                    </div>

                    {wishlistItems.length > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-res">
                                {wishlistItems.length} {wishlistItems.length === 1 ? __('item') : __('items')}
                            </span>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer"
                            >
                                <RiDeleteBinLine size={13} />
                                {__('Clear All')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Wishlist Items Grid / Table ── */}
                {wishlistItems.length === 0 ? (
                    <div className="bg-bg border border-border rounded p-12 text-center shadow-xs">
                        <div className="size-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                            <RiHeart3Line size={32} />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">
                            {__('Your Wishlist is Empty')}
                        </h3>
                        <p className="text-xs text-res max-w-md mx-auto mb-5">
                            {__('You haven\'t added any items to your wishlist yet. Explore our product collections and tap the heart icon on items you love!')}
                        </p>
                        <Link
                            href={route('index')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-common text-white rounded hover:opacity-90 shadow-xs transition-opacity"
                        >
                            <RiShoppingBag3Line size={14} />
                            {__('Explore Products')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {wishlistItems.map((item) => {
                            const product = item.product || item;
                            const title = product.title || product.name || __('Product');
                            const price = product.price || 0;
                            const image = product.featured_image || product.image || (product.images && product.images[0]) || null;
                            const productId = item.productId || product.id;
                            const sku = product.sku || '';

                            return (
                                <div
                                    key={productId}
                                    className="bg-bg border border-border rounded overflow-hidden shadow-xs flex flex-col justify-between group hover:border-primary/50 transition-colors"
                                >
                                    <div className="relative p-4 flex flex-col items-center text-center">
                                        {/* Remove Wishlist Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(productId)}
                                            title={__('Remove from Wishlist')}
                                            className="absolute top-3 right-3 p-1.5 rounded-full bg-bg/80 hover:bg-rose-50 text-res hover:text-rose-600 border border-border transition-colors cursor-pointer"
                                        >
                                            <RiDeleteBinLine size={14} />
                                        </button>

                                        {/* Product Thumbnail */}
                                        <div className="size-36 flex items-center justify-center mb-3">
                                            {image ? (
                                                <img
                                                    src={typeof image === 'string' ? image : (image.filename ? `/storage/uploads/image/${image.filename}` : '/assets/image/mobiles.webp')}
                                                    alt={title}
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            ) : (
                                                <div className="size-24 rounded bg-bg flex items-center justify-center text-res">
                                                    <RiShoppingBag3Line size={32} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Title */}
                                        <h3 className="font-semibold text-xs text-text hover:text-primary transition-colors line-clamp-2 mb-2">
                                            {sku ? (
                                                <Link href={route('post', { type: 'product', sku: sku, id: productId })}>
                                                    {title}
                                                </Link>
                                            ) : (
                                                <span>{title}</span>
                                            )}
                                        </h3>

                                        {/* Price */}
                                        <div className="text-sm font-bold text-primary mb-3">
                                            {currency} {Number(price).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Action Footers */}
                                    <div className="p-3 bg-bg/40 border-t border-border flex items-center gap-2">
                                        {sku ? (
                                            <Link
                                                href={route('post', { type: 'product', sku: sku, id: productId })}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-common hover:opacity-90 text-white rounded transition-opacity"
                                            >
                                                <RiEyeLine size={14} />
                                                {__('View Details')}
                                            </Link>
                                        ) : (
                                            <span className="flex-1 text-center text-xs text-res py-2">
                                                {__('Unavailable')}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(productId)}
                                            className="px-2.5 py-2 text-xs font-medium bg-bg hover:bg-rose-50 text-res hover:text-rose-600 rounded border border-border transition-colors cursor-pointer"
                                            title={__('Remove')}
                                        >
                                            <RiDeleteBinLine size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Recommended Products for you ── */}
                {recommended_products.length > 0 && (
                    <div className="bg-bg border border-border rounded p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-primary/10 text-primary">
                                    <RiSparklingLine size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-text">
                                        {__('Recommended For You')}
                                    </h3>
                                    <p className="text-[11px] text-res">
                                        {__('Popular products you might be interested in.')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('store')}
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                            >
                                {__('View All')} <RiArrowRightLine size={14} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {recommended_products.map((prod) => (
                                <ProductCardV1 key={prod.id} product={prod} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ProfileLayout>
    );
}
