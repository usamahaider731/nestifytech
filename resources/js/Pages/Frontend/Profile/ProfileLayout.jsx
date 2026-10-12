import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import {
    RiDashboardLine,
    RiShoppingBag3Line,
    RiHeart3Line,
    RiStarLine,
    RiTimeLine,
    RiSettings3Line,
    RiShieldUserLine,
    RiLogoutBoxRLine,
    RiArrowRightSLine,
    RiCustomerService2Line,
    RiQuestionLine,
    RiUserLine,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function ProfileLayout({ children, title = 'My Account', currentTab = 'overview', profile }) {
    const { __ } = useLang();
    const { post } = useForm();
    const { auth } = usePage().props;

    // Use profile passed from controller or fallback to auth.user
    const user = profile?.user || auth?.user || {};
    const stats = profile?.stats || {
        total_orders: 0,
        wishlist_count: 0,
        reviews_count: 0,
        activities_count: 0,
    };

    const handleLogout = (e) => {
        e.preventDefault();
        post(route('logout'));
    };

    const navItems = [
        {
            id: 'overview',
            label: __('Overview'),
            href: route('profile.index'),
            icon: RiDashboardLine,
            badge: null,
        },
        {
            id: 'orders',
            label: __('My Orders'),
            href: route('profile.orders'),
            icon: RiShoppingBag3Line,
            badge: stats.total_orders > 0 ? stats.total_orders : null,
        },
        {
            id: 'wishlist',
            label: __('Wishlist'),
            href: route('profile.wishlist'),
            icon: RiHeart3Line,
            badge: stats.wishlist_count > 0 ? stats.wishlist_count : null,
        },
        {
            id: 'reviews',
            label: __('My Reviews'),
            href: route('profile.reviews'),
            icon: RiStarLine,
            badge: stats.reviews_count > 0 ? stats.reviews_count : null,
        },
        {
            id: 'activity',
            label: __('Activity Log'),
            href: route('profile.activity'),
            icon: RiTimeLine,
            badge: stats.activities_count > 0 ? stats.activities_count : null,
        },
        {
            id: 'settings',
            label: __('Settings'),
            href: route('profile.settings'),
            icon: RiSettings3Line,
            badge: null,
        },
    ];

    const avatarSrc = user.avatar || '/assets/image/profile-avatar.webp';

    return (
        <FrontendLayout title={title}>
            {/* ── Breadcrumb Bar ── */}
            <div className="bg-bg border-b border-border py-3">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="flex items-center text-xs text-res space-x-2">
                        <Link href={route('index')} className="hover:text-primary transition-colors">
                            {__('Home')}
                        </Link>
                        <RiArrowRightSLine size={14} className="text-res/60" />
                        <Link href={route('profile.index')} className="hover:text-primary transition-colors">
                            {__('My Account')}
                        </Link>
                        <RiArrowRightSLine size={14} className="text-res/60" />
                        <span className="font-semibold text-text capitalize">
                            {title}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Main Profile Container ── */}
            <div className="py-6 lg:py-10 bg-white min-h-[70vh]">
                <div className="container mx-auto px-4 lg:px-6">
                    {/* ── Mobile Tab Navigation Bar ── */}
                    <div className="lg:hidden mb-6 overflow-x-auto scrollbar-none pb-2">
                        <div className="flex items-center gap-2 min-w-max bg-bg p-1.5 rounded border border-border">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentTab === item.id;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded transition-all ${
                                            isActive
                                                ? 'bg-common text-white shadow-sm'
                                                : 'text-text hover:bg-bg hover:text-primary'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                        {item.badge !== null && (
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-primary/10 text-primary'
                                                }`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        {/* ── Left Sidebar ── */}
                        <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
                            {/* User Profile Card */}
                            <div className="bg-bg border border-border rounded p-5 text-center shadow-xs">
                                <div className="relative inline-block mx-auto mb-3">
                                    <img
                                        src={avatarSrc}
                                        alt={user.name || 'User'}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/assets/image/profile-avatar.webp';
                                        }}
                                        className="size-20 rounded-full object-cover border-2 border-border p-0.5 mx-auto shadow-sm"
                                    />
                                    <Link
                                        href={route('profile.settings')}
                                        title={__('Change Photo')}
                                        className="absolute bottom-0 right-0 bg-common text-white size-6 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm text-xs"
                                    >
                                        <RiUserLine size={12} />
                                    </Link>
                                </div>
                                <h3 className="font-semibold text-text text-base truncate">
                                    {user.name || __('Valued Customer')}
                                </h3>
                                <p className="text-xs text-res truncate mb-2">
                                    {user.email || ''}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded">
                                        {user.role_name || __('Customer')}
                                    </span>
                                    {user.member_since && (
                                        <span className="text-[11px] text-res">
                                            {__('Joined')} {user.member_since}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar Menu */}
                            <div className="bg-bg border border-border rounded overflow-hidden shadow-xs">
                                <div className="px-4 py-3 border-b border-border bg-bg/50">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-res">
                                        {__('Account Navigation')}
                                    </span>
                                </div>
                                <nav className="p-2 space-y-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = currentTab === item.id;
                                        return (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded transition-all ${
                                                    isActive
                                                        ? 'bg-common text-white shadow-xs'
                                                        : 'text-text hover:bg-bg hover:text-primary'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} className={isActive ? 'text-white' : 'text-res'} />
                                                    <span>{item.label}</span>
                                                </div>
                                                {item.badge !== null && (
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                            isActive
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-primary/10 text-primary'
                                                        }`}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}

                                    {/* Admin Link if admin user */}
                                    {user.is_admin && (
                                        <a
                                            href={route('admin.dashboard')}
                                            className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <RiShieldUserLine size={18} />
                                                <span>{__('Admin Portal')}</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 uppercase bg-amber-100 text-amber-700 rounded">
                                                {__('Staff')}
                                            </span>
                                        </a>
                                    )}

                                    <div className="pt-2 mt-2 border-t border-border">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-all text-left cursor-pointer"
                                        >
                                            <RiLogoutBoxRLine size={18} />
                                            <span>{__('Log Out')}</span>
                                        </button>
                                    </div>
                                </nav>
                            </div>

                            {/* Help & Support Widget */}
                            <div className="bg-bg border border-border rounded p-4 shadow-xs">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded shrink-0">
                                        <RiCustomerService2Line size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-text mb-1">
                                            {__('Need Assistance?')}
                                        </h4>
                                        <p className="text-[11px] text-res leading-relaxed mb-3">
                                            {__('Our support team is available 24/7 to help you with your orders and questions.')}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs">
                                            <Link
                                                href={route('faqs')}
                                                className="text-primary hover:underline flex items-center gap-1 font-medium"
                                            >
                                                <RiQuestionLine size={14} />
                                                {__('FAQs')}
                                            </Link>
                                            <span className="text-border">|</span>
                                            <Link
                                                href="/page/contact-us"
                                                className="text-primary hover:underline font-medium"
                                            >
                                                {__('Contact Us')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* ── Main Content Area ── */}
                        <main className="lg:col-span-8 xl:col-span-9 min-w-0">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}
