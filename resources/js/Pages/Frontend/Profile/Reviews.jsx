import React from 'react';
import { Link } from '@inertiajs/react';
import ProfileLayout from './ProfileLayout';
import {
    RiStarFill,
    RiStarLine,
    RiThumbUpLine,
    RiShoppingBag3Line,
    RiCheckLine,
    RiTimeLine,
    RiMessage3Line,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function Reviews({ profile, reviews = [] }) {
    const { __ } = useLang();

    const stats = profile?.stats || {};
    const totalLikes = reviews.reduce((sum, r) => sum + (r.likes || 0), 0);
    const avgRating =
        reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
            : '0.0';

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                        {star <= rating ? (
                            <RiStarFill size={15} />
                        ) : (
                            <RiStarLine size={15} className="text-border" />
                        )}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <ProfileLayout title={__('My Reviews')} currentTab="reviews" profile={profile}>
            <div className="space-y-6">
                {/* ── Top Header & Stats Bar ── */}
                <div className="bg-bg border border-border rounded p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-lg font-bold text-text">
                                {__('My Product Reviews')}
                            </h1>
                            <p className="text-xs text-res mt-0.5">
                                {__('Manage the reviews and feedback you have shared with the community.')}
                            </p>
                        </div>
                    </div>

                    {/* Quick Metric Pills */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                        <div className="bg-bg p-3 rounded text-center">
                            <span className="text-xs text-res block">{__('Total Reviews')}</span>
                            <span className="text-lg font-bold text-text mt-0.5 block">
                                {reviews.length}
                            </span>
                        </div>
                        <div className="bg-bg p-3 rounded text-center">
                            <span className="text-xs text-res block">{__('Average Rating')}</span>
                            <span className="text-lg font-bold text-amber-500 mt-0.5 flex items-center justify-center gap-1">
                                {avgRating} <RiStarFill size={16} />
                            </span>
                        </div>
                        <div className="bg-bg p-3 rounded text-center">
                            <span className="text-xs text-res block">{__('Helpful Likes')}</span>
                            <span className="text-lg font-bold text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                                {totalLikes} <RiThumbUpLine size={16} />
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Reviews Listing ── */}
                {reviews.length === 0 ? (
                    <div className="bg-bg border border-border rounded p-12 text-center shadow-xs">
                        <div className="size-16 mx-auto mb-4 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                            <RiStarLine size={32} />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">
                            {__('No Reviews Submitted Yet')}
                        </h3>
                        <p className="text-xs text-res max-w-md mx-auto mb-5">
                            {__('You haven\'t reviewed any products yet. Share your thoughts on purchased products to help others make informed decisions!')}
                        </p>
                        <Link
                            href={route('profile.orders')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-common text-white rounded hover:opacity-90 shadow-xs transition-opacity"
                        >
                            <RiShoppingBag3Line size={14} />
                            {__('Review Purchased Products')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div
                                key={rev.id}
                                className="bg-bg border border-border rounded p-5 shadow-xs space-y-3 hover:border-primary/40 transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    {/* Product Info */}
                                    <div className="flex items-center gap-3">
                                        {rev.image ? (
                                            <img
                                                src={rev.image}
                                                alt={rev.product_title}
                                                className="size-12 rounded object-cover border border-border shrink-0"
                                            />
                                        ) : (
                                            <div className="size-12 rounded bg-bg flex items-center justify-center text-res border border-border shrink-0">
                                                <RiShoppingBag3Line size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <a
                                                href={rev.product_url}
                                                className="text-xs font-semibold text-text hover:text-primary transition-colors line-clamp-1"
                                            >
                                                {rev.product_title}
                                            </a>
                                            <span className="text-[11px] text-res block">
                                                {rev.created_at} ({rev.time_ago})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div>
                                        {rev.status === 'approved' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <RiCheckLine size={12} /> {__('Approved')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                <RiTimeLine size={12} /> {__('Under Review')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Rating & Comment */}
                                <div className="bg-bg/60 p-3.5 rounded border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        {renderStars(rev.rating)}
                                        <span className="text-xs font-bold text-text">
                                            {rev.rating}/5
                                        </span>
                                    </div>
                                    <p className="text-xs text-text leading-relaxed whitespace-pre-line">
                                        {rev.comment || __('No text comment provided.')}
                                    </p>
                                </div>

                                {/* Review Footer */}
                                <div className="flex items-center justify-between text-xs text-res pt-1">
                                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                        <RiThumbUpLine size={14} />
                                        <span>
                                            {rev.likes || 0} {__('people found this helpful')}
                                        </span>
                                    </div>
                                    <a
                                        href={rev.product_url}
                                        className="text-primary hover:underline font-medium text-[11px]"
                                    >
                                        {__('View Product')} &rarr;
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ProfileLayout>
    );
}
