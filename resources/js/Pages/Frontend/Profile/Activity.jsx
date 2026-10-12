import React, { useState } from 'react';
import ProfileLayout from './ProfileLayout';
import {
    RiTimeLine,
    RiShoppingBag3Line,
    RiStarLine,
    RiUserLine,
    RiEyeLine,
    RiHeart2Line,
    RiFilterLine,
    RiInformationLine,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function Activity({ profile, activities = [] }) {
    const { __ } = useLang();
    const [filterCategory, setFilterCategory] = useState('all');

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'order':
                return { icon: RiShoppingBag3Line, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' };
            case 'product':
                return { icon: RiEyeLine, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' };
            case 'wishlist':
                return { icon: RiHeart2Line, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' };
            case 'review':
                return { icon: RiStarLine, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' };
            case 'profile':
                return { icon: RiUserLine, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' };
            default:
                return { icon: RiTimeLine, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' };
        }
    };

    const categories = [
        { id: 'all', label: __('All Events') },
        { id: 'order', label: __('Orders & Cart') },
        { id: 'product', label: __('Products') },
        { id: 'wishlist', label: __('Wishlist') },
        { id: 'review', label: __('Reviews') },
        { id: 'profile', label: __('Profile & Settings') },
    ];

    const filteredActivities = activities.filter((act) => {
        if (filterCategory === 'all') return true;
        return act.category === filterCategory;
    });

    return (
        <ProfileLayout title={__('Activity Log')} currentTab="activity" profile={profile}>
            <div className="space-y-6">
                {/* ── Top Header & Filter Bar ── */}
                <div className="bg-bg border border-border rounded p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-lg font-bold text-text">
                                {__('Account Activity Log')}
                            </h1>
                            <p className="text-xs text-res mt-0.5">
                                {__('Review meaningful actions associated with your account.')}
                            </p>
                        </div>
                    </div>

                    {/* Filter Category Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-border pt-3">
                        <RiFilterLine size={14} className="text-res shrink-0 mr-1" />
                        {categories.map((cat) => {
                            const isActive = filterCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFilterCategory(cat.id)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${isActive
                                            ? 'bg-common text-white shadow-xs font-semibold'
                                            : 'bg-bg text-res hover:text-text hover:bg-border'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Activity Timeline ── */}
                {filteredActivities.length === 0 ? (
                    <div className="bg-bg border border-border rounded p-12 text-center shadow-xs">
                        <div className="size-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <RiTimeLine size={32} />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">
                            {__('No Activity Found')}
                        </h3>
                        <p className="text-xs text-res max-w-md mx-auto">
                            {__('There are no activity logs matching this filter category.')}
                        </p>
                    </div>
                ) : (
                    <div className="bg-bg border border-border rounded shadow-xs p-5">
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                            {filteredActivities.map((act) => {
                                const { icon: Icon, color } = getCategoryIcon(act.category);
                                return (
                                    <div key={act.id} className="relative flex items-start gap-4 text-xs group">
                                        {/* Dot Indicator */}
                                        <div className={`absolute -left-6 top-1 size-5 rounded-full flex items-center justify-center shadow-xs border border-border ${color}`}>
                                            <Icon size={11} />
                                        </div>

                                        <div className="flex-1 bg-bg/50 group-hover:bg-bg p-3.5 rounded border border-border transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-text text-sm">
                                                        {act.title}
                                                    </span>
                                                </div>

                                                <span className="text-[11px] text-res font-medium">
                                                    {act.date_formatted} ({act.time_ago})
                                                </span>
                                            </div>

                                            {act.detail && <p className="mt-1 text-xs text-res">{act.detail}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Security & Privacy Notice Card ── */}
                <div className="bg-bg border border-border rounded p-4 shadow-xs flex items-start gap-3 text-xs text-res">
                    <RiInformationLine size={20} className="text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-text text-xs mb-0.5">
                            {__('Privacy & Session Security')}
                        </h4>
                        <p className="leading-relaxed">
                            {__('Only meaningful product, order, review, and account actions appear here. Sensitive information is not stored in activity details.')}
                        </p>
                    </div>
                </div>
            </div>
        </ProfileLayout>
    );
}
