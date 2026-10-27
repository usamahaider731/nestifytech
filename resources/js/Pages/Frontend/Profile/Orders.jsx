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
    RiAlertLine,
    RiRefund2Line,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'react-toastify';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function Orders({ profile, orders = [], current_status = 'all' }) {
    const { __ } = useLang();
    const { setting } = usePage().props;
    const currency = setting?.site?.currency?.value || setting?.currency_symbol || 'PKR';

    const [statusFilter, setStatusFilter] = useState(current_status);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModalOrder, setActiveModalOrder] = useState(null);
    const [cancelModalOrder, setCancelModalOrder] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // Cancellation fee percentage from site settings (default 5%)
    const cancellationFeePercent = parseFloat(setting?.site?.order_cancellation_fee?.value ?? 5);

    const stats = profile?.stats || {};

    const handleCancelOrder = async (orderId) => {
        setCancelling(true);
        try {
            const res = await axios.post(`/api/orders/${orderId}/cancel`);
            if (res.data?.success) {
                toast.success(res.data.message || __('Order cancelled successfully!'));
                setCancelModalOrder(null);
                setActiveModalOrder(null);
                router.reload({ preserveScroll: true });
            } else {
                toast.error(res.data?.message || __('Failed to cancel order.'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || __('Error cancelling order.'));
        } finally {
            setCancelling(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <RiCheckLine size={12} /> {__('Completed')}
                </span>
            );
        }
        if (s === 'delivered') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <RiCheckLine size={12} /> {__('Delivered')}
                </span>
            );
        }
        if (s === 'shipped') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <RiTruckLine size={12} /> {__('Shipped')}
                </span>
            );
        }
        if (s === 'processing') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <RiTimeLine size={12} /> {__('Processing')}
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
        { id: 'processing', label: __('Processing'), count: orders.filter(o => o.status === 'processing').length },
        { id: 'shipped', label: __('In Transit'), count: orders.filter(o => o.status === 'shipped').length },
        { id: 'delivered', label: __('Delivered'), count: orders.filter(o => o.status === 'delivered').length },
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
                                    className={`flex items-center gap-2 group px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${isActive
                                        ? 'bg-secondary text-white shadow-xs font-semibold'
                                        : 'bg-bg text-res hover:text-text hover:bg-secondary'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-border text-res group-hover:bg-white'
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
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-secondary text-white rounded hover:opacity-90 transition-opacity"
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
                                        {order.status === 'pending' && (
                                            <button
                                                type="button"
                                                onClick={() => setCancelModalOrder(order)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 rounded border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                                            >
                                                <RiCloseLine size={14} />
                                                {__('Cancel Order')}
                                            </button>
                                        )}
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
                            {activeModalOrder.status === 'cancelled' ? (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-center text-xs text-rose-700">
                                    <span className="font-bold block">{__('Order Cancelled')}</span>
                                    {activeModalOrder.cancelled_date && <span>{activeModalOrder.cancelled_date}</span>}
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                    <div className="space-y-1">
                                        <div className="size-6 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                                            ✓
                                        </div>
                                        <span className="font-semibold text-text text-[11px] block">{__('Confirmed')}</span>
                                        <span className="text-[10px] text-res">{activeModalOrder.order_date}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`size-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${['processing', 'shipped', 'delivered', 'completed'].includes((activeModalOrder.status || '').toLowerCase())
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-border text-res'
                                            }`}>
                                            {['processing', 'shipped', 'delivered', 'completed'].includes((activeModalOrder.status || '').toLowerCase()) ? '✓' : '•'}
                                        </div>
                                        <span className="font-semibold text-text text-[11px] block">{__('Processing')}</span>
                                        <span className="text-[10px] text-res">{__('Warehouse')}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`size-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${['shipped', 'delivered', 'completed'].includes((activeModalOrder.status || '').toLowerCase())
                                            ? 'bg-emerald-500 text-white'
                                            : (activeModalOrder.status || '').toLowerCase() === 'processing'
                                                ? 'bg-amber-400 text-white'
                                                : 'bg-border text-res'
                                            }`}>
                                            <RiTruckLine size={13} />
                                        </div>
                                        <span className="font-semibold text-text text-[11px] block">{__('In Transit')}</span>
                                        <span className="text-[10px] text-res">{activeModalOrder.shipping_carrier || __('Carrier')}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`size-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${['delivered', 'completed'].includes((activeModalOrder.status || '').toLowerCase())
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-border text-res'
                                            }`}>
                                            ★
                                        </div>
                                        <span className="font-semibold text-text text-[11px] block">{__('Delivered')}</span>
                                        <span className="text-[10px] text-res">
                                            {activeModalOrder.completed_date || (['delivered', 'completed'].includes((activeModalOrder.status || '').toLowerCase()) ? __('Delivered') : __('Pending'))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tracking Number Banner */}
                        {activeModalOrder.tracking_number && (
                            <div className="mb-5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 rounded p-4 flex items-center gap-3">
                                <div className="size-9 shrink-0 bg-sky-100 dark:bg-sky-900/40 rounded-full flex items-center justify-center">
                                    <RiTruckLine size={18} className="text-sky-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] text-sky-600 font-semibold block">{__('Tracking Number')}</span>
                                    <span className="font-mono font-bold text-sm text-sky-800 dark:text-sky-300 tracking-widest">
                                        {activeModalOrder.tracking_number}
                                    </span>
                                    {activeModalOrder.shipping_carrier && (
                                        <span className="text-[11px] text-sky-500 block">{__('via')} {activeModalOrder.shipping_carrier}</span>
                                    )}
                                </div>
                            </div>
                        )}

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
                                    {/* Show phone from customer_notes if available */}
                                    {activeModalOrder.customer_notes?.startsWith('Contact Phone:') && (
                                        <p className="text-res">
                                            {activeModalOrder.customer_notes.replace('Contact Phone:', '').trim()}
                                        </p>
                                    )}
                                    {activeModalOrder.shipping_address && (
                                        <p className="text-[11px] text-res leading-tight mt-1">
                                            📍 {activeModalOrder.shipping_address}
                                            {activeModalOrder.shipping_city ? `, ${activeModalOrder.shipping_city}` : ''}
                                        </p>
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
                        {(() => {
                            const itemsSum = (activeModalOrder.items || []).reduce((acc, curr) => acc + (Number(curr.subtotal) || (Number(curr.unit_price) * Number(curr.quantity)) || 0), 0);
                            const orderTotal = Number(activeModalOrder.total_price) || 0;
                            const derivedShipping = Math.max(0, orderTotal - itemsSum);

                            return (
                                <div className="bg-bg p-4 rounded border border-border space-y-2 text-xs">
                                    <div className="flex justify-between text-res">
                                        <span>{__('Subtotal')}</span>
                                        <span>{currency} {(itemsSum > 0 ? itemsSum : orderTotal).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-res">
                                        <span>{__('Shipping')}</span>
                                        {derivedShipping > 0 ? (
                                            <span className="font-semibold text-text">{currency} {derivedShipping.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-emerald-600 font-semibold">{__('Free Shipping')}</span>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-text">
                                        <span>{__('Total')}</span>
                                        <span className="text-primary text-base">
                                            {currency} {orderTotal.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Modal Action Buttons */}
                        <div className="mt-6 flex justify-between items-center">
                            <Link
                                href="/faqs"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <RiCustomerService2Line size={14} />
                                {__('Questions about this order?')}
                            </Link>

                            <div className="flex items-center gap-2">
                                {activeModalOrder.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCancelModalOrder(activeModalOrder);
                                            setActiveModalOrder(null);
                                        }}
                                        className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer"
                                    >
                                        {__('Cancel This Order')}
                                    </button>
                                )}
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
                </div>
            )}

            {/* ── Cancel Order Confirmation Modal with Fee Breakdown ── */}
            {cancelModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-bg border border-border rounded max-w-md w-full shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <h3 className="font-bold text-text text-base flex items-center gap-2 text-rose-600">
                                <RiAlertLine size={18} />
                                {__('Cancel Order Confirmation')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setCancelModalOrder(null)}
                                className="p-1.5 rounded hover:bg-bg text-res hover:text-text cursor-pointer"
                            >
                                <RiCloseLine size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-res leading-relaxed">
                            {__('Are you sure you want to cancel order')} <strong className="text-text">{cancelModalOrder.order_number}</strong>?
                        </p>

                        {/* If already paid, show transparent deduction breakdown */}
                        {cancelModalOrder.payment_status === 'paid' || cancelModalOrder.payment_method === 'card' ? (
                            <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded p-4 space-y-2.5 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                                    <RiRefund2Line size={16} />
                                    <span>{__('Refund & Cancellation Policy')}</span>
                                </div>

                                <div className="space-y-1.5 pt-1 text-res border-t border-rose-200/60 dark:border-rose-900/40">
                                    <div className="flex justify-between">
                                        <span>{__('Total Paid Amount:')}</span>
                                        <span className="font-semibold text-text">
                                            {currency} {Number(cancelModalOrder.total_price).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                        <span>{__('Cancellation Fee')} ({cancellationFeePercent}%):</span>
                                        <span className="font-semibold">
                                            - {currency} {(Number(cancelModalOrder.total_price) * (cancellationFeePercent / 100)).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between pt-1.5 border-t border-rose-200/60 dark:border-rose-900/40 text-emerald-600 font-bold text-sm">
                                        <span>{__('Refund to Your Account:')}</span>
                                        <span>
                                            {currency} {(Number(cancelModalOrder.total_price) * (1 - cancellationFeePercent / 100)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-res leading-tight pt-1">
                                    {__('The remaining balance will be credited back to your original payment method automatically.')}
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded text-xs text-amber-800 dark:text-amber-300">
                                {__('This is an unpaid / cash on delivery order. No charges have been made and stock will be restored.')}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                            <button
                                type="button"
                                disabled={cancelling}
                                onClick={() => setCancelModalOrder(null)}
                                className="px-4 py-2 text-xs font-medium bg-bg hover:bg-border text-text rounded border border-border transition-colors cursor-pointer"
                            >
                                {__('Keep Order')}
                            </button>
                            <button
                                type="button"
                                disabled={cancelling}
                                onClick={() => handleCancelOrder(cancelModalOrder.id)}
                                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                                {cancelling ? __('Cancelling...') : __('Confirm Cancellation')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProfileLayout>
    );
}
