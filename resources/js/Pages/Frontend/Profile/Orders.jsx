import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ProfileLayout from './ProfileLayout';
import {
    RiShoppingBag3Line,
    RiTimeLine,
    RiCheckLine,
    RiCloseLine,
    RiEyeLine,
    RiSearchLine,
    RiFilterLine,
    RiPrinterLine,
    RiArrowRightLine,
    RiTruckLine,
    RiCalendarLine,
    RiMoneyDollarCircleLine,
    RiCustomerService2Line,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function Orders({ profile, orders = [], current_status = 'all' }) {
    const { __ } = useLang();
    const { setting } = usePage().props;
    const currency = setting?.currency_symbol || '$';

    const [statusFilter, setStatusFilter] = useState(current_status);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModalOrder, setActiveModalOrder] = useState(null);

    const stats = profile?.stats || {};

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

    // Filter orders locally for fast and fluid UX
    const filteredOrders = orders.filter((order) => {
        const matchesStatus =
            statusFilter === 'all' || (order.status || '').toLowerCase() === statusFilter.toLowerCase();

        const query = searchQuery.trim().toLowerCase();
        if (!query) return matchesStatus;

        const matchesId =
            order.order_number.toLowerCase().includes(query) ||
            String(order.id).includes(query);

        const matchesProduct = (order.items || []).some((i) =>
            (i.product_title || '').toLowerCase().includes(query)
        );

        return matchesStatus && (matchesId || matchesProduct);
    });

    const statusTabs = [
        { id: 'all', label: __('All Orders'), count: stats.total_orders || orders.length },
        { id: 'pending', label: __('Pending'), count: stats.pending_orders || 0 },
        { id: 'completed', label: __('Completed'), count: stats.completed_orders || 0 },
        { id: 'cancelled', label: __('Cancelled'), count: stats.cancelled_orders || 0 },
    ];

    return (
        <ProfileLayout title={__('My Orders')} currentTab="orders" profile={profile}>
            <div className="space-y-6">
                {/* ── Top Header & Filter Controls ── */}
                <div className="bg-bg border border-border rounded p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                            <h1 className="text-lg font-bold text-text">
                                {__('Order History & Tracking')}
                            </h1>
                            <p className="text-xs text-res mt-0.5">
                                {__('View and track your previous purchases and item shipments.')}
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <RiSearchLine
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-res"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={__('Search order # or item...')}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg border border-border rounded text-text placeholder:text-res/60 focus:outline-hidden focus:border-primary transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-res hover:text-text cursor-pointer"
                                >
                                    <RiCloseLine size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-border pb-2">
                        {statusTabs.map((tab) => {
                            const isActive = statusFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${isActive
                                            ? 'bg-common text-white shadow-xs font-semibold'
                                            : 'bg-bg text-res hover:text-text hover:bg-border'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-border text-res'
                                            }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Orders Listing ── */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-bg border border-border rounded p-12 text-center shadow-xs">
                        <div className="size-14 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <RiShoppingBag3Line size={28} />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">
                            {__('No Orders Found')}
                        </h3>
                        <p className="text-xs text-res max-w-md mx-auto mb-5">
                            {searchQuery
                                ? __('No orders match your search query. Try searching with a different term.')
                                : __('You have no orders in this status category.')}
                        </p>
                        <Link
                            href={route('index')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-common text-white rounded hover:opacity-90 transition-opacity"
                        >
                            <RiShoppingBag3Line size={14} />
                            {__('Explore Products')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-bg border border-border rounded shadow-xs overflow-hidden transition-all hover:border-primary/40"
                            >
                                {/* Order Header */}
                                <div className="bg-bg/50 px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-text text-sm">
                                            {order.order_number}
                                        </span>
                                        <span className="text-res">&bull;</span>
                                        <span className="text-res flex items-center gap-1">
                                            <RiCalendarLine size={14} />
                                            {order.order_date}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(order.status)}
                                        <span className="text-res text-[11px]">
                                            {order.payment_method} ({order.payment_status})
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="p-5 divide-y divide-border">
                                    {order.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.product_title}
                                                        className="size-14 rounded object-cover border border-border shrink-0"
                                                    />
                                                ) : (
                                                    <div className="size-14 rounded bg-bg flex items-center justify-center text-res border border-border shrink-0">
                                                        <RiShoppingBag3Line size={20} />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <a
                                                        href={item.product_url}
                                                        className="text-xs font-semibold text-text hover:text-primary transition-colors line-clamp-1"
                                                    >
                                                        {item.product_title}
                                                    </a>
                                                    {item.product_sku && (
                                                        <span className="text-[11px] text-res block">
                                                            SKU: {item.product_sku}
                                                        </span>
                                                    )}
                                                    {item.color && (
                                                        <span className="text-[11px] text-res block">
                                                            {__('Color')}: {item.color}
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-res font-medium">
                                                        {currency} {item.unit_price.toLocaleString()} &times; {item.quantity}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="text-xs font-bold text-text">
                                                    {currency} {item.subtotal.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Footer Bar */}
                                <div className="bg-bg/30 px-5 py-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-res">{__('Order Total:')}</span>
                                        <span className="font-bold text-sm text-primary">
                                            {currency} {order.total_price.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveModalOrder(order)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-bg hover:bg-border text-text rounded border border-border transition-colors cursor-pointer"
                                        >
                                            <RiEyeLine size={14} />
                                            {__('View Details')}
                                        </button>
                                        <a
                                            href={order.items?.[0]?.product_url || route('index')}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-common hover:opacity-90 text-white rounded transition-opacity"
                                        >
                                            {__('Buy Again')}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Comprehensive Order Receipt Modal ── */}
            {activeModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-bg border border-border rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
                        {/* Receipt Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-res block">
                                    {__('Order Invoice & Tracking')}
                                </span>
                                <h3 className="font-bold text-text text-lg">
                                    {activeModalOrder.order_number}
                                </h3>
                                <p className="text-xs text-res">
                                    {__('Placed on')} {activeModalOrder.order_date}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    title={__('Print Receipt')}
                                    className="p-2 rounded hover:bg-bg text-res hover:text-text cursor-pointer border border-border"
                                >
                                    <RiPrinterLine size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveModalOrder(null)}
                                    className="p-2 rounded hover:bg-bg text-res hover:text-text cursor-pointer border border-border"
                                >
                                    <RiCloseLine size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Order Timeline Visualizer */}
                        <div className="mb-6 bg-bg p-4 rounded border border-border">
                            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">
                                {__('Delivery Progress')}
                            </h4>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                <div className="space-y-1">
                                    <div className="size-6 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                                        ✓
                                    </div>
                                    <span className="font-semibold text-text text-[11px] block">{__('Confirmed')}</span>
                                    <span className="text-[10px] text-res">{activeModalOrder.order_date}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="size-6 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                                        ✓
                                    </div>
                                    <span className="font-semibold text-text text-[11px] block">{__('Processing')}</span>
                                    <span className="text-[10px] text-res">{__('Warehouse')}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className={`size-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${activeModalOrder.status === 'completed'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-amber-400 text-white'
                                        }`}>
                                        <RiTruckLine size={13} />
                                    </div>
                                    <span className="font-semibold text-text text-[11px] block">{__('In Transit')}</span>
                                    <span className="text-[10px] text-res">{__('Carrier')}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className={`size-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${activeModalOrder.status === 'completed'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-border text-res'
                                        }`}>
                                        ★
                                    </div>
                                    <span className="font-semibold text-text text-[11px] block">{__('Delivered')}</span>
                                    <span className="text-[10px] text-res">
                                        {activeModalOrder.completed_date || __('Pending')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Order & Payment Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
                            <div className="bg-bg p-3.5 rounded border border-border">
                                <span className="text-res font-medium block text-[11px] mb-1">
                                    {__('Payment Information')}
                                </span>
                                <div className="space-y-1 text-text">
                                    <p>
                                        <span className="text-res">{__('Method')}:</span>{' '}
                                        <span className="font-semibold capitalize">{activeModalOrder.payment_method}</span>
                                    </p>
                                    <p>
                                        <span className="text-res">{__('Status')}:</span>{' '}
                                        <span className="font-semibold text-emerald-600 capitalize">{activeModalOrder.payment_status}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-bg p-3.5 rounded border border-border">
                                <span className="text-res font-medium block text-[11px] mb-1">
                                    {__('Customer Information')}
                                </span>
                                <div className="space-y-1 text-text">
                                    <p className="font-semibold">{profile?.user?.name}</p>
                                    <p className="text-res">{profile?.user?.email}</p>
                                    {profile?.user?.meta?.phone && (
                                        <p className="text-res">{profile?.user?.meta?.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Item Details Table */}
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-2">
                                {__('Items Purchased')}
                            </h4>
                            <div className="border border-border rounded divide-y divide-border text-xs">
                                {activeModalOrder.items?.map((item) => (
                                    <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.product_title}
                                                    className="size-12 rounded object-cover border border-border shrink-0"
                                                />
                                            ) : (
                                                <div className="size-12 rounded bg-bg flex items-center justify-center text-res shrink-0">
                                                    <RiShoppingBag3Line size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-text">{item.product_title}</p>
                                                {item.color && (
                                                    <span className="text-[11px] text-res block">{__('Color')}: {item.color}</span>
                                                )}
                                                <span className="text-[11px] text-res">
                                                    {currency} {item.unit_price.toLocaleString()} &times; {item.quantity}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="font-bold text-text">
                                            {currency} {item.subtotal.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="bg-bg p-4 rounded border border-border space-y-2 text-xs">
                            <div className="flex justify-between text-res">
                                <span>{__('Subtotal')}</span>
                                <span>{currency} {activeModalOrder.total_price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-res">
                                <span>{__('Shipping')}</span>
                                <span className="text-emerald-600 font-semibold">{__('Free Shipping')}</span>
                            </div>
                            <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-text">
                                <span>{__('Total Paid')}</span>
                                <span className="text-primary text-base">
                                    {currency} {activeModalOrder.total_price.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="mt-6 flex justify-between items-center">
                            <Link
                                href="/faqs"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <RiCustomerService2Line size={14} />
                                {__('Questions about this order?')}
                            </Link>

                            <button
                                type="button"
                                onClick={() => setActiveModalOrder(null)}
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
