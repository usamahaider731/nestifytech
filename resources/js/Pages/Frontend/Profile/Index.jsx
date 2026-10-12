import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ProfileLayout from './ProfileLayout';
import {
    RiShoppingBag3Line,
    RiHeart3Line,
    RiStarLine,
    RiMoneyDollarCircleLine,
    RiArrowRightLine,
    RiTimeLine,
    RiSettings3Line,
    RiEyeLine,
    RiCheckLine,
    RiCloseLine,
    RiTruckLine,
    RiMapPinLine,
    RiFileTextLine,
    RiInformationLine,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function Index({ profile, recent_orders = [], recent_activities = [], recent_reviews = [] }) {
    const { __ } = useLang();
    const { setting } = usePage().props;
    const currency = setting?.currency_symbol || '$';

    const user = profile?.user || {};
    const stats = profile?.stats || {};

    const [selectedOrder, setSelectedOrder] = useState(null);

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <RiCheckLine size={12} /> {__('Completed')}
                </span>
            );
        }
        if (s === 'cancelled') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <RiCloseLine size={12} /> {__('Cancelled')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <RiTimeLine size={12} /> {__('Pending')}
            </span>
        );
    };

    return (
        <ProfileLayout title={__('Dashboard')} currentTab="overview" profile={profile}>
            <div className="space-y-6">
                {/* ── Welcome Banner ── */}
                <div className="bg-bg border border-border rounded p-6 shadow-xs relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 block">
                                {__('Account Overview')}
                            </span>
                            <h1 className="text-xl md:text-2xl font-bold text-text">
                                {__('Welcome back,')} {user.name || __('Customer')}!
                            </h1>
                            <p className="text-sm text-res mt-1 max-w-xl">
                                {__('From your profile dashboard you can easily view your recent orders, manage shipping addresses, track deliveries, and update your personal settings.')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href={route('profile.settings')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-bg hover:bg-border text-text rounded border border-border transition-colors"
                            >
                                <RiSettings3Line size={14} />
                                {__('Edit Profile')}
                            </Link>
                            <Link
                                href={route('index')}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-common hover:opacity-90 text-white rounded shadow-xs transition-opacity"
                            >
                                <RiShoppingBag3Line size={14} />
                                {__('Shop Now')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Stat Metric Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Orders */}
                    <div className="bg-bg border border-border rounded p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-res">{__('Total Orders')}</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                <RiShoppingBag3Line size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-text">
                            {stats.total_orders || 0}
                        </div>
                        <div className="text-[11px] text-res mt-1">
                            {stats.pending_orders || 0} {__('pending')}, {stats.completed_orders || 0} {__('delivered')}
                        </div>
                    </div>

                    {/* Total Spent */}
                    <div className="bg-bg border border-border rounded p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-res">{__('Total Spent')}</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
                                <RiMoneyDollarCircleLine size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-text">
                            {currency} {(stats.total_spent || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-res mt-1">
                            {__('Across all purchases')}
                        </div>
                    </div>

                    {/* Wishlist */}
                    <div className="bg-bg border border-border rounded p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-res">{__('Wishlist')}</span>
                            <div className="p-2 bg-rose-50 text-rose-600 rounded">
                                <RiHeart3Line size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-text">
                            {stats.wishlist_count || 0}
                        </div>
                        <div className="text-[11px] text-res mt-1">
                            <Link href={route('profile.wishlist')} className="text-primary hover:underline">
                                {__('View saved items')} &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-bg border border-border rounded p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-res">{__('My Reviews')}</span>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded">
                                <RiStarLine size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-text">
                            {stats.reviews_count || 0}
                        </div>
                        <div className="text-[11px] text-res mt-1">
                            <Link href={route('profile.reviews')} className="text-primary hover:underline">
                                {__('View product reviews')} &rarr;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Recent Orders Section ── */}
                <div className="bg-bg border border-border rounded shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-text">
                                {__('Recent Orders')}
                            </h2>
                            <p className="text-xs text-res">
                                {__('Track status and review your recent shopping history.')}
                            </p>
                        </div>
                        <Link
                            href={route('profile.orders')}
                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                            {__('View All Orders')} <RiArrowRightLine size={14} />
                        </Link>
                    </div>

                    {recent_orders.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <RiShoppingBag3Line size={24} />
                            </div>
                            <h4 className="text-sm font-semibold text-text mb-1">{__('No Orders Placed Yet')}</h4>
                            <p className="text-xs text-res max-w-sm mx-auto mb-4">
                                {__('You haven\'t placed any orders yet. Discover our catalog of premium products and start shopping!')}
                            </p>
                            <Link
                                href={route('index')}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-common text-white rounded hover:opacity-90 transition-opacity"
                            >
                                {__('Start Shopping')}
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-bg/60 border-b border-border text-res font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="px-5 py-3">{__('Order #')}</th>
                                        <th className="px-5 py-3">{__('Date')}</th>
                                        <th className="px-5 py-3">{__('Items')}</th>
                                        <th className="px-5 py-3">{__('Status')}</th>
                                        <th className="px-5 py-3">{__('Payment')}</th>
                                        <th className="px-5 py-3">{__('Total')}</th>
                                        <th className="px-5 py-3 text-right">{__('Action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recent_orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-bg/40 transition-colors">
                                            <td className="px-5 py-3.5 font-semibold text-text">
                                                {order.order_number}
                                            </td>
                                            <td className="px-5 py-3.5 text-res">
                                                {order.order_date}
                                            </td>
                                            <td className="px-5 py-3.5 text-res">
                                                {order.items_count} {order.items_count === 1 ? __('item') : __('items')}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="px-5 py-3.5 text-res">
                                                <span className="font-medium text-text capitalize">{order.payment_method}</span>
                                                <span className="text-[11px] text-res block">{order.payment_status}</span>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-text">
                                                {currency} {order.total_price.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-bg hover:bg-border text-text rounded border border-border transition-colors cursor-pointer"
                                                >
                                                    <RiEyeLine size={13} /> {__('Details')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Two Column: Recent Activity & Quick Shortcuts ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Timeline Preview */}
                    <div className="bg-bg border border-border rounded shadow-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-text">
                                    {__('Recent Activity')}
                                </h3>
                                <p className="text-[11px] text-res">
                                    {__('Recent interactions and account events.')}
                                </p>
                            </div>
                            <Link
                                href={route('profile.activity')}
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                            >
                                {__('View Log')} <RiArrowRightLine size={14} />
                            </Link>
                        </div>
                        <div className="p-5">
                            {recent_activities.length === 0 ? (
                                <p className="text-xs text-res text-center py-4">
                                    {__('No recent activity recorded.')}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {recent_activities.slice(0, 5).map((act) => (
                                        <div key={act.id} className="flex items-start gap-3 text-xs">
                                            <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-text truncate">
                                                    {act.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-res mt-0.5">
                                                    <span>{act.time_ago}</span>
                                                    <span>&bull;</span>
                                                    <span>{act.browser}</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-bg text-res border border-border">
                                                {act.method}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Shortcuts & Account Details */}
                    <div className="bg-bg border border-border rounded shadow-xs p-5 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-text mb-1">
                                {__('Account Shortcuts')}
                            </h3>
                            <p className="text-xs text-res mb-4">
                                {__('Frequently accessed account features and options.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href={route('profile.orders')}
                                className="p-3 bg-bg hover:bg-border/60 rounded border border-border transition-colors block"
                            >
                                <RiTruckLine size={20} className="text-primary mb-1.5" />
                                <h4 className="text-xs font-semibold text-text">{__('Track Orders')}</h4>
                                <p className="text-[11px] text-res">{__('Check delivery status')}</p>
                            </Link>

                            <Link
                                href={route('profile.wishlist')}
                                className="p-3 bg-bg hover:bg-border/60 rounded border border-border transition-colors block"
                            >
                                <RiHeart3Line size={20} className="text-rose-500 mb-1.5" />
                                <h4 className="text-xs font-semibold text-text">{__('Wishlist')}</h4>
                                <p className="text-[11px] text-res">{__('Saved favorite items')}</p>
                            </Link>

                            <Link
                                href={route('profile.settings')}
                                className="p-3 bg-bg hover:bg-border/60 rounded border border-border transition-colors block"
                            >
                                <RiMapPinLine size={20} className="text-emerald-500 mb-1.5" />
                                <h4 className="text-xs font-semibold text-text">{__('Addresses')}</h4>
                                <p className="text-[11px] text-res">{__('Manage delivery address')}</p>
                            </Link>

                            <Link
                                href={route('faqs')}
                                className="p-3 bg-bg hover:bg-border/60 rounded border border-border transition-colors block"
                            >
                                <RiInformationLine size={20} className="text-amber-500 mb-1.5" />
                                <h4 className="text-xs font-semibold text-text">{__('Help & FAQ')}</h4>
                                <p className="text-[11px] text-res">{__('Answers to common queries')}</p>
                            </Link>
                        </div>

                        {/* User Address Snippet if set */}
                        {user.meta?.address && (
                            <div className="pt-3 border-t border-border">
                                <span className="text-[11px] font-semibold text-res uppercase block mb-1">
                                    {__('Default Shipping Address')}
                                </span>
                                <p className="text-xs text-text">
                                    {user.meta.address}
                                    {user.meta.city ? `, ${user.meta.city}` : ''}
                                    {user.meta.country ? `, ${user.meta.country}` : ''}
                                    {user.meta.postal_code ? ` - ${user.meta.postal_code}` : ''}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Order Detail Modal ── */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-bg border border-border rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6">
                        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                            <div>
                                <h3 className="font-bold text-text text-base">
                                    {__('Order Details')} #{selectedOrder.order_number}
                                </h3>
                                <p className="text-xs text-res">
                                    {__('Placed on')} {selectedOrder.order_date}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="p-1.5 rounded hover:bg-bg text-res hover:text-text cursor-pointer"
                            >
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status & Payment Overview */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-bg p-3.5 rounded text-xs">
                                <div>
                                    <span className="text-res block text-[11px]">{__('Status')}</span>
                                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                                </div>
                                <div>
                                    <span className="text-res block text-[11px]">{__('Payment Method')}</span>
                                    <span className="font-semibold text-text capitalize mt-1 block">
                                        {selectedOrder.payment_method}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-res block text-[11px]">{__('Payment Status')}</span>
                                    <span className="font-semibold text-emerald-600 capitalize mt-1 block">
                                        {selectedOrder.payment_status}
                                    </span>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-2">
                                    {__('Purchased Items')} ({selectedOrder.items?.length || 0})
                                </h4>
                                <div className="divide-y divide-border border border-border rounded">
                                    {selectedOrder.items?.map((item) => (
                                        <div key={item.id} className="p-3 flex items-center gap-3">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.product_title}
                                                    className="size-12 object-cover rounded border border-border shrink-0"
                                                />
                                            ) : (
                                                <div className="size-12 rounded bg-bg flex items-center justify-center text-res shrink-0">
                                                    <RiShoppingBag3Line size={18} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <a
                                                    href={item.product_url}
                                                    className="text-xs font-semibold text-text hover:text-primary transition-colors line-clamp-1"
                                                >
                                                    {item.product_title}
                                                </a>
                                                {item.color && (
                                                    <span className="text-[11px] text-res block">
                                                        {__('Color')}: {item.color}
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-res block">
                                                    {currency} {item.unit_price.toLocaleString()} &times; {item.quantity}
                                                </span>
                                            </div>
                                            <div className="text-right font-bold text-xs text-text">
                                                {currency} {item.subtotal.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Totals */}
                            <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold text-text">
                                <span>{__('Total Amount')}</span>
                                <span className="text-primary text-base">
                                    {currency} {selectedOrder.total_price.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 text-xs font-semibold bg-bg hover:bg-border text-text rounded border border-border transition-colors cursor-pointer"
                            >
                                {__('Close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProfileLayout>
    );
}
