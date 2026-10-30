import AdminLayout from '@/Layouts/AdminLayout'
import axios from 'axios'
import React, { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import {
    RiTruckLine,
    RiTimeLine,
    RiCheckboxCircleLine,
    RiCloseLine,
    RiErrorWarningLine,
    RiSearchLine,
    RiFilterLine,
    RiShoppingBag3Line,
    RiEyeLine,
    RiCheckLine,
    RiCalendarLine,
    RiBankCardLine,
    RiMoneyDollarCircleLine,
    RiUserLine,
    RiMapPinLine,
    RiFileTextLine,
    RiLoader4Line,
    RiRefreshLine,
    RiArrowRightLine,
    RiShieldCheckLine,
    RiInformationLine,
    RiMailLine,
    RiPhoneLine,
    RiWhatsappLine,
    RiFileCopyLine,
    RiCheckDoubleLine
} from 'react-icons/ri'

/* ─── Toast Notifications ────────────────────────────────────────── */
function useToast() {
    const [toasts, setToasts] = useState([])
    const push = (msg, type = 'success') => {
        const id = Date.now()
        setToasts(p => [...p, { id, msg, type }])
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
    }
    const dismiss = id => setToasts(p => p.filter(t => t.id !== id))
    return { toasts, push, dismiss }
}

function ToastStack({ toasts, dismiss }) {
    if (!toasts.length) return null
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium min-w-64 max-w-sm pointer-events-auto transition-all ${
                        t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                >
                    {t.type === 'success' ? (
                        <RiCheckboxCircleLine className="size-4 shrink-0" />
                    ) : (
                        <RiErrorWarningLine className="size-4 shrink-0" />
                    )}
                    <span className="flex-1">{t.msg}</span>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="opacity-70 hover:opacity-100 shrink-0 cursor-pointer"
                    >
                        <RiCloseLine className="size-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}

/* ─── Status Configurations ──────────────────────────────────────── */
const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        cls: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
        dot: 'bg-amber-500',
        icon: RiTimeLine,
    },
    processing: {
        label: 'Processing',
        cls: 'bg-sky-500/15 text-sky-500 border-sky-500/25',
        dot: 'bg-sky-500',
        icon: RiRefreshLine,
    },
    shipped: {
        label: 'Shipped',
        cls: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/25',
        dot: 'bg-indigo-500',
        icon: RiTruckLine,
    },
    delivered: {
        label: 'Delivered',
        cls: 'bg-teal-500/15 text-teal-500 border-teal-500/25',
        dot: 'bg-teal-500',
        icon: RiCheckboxCircleLine,
    },
    completed: {
        label: 'Completed',
        cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
        dot: 'bg-emerald-500',
        icon: RiCheckLine,
    },
    cancelled: {
        label: 'Cancelled',
        cls: 'bg-rose-500/15 text-rose-500 border-rose-500/25',
        dot: 'bg-rose-500',
        icon: RiCloseLine,
    },
}

function StatusBadge({ status }) {
    const s = STATUS_CONFIG[status?.toLowerCase()] || {
        label: status || 'Unknown',
        cls: 'bg-secondary/15 text-secondary border-secondary/25',
        dot: 'bg-secondary',
        icon: RiInformationLine,
    }
    const Icon = s.icon
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize select-none ${s.cls}`}
        >
            <span className={`size-1.25 rounded-full ${s.dot}`} />
            <Icon className="size-2.5" />
            {s.label}
        </span>
    )
}

function PaymentBadge({ status }) {
    const isPaid = (status || '').toLowerCase() === 'paid'
    const isRefunded = (status || '').toLowerCase() === 'refunded'
    const cls = isPaid
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        : isRefunded
        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border capitalize ${cls}`}>
            {status || 'Unpaid'}
        </span>
    )
}

/* ─── Avatar ──────────────────────────────────────────────────────── */
function Avatar({ name }) {
    const initials = (name || 'G').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const colors = ['bg-indigo-500', 'bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500']
    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
    return (
        <div className={`size-7.5 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-semibold shrink-0 shadow-xs`}>
            {initials}
        </div>
    )
}

