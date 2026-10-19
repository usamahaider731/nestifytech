import AdminLayout from '@/Layouts/AdminLayout'
import axios from 'axios'
import React, { useState } from 'react'
import { router, usePage, Link } from '@inertiajs/react'
import {
    RiTruckLine,
    RiTimeLine,
    RiCheckboxCircleLine,
    RiCloseLine,
    RiErrorWarningLine,
    RiSearchLine,
    RiShoppingBag3Line,
    RiCheckLine,
    RiMoneyDollarCircleLine,
    RiUserLine,
    RiMapPinLine,
    RiLoader4Line,
    RiRefreshLine,
    RiShieldCheckLine,
    RiInformationLine,
    RiMailLine,
    RiPhoneLine,
    RiNavigationLine,
    RiEBike2Line,
    RiWhatsappLine,
    RiArrowRightLine,
    RiCoinsLine,
    RiFileList3Line,
    RiFileCopyLine,
    RiCheckDoubleLine,
    RiBuildingLine,
} from 'react-icons/ri'

/* ─── Toast Notifications ────────────────────────────────────────── */
function useToast() {
    const [toasts, setToasts] = useState([])
    const push = (msg, type = 'success') => {
        const id = Date.now()
        setToasts(p => [...p, { id, msg, type }])
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
    }
    const dismiss = id => setToasts(p => p.filter(t => t.id !== id))
    return { toasts, push, dismiss }
}