/* ─── Order Processing Modal ──────────────────────────────────────── */
function OrderProcessModal({ order, deliveryBoys = [], onClose, onUpdated, currency, pushToast }) {
    const [status, setStatus] = useState(order?.status || 'pending')
    const [paymentStatus, setPaymentStatus] = useState((order?.payment_status || 'unpaid').toLowerCase())
    const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '')
    const [shippingCarrier, setShippingCarrier] = useState(order?.shipping_carrier || '')
    const [deliveryBoyId, setDeliveryBoyId] = useState(order?.delivery_boy_id || '')
    const [adminNotes, setAdminNotes] = useState(order?.admin_notes || '')
    const [saving, setSaving] = useState(false)
    const [generatingTracking, setGeneratingTracking] = useState(false)

    // WhatsApp / Email Delivery OTP state
    const [sendingOtp, setSendingOtp] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [verifyingOtp, setVerifyingOtp] = useState(false)
    const [customPhone, setCustomPhone] = useState('')
    const [customEmail, setCustomEmail] = useState('')
    const [showPhoneInput, setShowPhoneInput] = useState(false)
    const [showEmailInput, setShowEmailInput] = useState(false)
    const [activeOtpChannel, setActiveOtpChannel] = useState(null) // 'whatsapp' | 'email'

    // Office Settlement state
    const [generatingSettlementOtp, setGeneratingSettlementOtp] = useState(false)
    const [settlementOtpCode, setSettlementOtpCode] = useState('')
    const [settlingOffice, setSettlingOffice] = useState(false)
    const [currentSettlementOtp, setCurrentSettlementOtp] = useState(order?.office_settlement_otp || '')
    const [copiedTemplate, setCopiedTemplate] = useState(false)

    const getOtpMessageTemplate = () => {
        return `📦 *NestifyTech Order #${order.id} Delivery Confirmation*\n\n` +
            `Hello ${order.customer_name || 'Customer'},\n` +
            `Your order total is: *${currency} ${order.total_price?.toLocaleString()}*.\n` +
            `Our delivery rider is here with your package. Please inspect your items and share the 6-digit confirmation code with the rider to complete the delivery.\n\n` +
            `Thank you for shopping with NestifyTech!`
    }

    const handleCopyTemplate = () => {
        navigator.clipboard.writeText(getOtpMessageTemplate())
        setCopiedTemplate(true)
        pushToast('Order message template copied to clipboard!', 'success')
        setTimeout(() => setCopiedTemplate(false), 2500)
    }

    if (!order) return null

    // 1. Auto Generate Tracking Number
    const handleGenerateTracking = async () => {
        setGeneratingTracking(true)
        try {
            const res = await axios.post(route('admin.orders.generate-tracking'), { prefix: 'NST' })
            if (res.data?.success && res.data.tracking_number) {
                setTrackingNumber(res.data.tracking_number)
                pushToast(`Generated tracking #${res.data.tracking_number}`, 'success')
            } else {
                pushToast(res.data?.message || 'Failed to generate tracking number.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Error generating tracking number.', 'error')
        } finally {
            setGeneratingTracking(false)
        }
    }

    // 2. Send Customer OTP for Delivery Confirmation (WhatsApp or Email)
    const handleSendDeliveryOtp = async (channel = 'whatsapp') => {
        setSendingOtp(true)
        setActiveOtpChannel(channel)
        try {
            const payload = { channel }
            if (channel === 'whatsapp' && customPhone.trim()) payload.phone = customPhone.trim()
            if (channel === 'email' && customEmail.trim()) payload.email = customEmail.trim()

            const res = await axios.post(route('admin.orders.send-delivery-otp', { id: order.id }), payload)
            if (res.data?.success) {
                if (res.data.api_sent) {
                    pushToast(res.data.message || `OTP sent via ${channel}!`, 'success')
                    setShowPhoneInput(false)
                    setShowEmailInput(false)
                } else {
                    pushToast(res.data.message || `${channel === 'email' ? 'Email' : 'WhatsApp'} delivery failed.`, 'error')
                }
            } else if (res.data?.needs_phone) {
                setShowPhoneInput(true)
                setShowEmailInput(false)
                pushToast(res.data.message, 'error')
            } else if (res.data?.needs_email) {
                setShowEmailInput(true)
                setShowPhoneInput(false)
                pushToast(res.data.message, 'error')
            } else {
                pushToast(res.data?.message || 'Failed to send OTP.', 'error')
            }
        } catch (err) {
            if (err.response?.data?.needs_phone) {
                setShowPhoneInput(true)
                setShowEmailInput(false)
            } else if (err.response?.data?.needs_email) {
                setShowEmailInput(true)
                setShowPhoneInput(false)
            }
            pushToast(err.response?.data?.message || 'Error sending delivery OTP.', 'error')
        } finally {
            setSendingOtp(false)
        }
    }

    // 3. Confirm Delivery with OTP (on delivery device)
    const handleVerifyDeliveryOtp = async (e) => {
        e.preventDefault()
        if (!otpCode.trim()) {
            pushToast('Please enter the 6-digit OTP code received by the customer.', 'error')
            return
        }
        setVerifyingOtp(true)
        try {
            const res = await axios.post(route('admin.orders.verify-delivery-otp', { id: order.id }), {
                otp: otpCode.trim(),
                delivery_boy_id: deliveryBoyId || null,
            })
            if (res.data?.success) {
                pushToast(res.data.message || 'Delivery confirmed & completed!', 'success')
                setStatus('completed')
                setPaymentStatus('paid')
                onUpdated({
                    ...order,
                    status: 'completed',
                    payment_status: 'paid',
                    delivery_boy_id: deliveryBoyId,
                    delivery_boy_name: deliveryBoys.find(d => String(d.id) === String(deliveryBoyId))?.name || order.delivery_boy_name,
                    cod_collected_amount: (order.payment_method || '').toLowerCase() === 'cod' ? order.total_price : order.cod_collected_amount,
                    office_settlement_status: (order.payment_method || '').toLowerCase() === 'cod' ? 'unsettled' : order.office_settlement_status,
                })
                setOtpCode('')
            } else {
                pushToast(res.data?.message || 'OTP verification failed.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Invalid or expired OTP code.', 'error')
        } finally {
            setVerifyingOtp(false)
        }
    }

    // 4. Generate Office Settlement OTP
    const handleGenerateSettlementOtp = async () => {
        setGeneratingSettlementOtp(true)
        try {
            const res = await axios.post(route('admin.orders.generate-settlement-otp', { id: order.id }))
            if (res.data?.success) {
                setCurrentSettlementOtp(res.data.settlement_otp)
                pushToast(res.data.message || 'Office settlement OTP generated!', 'success')
            } else {
                pushToast(res.data?.message || 'Failed to generate settlement OTP.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Error generating settlement OTP.', 'error')
        } finally {
            setGeneratingSettlementOtp(false)
        }
    }

    // 5. Office Confirms Cash Received from Delivery Boy
    const handleSettleOfficePayment = async (e) => {
        e.preventDefault()
        if (!settlementOtpCode.trim()) {
            pushToast('Please enter the settlement OTP.', 'error')
            return
        }
        setSettlingOffice(true)
        try {
            const res = await axios.post(route('admin.orders.settle-payment', { id: order.id }), {
                settlement_otp: settlementOtpCode.trim(),
            })
            if (res.data?.success) {
                pushToast(res.data.message || 'Payment successfully settled with office!', 'success')
                onUpdated({
                    ...order,
                    office_settlement_status: 'settled',
                })
                setCurrentSettlementOtp('')
                setSettlementOtpCode('')
            } else {
                pushToast(res.data?.message || 'Failed to settle office payment.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Invalid settlement OTP.', 'error')
        } finally {
            setSettlingOffice(false)
        }
    }

    // 6. Save General Order Status Details
    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await axios.post(route('admin.orders.status', { id: order.id }), {
                status,
                payment_status: paymentStatus,
                tracking_number: trackingNumber,
                shipping_carrier: shippingCarrier,
                delivery_boy_id: deliveryBoyId ? Number(deliveryBoyId) : null,
                admin_notes: adminNotes,
            })
            if (res.data?.success) {
                pushToast(res.data.message || 'Order updated successfully!', 'success')
                onUpdated({
                    ...order,
                    status,
                    payment_status: paymentStatus,
                    tracking_number: trackingNumber,
                    shipping_carrier: shippingCarrier,
                    delivery_boy_id: deliveryBoyId ? Number(deliveryBoyId) : null,
                    delivery_boy_name: deliveryBoys.find(d => String(d.id) === String(deliveryBoyId))?.name || (deliveryBoyId ? order.delivery_boy_name : null),
                    admin_notes: adminNotes,
                })
                onClose()
            } else {
                pushToast(res.data?.message || 'Failed to update order.', 'error')
            }
        } catch (err) {
            pushToast(err.response?.data?.message || 'Error updating order.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const isCod = (order.payment_method || '').toLowerCase() === 'cod'
    const isCompleted = status === 'completed'
    const isSettled = order.office_settlement_status === 'settled'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-accent border border-permanent/30 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-permanent/20 bg-accent/80">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                            <RiTruckLine size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-heading">
                                    Process Order #{order.id}
                                </h3>
                                <StatusBadge status={status} />
                                {isCod && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">
                                        Cash on Delivery
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-res mt-0.5">
                                Placed on {order.order_date} • {order.customer_name} ({order.customer_email})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-res hover:text-heading p-1 rounded-lg hover:bg-dynamic/50 transition-colors cursor-pointer"
                    >
                        <RiCloseLine size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs">
                    {/* Items Overview */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                            Order Items ({order.items?.length || 0})
                        </span>
                        <div className="bg-bg/60 border border-permanent/20 rounded-xl p-3 divide-y divide-permanent/20 max-h-36 overflow-y-auto">
                            {(order.items || []).map((item) => (
                                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.product_title}
                                                className="size-9 rounded-lg object-cover border border-permanent/30 shrink-0"
                                            />
                                        ) : (
                                            <div className="size-9 rounded-lg bg-dynamic flex items-center justify-center text-res shrink-0">
                                                <RiShoppingBag3Line size={15} />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-semibold text-heading truncate">{item.product_title}</p>
                                            <p className="text-[11px] text-res">
                                                {currency} {item.unit_price?.toLocaleString()} &times; {item.quantity}
                                                {item.color && <span className="ml-2 font-medium">Color: {item.color}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-heading shrink-0">
                                        {currency} {item.subtotal?.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── WhatsApp OTP Delivery Confirmation Section ── */}
                    <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                                    <RiShieldCheckLine className="text-emerald-500 size-4" />
                                    WhatsApp Delivery Confirmation OTP
                                </span>
                            </div>
                            {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <RiCheckLine size={12} /> Verified & Delivered
                                </span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSendDeliveryOtp('whatsapp')}
                                        disabled={sendingOtp}
                                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                                        title="Send OTP via WhatsApp"
                                    >
                                        {sendingOtp && activeOtpChannel === 'whatsapp'
                                            ? <RiLoader4Line className="animate-spin size-3.5" />
                                            : <RiWhatsappLine size={12} />}
                                        {sendingOtp && activeOtpChannel === 'whatsapp' ? 'Sending...' : 'WhatsApp'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSendDeliveryOtp('email')}
                                        disabled={sendingOtp}
                                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                                        title="Send OTP via Email"
                                    >
                                        {sendingOtp && activeOtpChannel === 'email'
                                            ? <RiLoader4Line className="animate-spin size-3.5" />
                                            : <RiMailLine size={12} />}
                                        {sendingOtp && activeOtpChannel === 'email' ? 'Sending...' : 'Email'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <button
                                type="button"
                                onClick={handleCopyTemplate}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-bg border border-permanent/30 hover:border-emerald-500 text-heading transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                                {copiedTemplate ? <RiCheckDoubleLine className="size-3.5 text-emerald-500" /> : <RiFileCopyLine className="size-3.5" />}
                                {copiedTemplate ? 'Copied Template!' : 'Copy Template'}
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

                        <p className="text-[11px] text-res">
                            Send a 6-digit OTP to the customer via <strong>WhatsApp</strong> or <strong>Email</strong> — use Email as a fallback if the WhatsApp sender key has expired. The customer shares this code with the rider upon inspecting their package.
                        </p>

                        {/* Phone fallback input for WhatsApp */}
                        {showPhoneInput && !isCompleted && (
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    value={customPhone}
                                    onChange={(e) => setCustomPhone(e.target.value)}
                                    placeholder="Enter WhatsApp # (e.g. 923001234567)"
                                    className="flex-1 px-3 py-1.5 text-xs bg-bg border border-permanent/30 rounded-lg text-heading focus:outline-hidden focus:border-emerald-500 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSendDeliveryOtp('whatsapp')}
                                    disabled={sendingOtp || !customPhone.trim()}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                    <RiWhatsappLine size={12} /> Send
                                </button>
                            </div>
                        )}

                        {/* Email fallback input */}
                        {showEmailInput && !isCompleted && (
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="email"
                                    value={customEmail}
                                    onChange={(e) => setCustomEmail(e.target.value)}
                                    placeholder="Enter customer email address"
                                    className="flex-1 px-3 py-1.5 text-xs bg-bg border border-permanent/30 rounded-lg text-heading focus:outline-hidden focus:border-sky-500 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSendDeliveryOtp('email')}
                                    disabled={sendingOtp || !customEmail.trim()}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                    <RiMailLine size={12} /> Send
                                </button>
                            </div>
                        )}

                        {/* OTP Verification on Delivery Device */}
                        {!isCompleted && (
                            <form onSubmit={handleVerifyDeliveryOtp} className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit Customer OTP"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    className="w-48 px-3 py-1.5 text-xs bg-bg border border-permanent/30 rounded-lg text-heading focus:outline-hidden focus:border-emerald-500 font-mono tracking-widest text-center font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={verifyingOtp || otpCode.length !== 6}
                                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                                >
                                    {verifyingOtp ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiCheckLine size={13} />}
                                    Confirm Delivery
                                </button>
                                {isCod && (
                                    <span className="text-[10px] text-amber-500 font-medium">
                                        (Will credit {currency}{order.total_price?.toLocaleString()} to rider's cash balance)
                                    </span>
                                )}
                            </form>
                        )}
                    </div>

                    {/* ── Cash on Delivery & Office Settlement Section ── */}
                    {isCod && (
                        <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                                    <RiMoneyDollarCircleLine className="text-amber-500 size-4" />
                                    Delivery Boy Cash & Office Settlement
                                </span>
                                {isSettled ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        <RiCheckLine size={12} /> Settled with Office
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        <RiTimeLine size={12} /> Unsettled Cash ({currency} {order.total_price?.toLocaleString()})
                                    </span>
                                )}
                            </div>

                            <p className="text-[11px] text-res">
                                When the rider hands over collected cash to the office, click below to generate an authorization OTP sent directly to the official office email configured in site settings.
                            </p>

                            {!isSettled && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleGenerateSettlementOtp}
                                            disabled={generatingSettlementOtp}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                                        >
                                            {generatingSettlementOtp ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiMailLine size={13} />}
                                            {generatingSettlementOtp ? 'Sending...' : 'Send Office OTP to Email'}
                                        </button>
                                        {currentSettlementOtp && (
                                            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                                Code: {currentSettlementOtp}
                                            </span>
                                        )}
                                    </div>

                                    {/* Office OTP verification form */}
                                    <form onSubmit={handleSettleOfficePayment} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={settlementOtpCode}
                                            onChange={(e) => setSettlementOtpCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Enter Settlement OTP"
                                            className="w-48 px-3 py-1.5 text-xs bg-bg border border-permanent/30 rounded-lg text-heading focus:outline-hidden focus:border-amber-500 font-mono tracking-wider font-bold text-center"
                                        />
                                        <button
                                            type="submit"
                                            disabled={settlingOffice || !settlementOtpCode.trim()}
                                            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                                        >
                                            {settlingOffice ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiCheckLine size={13} />}
                                            Confirm Office Receipt
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Order Processing Controls ── */}
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Status Select */}
                            <div>
                                <label className="block text-xs font-semibold text-heading mb-1.5">
                                    Order Processing Stage
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-bg border border-permanent/30 rounded-xl text-heading focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
                                >
                                    <option value="pending">Pending (Awaiting fulfillment)</option>
                                    <option value="processing">Processing (Packing / In Warehouse)</option>
                                    <option value="shipped">Shipped (Handed to courier)</option>
                                    <option value="delivered">Delivered (Received by customer)</option>
                                    <option value="completed">Completed (Order Finalized)</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className="block text-xs font-semibold text-heading mb-1.5">
                                    Payment Status
                                </label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-bg border border-permanent/30 rounded-xl text-heading focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>

                            {/* Assigned Delivery Boy / Rider */}
                            <div>
                                <label className="block text-xs font-semibold text-heading mb-1.5">
                                    Assigned Delivery Boy / Rider
                                </label>
                                <select
                                    value={deliveryBoyId}
                                    onChange={(e) => setDeliveryBoyId(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-bg border border-permanent/30 rounded-xl text-heading focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
                                >
                                    <option value="">-- Unassigned --</option>
                                    {deliveryBoys.map((boy) => (
                                        <option key={boy.id} value={boy.id}>
                                            {boy.name} ({boy.email})
                                        </option>
                                    ))}
                                </select>
                                {deliveryBoys.length === 0 && (
                                    <span className="text-[10px] text-amber-500 mt-1 block">
                                        No users with "Delivery Boy" role found. Assign the Delivery Boy role under Our Team &rarr; Users.
                                    </span>
                                )}
                            </div>

                            {/* Tracking Carrier */}
                            <div>
                                <label className="block text-xs font-semibold text-heading mb-1.5">
                                    Shipping Carrier
                                </label>
                                <input
                                    type="text"
                                    value={shippingCarrier}
                                    onChange={(e) => setShippingCarrier(e.target.value)}
                                    placeholder="e.g. In-house Rider, DHL, FedEx, TCS"
                                    className="w-full px-3 py-2 text-xs bg-bg border border-permanent/30 rounded-xl text-heading focus:outline-hidden focus:border-primary transition-colors"
                                />
                            </div>

                            {/* Tracking Number with Auto Generate Button */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-heading mb-1.5">
                                    Tracking Number
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="e.g. NST-2610-8A7B2C"
                                        className="flex-1 px-3 py-2 text-xs bg-bg border border-permanent/30 rounded-xl text-heading focus:outline-hidden focus:border-primary font-mono transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateTracking}
                                        disabled={generatingTracking}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-dynamic hover:bg-dynamic/80 text-heading border border-permanent/30 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                                        title="Generate a unique tracking code"
                                    >
                                        {generatingTracking ? (
                                            <RiLoader4Line className="animate-spin size-3.5 text-primary" />
                                        ) : (
                                            <RiRefreshLine className="size-3.5 text-primary" />
                                        )}
                                        Auto-Generate
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Admin Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-heading mb-1.5">
                                Internal Processing Notes (Visible to staff)
                            </label>
                            <textarea
                                rows={2}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes regarding packaging, dispatch confirmation, or warehouse instructions..."
                                className="w-full px-3 py-2 text-xs bg-bg border border-permanent/30 rounded-xl text-heading focus:outline-hidden focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Financial Summary */}
                        {(() => {
                            const itemsSum = (order.items || []).reduce((acc, curr) => acc + (Number(curr.subtotal) || (Number(curr.unit_price) * Number(curr.quantity)) || 0), 0);
                            const orderTotal = Number(order.total_price) || 0;
                            const derivedShipping = Math.max(0, orderTotal - itemsSum);

                            return (
                                <div className="bg-bg/40 border border-permanent/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[11px] text-res block">Payment Method</span>
                                        <span className="font-semibold text-heading uppercase">{order.payment_method}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                        <div>
                                            <span className="text-[11px] text-res block">Items Subtotal</span>
                                            <span className="font-semibold text-heading">
                                                {currency} {(itemsSum > 0 ? itemsSum : orderTotal).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-res block">Shipping</span>
                                            <span className="font-semibold text-heading">
                                                {derivedShipping > 0 ? `${currency} ${derivedShipping.toLocaleString()}` : 'Free'}
                                            </span>
                                        </div>
                                        {order.cancellation_deduction > 0 && (
                                            <div>
                                                <span className="text-[11px] text-rose-500 block">Deduction</span>
                                                <span className="font-semibold text-rose-500">
                                                    -{currency} {order.cancellation_deduction.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-[11px] text-res block">Total Order Value</span>
                                            <span className="text-base font-bold text-primary font-mono">
                                                {currency} {orderTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-permanent/20">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-dynamic hover:bg-dynamic/80 text-heading border border-permanent/20 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/30 transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                            >
                                {saving ? <RiLoader4Line className="animate-spin size-4" /> : <RiCheckLine className="size-4" />}
                                {saving ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

/* ─── Main Admin Orders Page ─────────────────────────────────────── */
function OrdersIndex({ orders: initialOrders, deliveryBoys = [], filters = {}, stats = {} }) {
    const { setting } = usePage().props
    const currency = setting?.site?.currency?.value || '$'

    const initial = Array.isArray(initialOrders?.data) ? initialOrders.data : (initialOrders || [])
    const [ordersList, setOrdersList] = useState(initial)
    const [search, setSearch] = useState(filters.search || '')
    const [activeTab, setActiveTab] = useState(filters.status || 'all')
    const [processingOrder, setProcessingOrder] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    const { toasts, push, dismiss } = useToast()

    // Status Filter Tabs
    const TABS = [
        { key: 'all', label: 'All Orders', count: stats.total || ordersList.length, active: 'bg-primary text-white shadow-md shadow-primary/30' },
        { key: 'pending', label: 'Pending', count: stats.pending || 0, active: 'bg-amber-500 text-white shadow-md shadow-amber-500/30' },
        { key: 'processing', label: 'Processing', count: stats.processing || 0, active: 'bg-sky-500 text-white shadow-md shadow-sky-500/30' },
        { key: 'shipped', label: 'Shipped', count: stats.shipped || 0, active: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' },
        { key: 'delivered', label: 'Delivered', count: stats.delivered || 0, active: 'bg-teal-500 text-white shadow-md shadow-teal-500/30' },
        { key: 'completed', label: 'Completed', count: stats.completed || 0, active: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' },
        { key: 'cancelled', label: 'Cancelled', count: stats.cancelled || 0, active: 'bg-rose-500 text-white shadow-md shadow-rose-500/30' },
    ]

    const handleTabChange = (key) => {
        setActiveTab(key)
        router.get(route('admin.orders.index'), { status: key, search }, { preserveState: true, replace: true })
    }

    const handleSearch = (e) => {
        e.preventDefault()
        router.get(route('admin.orders.index'), { status: activeTab, search }, { preserveState: true, replace: true })
    }

    const handleDelete = async (orderId) => {
        if (!confirm(`Are you sure you want to delete order #${orderId}? This cannot be undone.`)) return

        setDeletingId(orderId)
        try {
            const res = await axios.delete(route('admin.orders.destroy', { id: orderId }))
            if (res.data?.success) {
                setOrdersList(prev => prev.filter(o => o.id !== orderId))
                push(res.data.message || 'Order deleted successfully.', 'success')
            } else {
                push(res.data?.message || 'Failed to delete order.', 'error')
            }
        } catch (err) {
            push(err.response?.data?.message || 'Error deleting order.', 'error')
        } finally {
            setDeletingId(null)
        }
    }

    const handleOrderUpdated = (updatedOrder) => {
        setOrdersList(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
        if (processingOrder && processingOrder.id === updatedOrder.id) {
            setProcessingOrder(updatedOrder)
        }
    }

    return (
        <div className="py-7 flex flex-col gap-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-heading flex items-center gap-2">
                        <RiTruckLine className="text-primary size-7" />
                        Order Processing & Management
                    </h1>
                    <p className="text-xs text-res mt-1">
                        Track, inspect, and advance customer orders through warehouse dispatch, WhatsApp OTP confirmation, and delivery boy cash settlement.
                    </p>
                </div>

                {/* Search Box */}
                <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                    <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-res size-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search order #, customer, carrier..."
                        className="w-full pl-9 pr-8 py-2 text-xs bg-accent border border-permanent/30 rounded-xl text-heading placeholder:text-res/60 focus:outline-hidden focus:border-primary transition-colors"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('')
                                router.get(route('admin.orders.index'), { status: activeTab }, { preserveState: true, replace: true })
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-res hover:text-heading cursor-pointer"
                        >
                            <RiCloseLine size={14} />
                        </button>
                    )}
                </form>
            </div>

            {/* ── Metric Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-accent p-4.5 rounded-xl border border-permanent/30 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Orders</span>
                        <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold">
                            <RiShoppingBag3Line size={16} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold text-heading font-mono">{stats.total || ordersList.length}</span>
                        <span className="text-[11px] text-res block mt-0.5">All customer orders</span>
                    </div>
                </div>

                <div className="bg-accent p-4.5 rounded-xl border border-permanent/30 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">In Fulfillment</span>
                        <div className="size-8 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold">
                            <RiRefreshLine size={16} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold text-sky-500 font-mono">
                            {(stats.pending || 0) + (stats.processing || 0) + (stats.shipped || 0)}
                        </span>
                        <span className="text-[11px] text-res block mt-0.5">Pending, processing & in transit</span>
                    </div>
                </div>

                <div className="bg-accent p-4.5 rounded-xl border border-permanent/30 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Completed</span>
                        <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                            <RiCheckboxCircleLine size={16} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold text-emerald-500 font-mono">{stats.completed || 0}</span>
                        <span className="text-[11px] text-res block mt-0.5">Successfully fulfilled</span>
                    </div>
                </div>

                <div className="bg-accent p-4.5 rounded-xl border border-permanent/30 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Revenue</span>
                        <div className="size-8 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center font-bold">
                            <RiMoneyDollarCircleLine size={16} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold text-teal-500 font-mono">
                            {currency} {(stats.revenue || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-res block mt-0.5">Active order sales</span>
                    </div>
                </div>
            </div>

            {/* ── Status Tabs ── */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-accent p-1.5 rounded-xl border border-permanent/20 w-fit max-w-full">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                isActive ? tab.active : 'text-res hover:text-heading hover:bg-dynamic/50'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-dynamic text-secondary'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* ── Orders Table / List ── */}
            <div className="bg-accent w-full rounded-md border border-permanent/30 shadow-xs overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap sm:whitespace-normal">
                        <thead>
                            <tr className="border-b border-permanent/20 bg-dynamic/40 text-[10px] uppercase tracking-wider text-secondary font-semibold">
                                <th className="px-3.5 py-3.5">Order ID</th>
                                <th className="px-3.5 py-3.5">Customer</th>
                                <th className="px-3.5 py-3.5">Items</th>
                                <th className="px-3.5 py-3.5">Payment</th>
                                <th className="px-3.5 py-3.5">Fulfillment</th>
                                <th className="px-3.5 py-3.5">Delivery Rider / COD</th>
                                <th className="px-3.5 py-3.5">Tracking</th>
                                <th className="px-3.5 py-3.5">Date</th>
                                <th className="px-3.5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-permanent/15">
                            {ordersList.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-res">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RiShoppingBag3Line className="size-10 opacity-30" />
                                            <p className="text-sm font-semibold text-heading">No orders found</p>
                                            <p className="text-xs">There are no orders matching the current filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ordersList.map((order) => {
                                    const isCod = (order.payment_method || '').toLowerCase() === 'cod'
                                    return (
                                        <tr key={order.id} className="hover:bg-dynamic/20 transition-colors">
                                            {/* Order ID */}
                                            <td className="px-3.5 py-4 font-mono text-xs font-semibold text-heading">
                                                {order.order_number || `#${order.id}`}
                                            </td>

                                            {/* Customer */}
                                            <td className="px-3.5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar name={order.customer_name} />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-heading truncate">{order.customer_name}</p>
                                                        <p className="text-[11px] text-res truncate">{order.customer_email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Items & Total */}
                                            <td className="px-3.5 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="font-semibold text-xs text-heading font-mono">
                                                        {currency} {order.total_price?.toLocaleString()}
                                                    </span>
                                                    <span className="text-[11px] text-res block">
                                                        {order.items_count || order.quantity} item{(order.items_count || order.quantity) > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Payment */}
                                            <td className="px-3.5 py-4">
                                                <div className="space-y-1">
                                                    <PaymentBadge status={order.payment_status} />
                                                    <span className="text-[11px] text-res block">{order.payment_method}</span>
                                                </div>
                                            </td>

                                            {/* Fulfillment Status */}
                                            <td className="px-3.5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <StatusBadge status={order.status} />
                                                </div>
                                            </td>

                                            {/* Delivery Rider & COD Cash Status */}
                                            <td className="px-3.5 py-4">
                                                <div className="space-y-1">
                                                    {order.delivery_boy_name ? (
                                                        <span className="inline-flex items-center gap-1 font-semibold text-heading text-[11px]">
                                                            <RiUserLine className="size-3 text-primary shrink-0" />
                                                            {order.delivery_boy_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-res/50 italic text-[11px]">Unassigned</span>
                                                    )}

                                                    {isCod && (
                                                        <div>
                                                            {order.office_settlement_status === 'settled' ? (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.25 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                                    <RiCheckLine size={10} /> Office Settled
                                                                </span>
                                                            ) : order.cod_collected_amount > 0 ? (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.25 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                                                    <RiTimeLine size={10} /> Rider Held Cash
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-res/60 block">COD Pending</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Carrier / Tracking */}
                                            <td className="px-3.5 py-4">
                                                {order.tracking_number ? (
                                                    <div className="space-y-0.5">
                                                        <span className="font-mono text-primary font-semibold text-[11px]">
                                                            {order.tracking_number}
                                                        </span>
                                                        {order.shipping_carrier && (
                                                            <span className="text-[10px] text-res block">
                                                                {order.shipping_carrier}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-res/60 italic text-[11px]">No tracking set</span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="px-3.25 py-4 text-res whitespace-nowrap text-[10px]">
                                                {order.order_date}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3.5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Process Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setProcessingOrder(order)}
                                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                                    >
                                                        <RiTruckLine size={13} />
                                                        Process
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(order.id)}
                                                        disabled={deletingId === order.id}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                        title="Delete Order"
                                                    >
                                                        <RiCloseLine size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer if available */}
                {initialOrders?.last_page > 1 && (
                    <div className="p-4 border-t border-permanent/20 flex items-center justify-between text-xs text-res">
                        <span>
                            Page {initialOrders.current_page} of {initialOrders.last_page} ({initialOrders.total} total)
                        </span>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: initialOrders.last_page }).map((_, i) => (
                                <button
                                    key={i + 1}
                                    type="button"
                                    onClick={() => router.get(route('admin.orders.index'), { page: i + 1, status: activeTab, search }, { preserveState: true })}
                                    className={`size-7 rounded-lg font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                                        initialOrders.current_page === i + 1
                                            ? 'bg-primary text-white'
                                            : 'hover:bg-dynamic text-heading'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Process Order Modal ── */}
            {processingOrder && (
                <OrderProcessModal
                    order={processingOrder}
                    deliveryBoys={deliveryBoys}
                    onClose={() => setProcessingOrder(null)}
                    onUpdated={handleOrderUpdated}
                    currency={currency}
                    pushToast={push}
                />
            )}

            <ToastStack toasts={toasts} dismiss={dismiss} />
        </div>
    )
}

export default OrdersIndex
OrdersIndex.layout = (page) => <AdminLayout title="Orders Processing">{page}</AdminLayout>