function ToastStack({ toasts, dismiss }) {
    if (!toasts.length) return null
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold pointer-events-auto transition-all ${
                        t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                >
                    {t.type === 'success' ? (
                        <RiCheckboxCircleLine className="size-5 shrink-0" />
                    ) : (
                        <RiErrorWarningLine className="size-5 shrink-0" />
                    )}
                    <span className="flex-1 leading-snug">{t.msg}</span>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="text-white/80 hover:text-white p-1 rounded-md"
                    >
                        <RiCloseLine className="size-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}

/* ─── Order OTP Verification & Completion Modal ─────────────────── */
function DeliveryOtpModal({ order, onClose, onSuccess, currency, pushToast }) {
    const [otpCode, setOtpCode] = useState('')
    const [customPhone, setCustomPhone] = useState(order.customer_phone || '')
    const [showPhoneInput, setShowPhoneInput] = useState(!order.customer_phone)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [verifyingOtp, setVerifyingOtp] = useState(false)
    const [activeOtpExists, setActiveOtpExists] = useState(order.has_active_otp)

    const [copied, setCopied] = useState(false)

    const isCod = (order.payment_method || '').toLowerCase().includes('cod') ||
                  (order.payment_method || '').toLowerCase().includes('cash')

    const getOtpMessageTemplate = () => {
        return `📦 *NestifyTech Order #${order.id} Delivery Confirmation*\n\n` +
            `Hello ${order.customer_name || 'Customer'},\n` +
            `Your order total is: *${currency} ${order.total_price?.toLocaleString()}*.\n` +
            `Our delivery rider is here with your package. Please inspect your items and share the 6-digit confirmation code with the rider to complete the delivery.\n\n` +
            `Thank you for shopping with NestifyTech!`
    }

    const handleCopyTemplate = () => {
        navigator.clipboard.writeText(getOtpMessageTemplate())
        setCopied(true)
        pushToast('Order message template copied to clipboard!', 'success')
        setTimeout(() => setCopied(false), 2500)
    }

    // Dispatch WhatsApp OTP to Customer
    const handleSendOtp = async () => {
        setSendingOtp(true)
        try {
            const payload = {}
            if (customPhone.trim()) {
                payload.phone = customPhone.trim()
            }
            const res = await axios.post(route('delivery.orders.send-otp', { id: order.id }), payload)
            if (res.data?.success) {
                setActiveOtpExists(true)
                if (res.data.api_sent) {
                    pushToast(res.data.message || 'OTP dispatched to customer WhatsApp!', 'success')
                } else {
                    pushToast(res.data.message || 'WhatsApp message failed to deliver.', 'error')
                }
            } else if (res.data?.needs_phone) {
                setShowPhoneInput(true)
                pushToast(res.data.message, 'error')
            } else {
                pushToast(res.data?.message || 'Could not send OTP.', 'error')
            }
        } catch (err) {
            if (err.response?.data?.needs_phone) {
                setShowPhoneInput(true)
            }
            pushToast(err.response?.data?.message || 'Failed to dispatch OTP.', 'error')
        } finally {
            setSendingOtp(false)
        }
    }

    // Verify OTP & Complete Order
    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        const code = otpCode.trim()
        if (!code || code.length < 4) {
            pushToast('Please enter the OTP provided by the customer.', 'error')
            return
        }

        setVerifyingOtp(true)
        try {
            const res = await axios.post(route('delivery.orders.verify-otp', { id: order.id }), {
                otp: code,
            })
            if (res.data?.success) {
                pushToast(res.data.message || 'Order successfully marked as Completed!', 'success')
                onSuccess({
                    ...order,
                    status: 'completed',
                    payment_status: 'paid',
                    cod_collected_amount: isCod ? order.total_price : order.cod_collected_amount,
                    office_settlement_status: isCod ? 'unsettled' : order.office_settlement_status,
                })
                onClose()
            } else {
                pushToast(res.data?.message || 'OTP verification failed.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Invalid OTP code. Please verify with customer.', 'error')
        } finally {
            setVerifyingOtp(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-accent rounded-2xl border border-permanent/40 shadow-2xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-permanent/30">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                                <RiShieldCheckLine className="size-5" />
                            </span>
                            <div>
                                <h3 className="font-bold text-base text-heading">Complete Order & Verify OTP</h3>
                                <p className="text-xs text-res font-mono">{order.order_number}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-dynamic text-secondary hover:text-heading transition-colors"
                    >
                        <RiCloseLine className="size-5" />
                    </button>
                </div>

                {/* Amount to Collect Banner */}
                <div className="bg-dynamic/40 border border-permanent/30 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] text-res uppercase tracking-wider font-semibold block">
                            {isCod ? 'Cash to Collect (COD)' : 'Payment Status'}
                        </span>
                        <span className="text-lg font-bold text-primary font-mono">
                            {currency} {order.total_price?.toLocaleString()}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[11px] text-res block">Customer</span>
                        <span className="text-xs font-semibold text-heading truncate max-w-[150px] block">
                            {order.customer_name}
                        </span>
                    </div>
                </div>

                {/* WhatsApp OTP Dispatch Section */}
                <div className="space-y-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                            <RiWhatsappLine className="size-4" />
                            Customer WhatsApp OTP
                        </span>
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                        >
                            {sendingOtp ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiRefreshLine className="size-3.5" />}
                            {sendingOtp ? 'Sending...' : activeOtpExists ? 'Resend WhatsApp OTP' : 'Send WhatsApp OTP'}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleCopyTemplate}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-bg border border-permanent/30 hover:border-emerald-500 text-heading transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                            {copied ? <RiCheckDoubleLine className="size-3.5 text-emerald-500" /> : <RiFileCopyLine className="size-3.5" />}
                            {copied ? 'Copied Template!' : 'Copy Template'}
                        </button>

                        {order.customer_phone && (
                            <a
                                href={`https://wa.me/${order.customer_phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(getOtpMessageTemplate())}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                                <RiWhatsappLine className="size-3.5" />
                                Open WhatsApp Chat
                            </a>
                        )}
                    </div>

                    <p className="text-[11px] text-res leading-relaxed">
                        An automated OTP message is sent directly to customer's WhatsApp, or you can copy the template / open their chat directly. Ask the customer for the 6-digit code after they inspect their package.
                    </p>

                    {showPhoneInput && (
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="text"
                                value={customPhone}
                                onChange={(e) => setCustomPhone(e.target.value)}
                                placeholder="WhatsApp # (e.g. 923001234567)"
                                className="flex-1 px-3 py-1.5 text-xs bg-bg border border-permanent/30 rounded-lg text-heading font-mono focus:outline-hidden focus:border-emerald-500"
                            />
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendingOtp || !customPhone.trim()}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                            >
                                Send
                            </button>
                        </div>
                    )}
                </div>

                {/* OTP Input & Submission Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-heading mb-1.5">
                            Enter Customer OTP Code
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="• • • • • •"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            autoFocus
                            className="w-full px-4 py-3 text-xl tracking-[0.4em] text-center font-mono font-bold bg-bg border-2 border-permanent/40 rounded-xl text-heading focus:outline-hidden focus:border-emerald-500 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                        />
                        {isCod && (
                            <span className="text-[11px] text-amber-500 font-medium block mt-1.5">
                                💰 Confirming this OTP will instantly mark order as Completed and credit {currency}{order.total_price?.toLocaleString()} to your unsettled cash in hand.
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl bg-dynamic hover:bg-dynamic/80 text-heading border border-permanent/30 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={verifyingOtp || otpCode.length < 4}
                            className="flex-1 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {verifyingOtp ? <RiLoader4Line className="animate-spin size-4" /> : <RiCheckLine className="size-4" />}
                            {verifyingOtp ? 'Confirming...' : 'Confirm Delivery'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
function OfficeSettlementModal({ order, onClose, onSuccess, currency, pushToast }) {
    const [requestingOtp, setRequestingOtp] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [settling, setSettling] = useState(false)
    const [currentSettlementOtp, setCurrentSettlementOtp] = useState(order?.office_settlement_otp || '')
    const [officeEmail, setOfficeEmail] = useState('')
    const handleRequestOtp = async () => {
        setRequestingOtp(true)
        try {
            const res = await axios.post(route('delivery.orders.generate-settlement-otp', { id: order.id }))
            if (res.data?.success) {
                setCurrentSettlementOtp(res.data.settlement_otp)
                if (res.data.office_email) setOfficeEmail(res.data.office_email)
                pushToast(res.data.message || 'Settlement OTP sent to office email!', 'success')
            } else {
                pushToast(res.data?.message || 'Failed to generate office settlement OTP.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Error requesting settlement OTP.', 'error')
        } finally {
            setRequestingOtp(false)
        }
    }

    const handleSettle = async (e) => {
        e.preventDefault()
        if (!otpCode.trim()) {
            pushToast('Please enter the 6-digit settlement OTP from the office.', 'error')
            return
        }
        setSettling(true)
        try {
            const res = await axios.post(route('delivery.orders.settle-payment', { id: order.id }), {
                settlement_otp: otpCode.trim(),
            })
            if (res.data?.success) {
                pushToast(res.data.message || 'Cash successfully settled with office!', 'success')
                onSuccess({
                    ...order,
                    office_settlement_status: 'settled',
                })
                onClose()
            } else {
                pushToast(res.data?.message || 'Failed to settle office payment.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Invalid office settlement OTP code.', 'error')
        } finally {
            setSettling(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-accent rounded-2xl border border-permanent/40 shadow-2xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between pb-3 border-b border-permanent/30">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                                <RiBuildingLine className="size-5" />
                            </span>
                            <div>
                                <h3 className="font-bold text-base text-heading">Office Cash Settlement</h3>
                                <p className="text-xs text-res font-mono">{order.order_number}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-dynamic text-secondary hover:text-heading transition-colors"
                    >
                        <RiCloseLine className="size-5" />
                    </button>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] text-amber-600 uppercase tracking-wider font-semibold block">
                            Cash Collected from Customer
                        </span>
                        <span className="text-xl font-bold text-amber-600 font-mono">
                            {currency} {order.total_price?.toLocaleString()}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[11px] text-res block">Customer</span>
                        <span className="text-xs font-semibold text-heading truncate max-w-[140px] block">
                            {order.customer_name}
                        </span>
                    </div>
                </div>

                <div className="bg-bg/60 border border-permanent/30 rounded-xl p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-heading flex items-center gap-1.5">
                            <RiMailLine className="size-4 text-primary" />
                            Step 1: Request Office Authorization OTP
                        </span>
                        <button
                            type="button"
                            onClick={handleRequestOtp}
                            disabled={requestingOtp}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                        >
                            {requestingOtp ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiRefreshLine className="size-3.5" />}
                            {requestingOtp ? 'Sending...' : currentSettlementOtp ? 'Resend to Office' : 'Send to Office'}
                        </button>
                    </div>

                    <p className="text-[11px] text-res leading-relaxed">
                        When handing over cash at the office, click above to trigger an authorization request. The OTP code is sent directly to the official office email {officeEmail ? `(${officeEmail})` : ''} for the office manager to confirm.
                    </p>

                    {currentSettlementOtp && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-between">
                            <span className="text-[11px] font-semibold">Active Request Code:</span>
                            <span className="font-mono font-bold tracking-widest text-sm">{currentSettlementOtp}</span>
                        </div>
                    )}
                </div>

                {/* Step 2: Verification Input */}
                <form onSubmit={handleSettle} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-heading mb-1.5">
                            Step 2: Enter Authorization OTP Code
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit Office OTP"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            className="w-full px-4 py-2.5 text-lg tracking-[0.3em] text-center font-mono font-bold bg-bg border-2 border-permanent/40 rounded-xl text-heading focus:outline-hidden focus:border-amber-500 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                        />
                        <span className="text-[11px] text-res block mt-1">
                            Enter the code provided by the office manager to confirm handover.
                        </span>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl bg-dynamic hover:bg-dynamic/80 text-heading border border-permanent/30 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={settling || otpCode.length < 4}
                            className="flex-1 px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {settling ? <RiLoader4Line className="animate-spin size-4" /> : <RiCheckLine className="size-4" />}
                            {settling ? 'Settling...' : 'Confirm Cash Handover'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ─── Main Delivery Boy Portal Component ─────────────────────────── */
export default function DeliveryOrders({ orders, filters, rider, stats }) {
    const { setting } = usePage().props
    const currency = setting?.site?.currency?.value || setting?.currency_symbol || 'PKR'
    const { toasts, push: pushToast, dismiss } = useToast()

    const [activeTab, setActiveTab] = useState(filters.status || 'active')
    const [search, setSearch] = useState(filters.search || '')
    const [selectedOrderForOtp, setSelectedOrderForOtp] = useState(null)
    const [selectedOrderForSettlement, setSelectedOrderForSettlement] = useState(null)
    const [ordersList, setOrdersList] = useState(orders.data || [])

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey)
        router.get(
            route('delivery.orders.index'),
            { status: tabKey, search },
            { preserveState: true, replace: true }
        )
    }

    const handleSearch = (e) => {
        e.preventDefault()
        router.get(
            route('delivery.orders.index'),
            { status: activeTab, search },
            { preserveState: true, replace: true }
        )
    }

    const handleOrderCompleted = (updatedOrder) => {
        setOrdersList(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
        router.reload({ only: ['orders', 'stats'] })
    }

    const handleOrderSettled = (updatedOrder) => {
        setOrdersList(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
        router.reload({ only: ['orders', 'stats'] })
    }

    return (
        <AdminLayout title="Delivery Boy Portal">
            <ToastStack toasts={toasts} dismiss={dismiss} />

            <div className="space-y-6 pt-2 pb-12">
                {/* ── Top Rider Greeting & COD Settlement Overview ── */}
                <div className="bg-gradient-to-r from-emerald-600/10 via-primary/10 to-transparent p-5 sm:p-6 rounded-2xl border border-permanent/30 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                            <RiEBike2Line className="size-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-heading">
                                    Delivery Boy Portal
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 uppercase tracking-wider">
                                    Active Rider
                                </span>
                            </div>
                            <p className="text-xs text-res mt-0.5">
                                Welcome back, <strong className="text-heading font-semibold">{rider.name}</strong>. Here are your assigned customer deliveries and COD cash records.
                            </p>
                        </div>
                    </div>

                    {/* Quick switch to main orders if permitted */}
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('admin.orders.index')}
                            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-accent hover:bg-dynamic text-heading border border-permanent/30 transition-all inline-flex items-center gap-1.5 shadow-xs"
                        >
                            <RiFileList3Line className="size-4 text-secondary" />
                            All Store Orders
                        </Link>
                    </div>
                </div>

                {/* ── Key Rider Metrics ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Unsettled Cash In Hand */}
                    <div className="bg-accent rounded-2xl border border-amber-500/30 p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                                Cash in Hand (Unsettled)
                            </span>
                            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                <RiCoinsLine className="size-5" />
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-bold font-mono text-amber-500">
                                {currency} {stats.unsettled_cash_in_hand?.toLocaleString()}
                            </span>
                            <p className="text-[11px] text-res mt-1">
                                Collected COD cash awaiting handover to office
                            </p>
                        </div>
                    </div>

                    {/* Active Deliveries */}
                    <div className="bg-accent rounded-2xl border border-permanent/30 p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                                Active Deliveries
                            </span>
                            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                                <RiTruckLine className="size-5" />
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-bold font-mono text-heading">
                                {stats.active_deliveries}
                            </span>
                            <p className="text-[11px] text-res mt-1">
                                Pending, processing or on the road
                            </p>
                        </div>
                    </div>

                    {/* Completed Deliveries */}
                    <div className="bg-accent rounded-2xl border border-permanent/30 p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                                Completed Deliveries
                            </span>
                            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <RiCheckboxCircleLine className="size-5" />
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-bold font-mono text-emerald-500">
                                {stats.completed_deliveries}
                            </span>
                            <p className="text-[11px] text-res mt-1">
                                Successfully delivered with customer OTP
                            </p>
                        </div>
                    </div>

                    {/* Total Settled Handover */}
                    <div className="bg-accent rounded-2xl border border-permanent/30 p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                                Settled with Office
                            </span>
                            <span className="p-2 rounded-xl bg-primary/10 text-primary">
                                <RiShieldCheckLine className="size-5" />
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-bold font-mono text-heading">
                                {currency} {stats.settled_cash?.toLocaleString()}
                            </span>
                            <p className="text-[11px] text-res mt-1">
                                Verified office email settlements
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Filters & Tabs Bar ── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-accent p-3 rounded-2xl border border-permanent/30 shadow-xs">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scroll-hidden">
                        {[
                            { key: 'active', label: 'Active Deliveries', icon: RiTruckLine },
                            { key: 'completed', label: 'Delivered / Completed', icon: RiCheckboxCircleLine },
                            { key: 'all', label: 'All Orders', icon: RiFileList3Line },
                        ].map(t => {
                            const Icon = t.icon
                            const isActive = activeTab === t.key
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => handleTabChange(t.key)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                            : 'text-secondary hover:text-heading hover:bg-dynamic/60'
                                    }`}
                                >
                                    <Icon className="size-3.5" />
                                    {t.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Search Field */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary size-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search order #, customer, address..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg border border-permanent/30 rounded-xl text-heading focus:outline-hidden focus:border-primary transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-dynamic hover:bg-dynamic/80 text-heading border border-permanent/30 transition-colors"
                        >
                            Filter
                        </button>
                    </form>
                </div>

                {/* ── Orders Cards List (Mobile-Optimized Rider View) ── */}
                {ordersList.length === 0 ? (
                    <div className="bg-accent rounded-2xl border border-dashed border-permanent/40 p-12 text-center space-y-3">
                        <div className="size-16 rounded-2xl bg-dynamic/50 flex items-center justify-center mx-auto text-secondary">
                            <RiEBike2Line className="size-8" />
                        </div>
                        <h3 className="text-base font-bold text-heading">No Orders Found</h3>
                        <p className="text-xs text-res max-w-md mx-auto">
                            You currently have no orders under this tab. As managers assign orders to your delivery profile, they will appear right here with full customer details and OTP verification.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {ordersList.map((order) => {
                            const isCompleted = (order.status || '').toLowerCase() === 'completed'
                            const isCod = (order.payment_method || '').toLowerCase().includes('cod') ||
                                          (order.payment_method || '').toLowerCase().includes('cash')
                            const fullAddress = [
                                order.shipping_address,
                                order.shipping_city,
                                order.shipping_state,
                                order.shipping_country
                            ].filter(Boolean).join(', ')

                            return (
                                <div
                                    key={order.id}
                                    className="bg-accent rounded border border-permanent/40 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
                                >
                                    {/* Order Card Header */}
                                    <div>
                                        <div className="flex items-center justify-between pb-3 border-b border-permanent/20">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold text-sm text-heading">
                                                    {order.order_number}
                                                </span>
                                                {order.tracking_number && (
                                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-dynamic/70 text-secondary border border-permanent/30">
                                                        {order.tracking_number}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                                    isCompleted
                                                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                                        : 'bg-sky-500/15 text-sky-500 border-sky-500/30'
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>

                                        {/* Customer & Destination Info */}
                                        <div className="mt-3.5 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                        <RiUserLine className="size-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-bold text-heading truncate block">
                                                            {order.customer_name}
                                                        </span>
                                                        <span className="text-[11px] text-res truncate block">
                                                            {order.customer_phone || order.customer_email || 'No contact specified'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {order.customer_phone && (
                                                    <a
                                                        href={`tel:${order.customer_phone}`}
                                                        className="size-8 rounded-xl bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                                                        title="Call Customer"
                                                    >
                                                        <RiPhoneLine className="size-4" />
                                                    </a>
                                                )}
                                            </div>

                                            <div className="bg-bg/50 rounded p-3 border border-permanent/20 space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <RiMapPinLine className="size-4 text-rose-500 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[11px] font-semibold text-res block uppercase tracking-wider">
                                                            Delivery Address
                                                        </span>
                                                        <p className="text-xs text-heading font-medium leading-snug line-clamp-2">
                                                            {fullAddress || 'Address not provided'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {fullAddress && (
                                                    <a
                                                        href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full py-1.5 px-3 rounded-sm bg-dynamic/80 hover:bg-dynamic text-xs font-semibold text-primary inline-flex items-center justify-center gap-1.5 transition-colors border border-permanent/20"
                                                    >
                                                        <RiNavigationLine className="size-3.5" />
                                                        Open in Google Maps
                                                    </a>
                                                )}
                                            </div>
                                            {order.items && order.items.length > 0 && (
                                                <div className="text-xs space-y-1 pt-1">
                                                    <span className="text-[11px] text-res block font-semibold">
                                                        Items ({order.items.reduce((s, i) => s + i.quantity, 0)}):
                                                    </span>
                                                    <div className="space-y-1">
                                                        {order.items.slice(0, 2).map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-xs text-res">
                                                                <span className="truncate max-w-[200px]">
                                                                    {item.quantity}x {item.product_title}
                                                                </span>
                                                                <span className="font-mono font-medium text-heading">
                                                                    {currency} {item.subtotal?.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {order.items.length > 2 && (
                                                            <span className="text-[10px] text-secondary italic block">
                                                                +{order.items.length - 2} more item(s)...
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer & Actions */}
                                    <div className="pt-3 border-t border-permanent/20 space-y-3">
                                        {/* Financial & COD Highlight */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-res uppercase tracking-wider block font-semibold">
                                                    {isCod ? 'Cash on Delivery' : order.payment_method}
                                                </span>
                                                <span className="text-sm font-semibold font-mono text-primary">
                                                    {currency} {order.total_price?.toLocaleString()}
                                                </span>
                                            </div>

                                            {isCompleted ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                                                    <RiCheckLine className="size-3" /> Delivered & Verified
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrderForOtp(order)}
                                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <RiShieldCheckLine className="size-4" />
                                                    Complete with OTP
                                                </button>
                                            )}
                                        </div>

                                        {isCompleted && isCod && (
                                            <div className="text-[11px] p-2.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-600 flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="block font-semibold">COD Cash Collected:</span>
                                                    <span className="font-bold font-mono capitalize">
                                                        {order.office_settlement_status === 'settled' ? (
                                                            <span className="text-emerald-600 inline-flex items-center gap-1">
                                                                <RiCheckLine size={13} /> Settled with Office
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-600">Pending Office Handover</span>
                                                        )}
                                                    </span>
                                                </div>

                                                {order.office_settlement_status !== 'settled' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedOrderForSettlement(order)}
                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer shrink-0"
                                                    >
                                                        <RiBuildingLine size={13} />
                                                        Office OTP Handover
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Delivery OTP Verification Modal ── */}
            {selectedOrderForOtp && (
                <DeliveryOtpModal
                    order={selectedOrderForOtp}
                    currency={currency}
                    pushToast={pushToast}
                    onClose={() => setSelectedOrderForOtp(null)}
                    onSuccess={handleOrderCompleted}
                />
            )}

            {/* ── Office Settlement Modal ── */}
            {selectedOrderForSettlement && (
                <OfficeSettlementModal
                    order={selectedOrderForSettlement}
                    currency={currency}
                    pushToast={pushToast}
                    onClose={() => setSelectedOrderForSettlement(null)}
                    onSuccess={handleOrderSettled}
                />
            )}
        </AdminLayout>
    )
}
