import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    IoClose, 
    IoSparkles, 
    IoCopyOutline, 
    IoCheckmark, 
    IoFlashOutline, 
    IoArrowForward, 
    IoMailOutline 
} from 'react-icons/io5';

const STORAGE_KEY = 'nt_sale_popup_dismissed_until';

export default function PromoPopup() {
    const { setting } = usePage().props;
    const popupConfig = setting?.popup || {};

    const isEnabled = popupConfig.sale_popup_enabled?.value !== undefined 
        ? Boolean(popupConfig.sale_popup_enabled.value) 
        : true;

    const badgeText = popupConfig.popup_badge_text?.value || 'Limited Time Mega Sale • Extra 25% Off';
    const rawTitle = popupConfig.popup_title?.value || 'Unlock 25% OFF Your Order';
    const highlightText = popupConfig.popup_highlight_text?.value || '25% OFF';
    const description = popupConfig.popup_description?.value || 'Upgrade your shopping bag today. Use coupon code at checkout or subscribe to receive our VIP deals directly.';
    const discountCode = popupConfig.popup_coupon_code?.value || 'NESTIFY25';
    const ctaText = popupConfig.popup_cta_text?.value || 'Claim 25% Off';
    const shopUrl = popupConfig.popup_shop_url?.value || '/shop';
    const delaySeconds = parseFloat(popupConfig.popup_delay_seconds?.value || 3.5);
    const countdownHours = parseInt(popupConfig.popup_countdown_hours?.value || 24, 10);

    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    // Countdown timer calculation
    const [timeLeft, setTimeLeft] = useState({
        hours: Math.max(1, countdownHours - 1),
        minutes: 45,
        seconds: 30
    });

    useEffect(() => {
        if (!isEnabled) return;

        // Check if user already dismissed recently
        try {
            const dismissedUntil = localStorage.getItem(STORAGE_KEY);
            if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
                return;
            }
        } catch (e) {
            // ignore localStorage errors
        }

        // Show popup after configured delay
        const showTimer = setTimeout(() => {
            setIsOpen(true);
        }, Math.max(500, delaySeconds * 1000));

        return () => clearTimeout(showTimer);
    }, [isEnabled, delaySeconds]);

    // Countdown tick
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                }
                if (prev.minutes > 0) {
                    return { ...prev, minutes: 59, seconds: 59 };
                }
                if (prev.hours > 0) {
                    return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    const handleClose = (suppressHours = 24) => {
        setIsOpen(false);
        try {
            const suppressUntil = Date.now() + suppressHours * 60 * 60 * 1000;
            localStorage.setItem(STORAGE_KEY, suppressUntil.toString());
        } catch (e) {
            // ignore
        }
    };

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(discountCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;
        setSubscribed(true);
        handleCopy();
        // Auto-dismiss shortly after success
        setTimeout(() => {
            handleClose(48);
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[99990] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-title"
        >
            {/* Modal Card */}
            <div 
                className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden transform transition-all animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Background Glow */}
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-amber-400/20 via-rose-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-sky-400/20 via-emerald-500/20 to-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={() => handleClose(12)}
                    className="absolute top-4 right-4 z-20 p-2.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 backdrop-blur transition-all duration-200"
                    aria-label="Close promotion"
                >
                    <IoClose className="w-5 h-5" />
                </button>

                {/* Top Badge Strip */}
                <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 px-6 py-2.5 text-center text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm">
                    <IoFlashOutline className="w-4 h-4 animate-bounce" />
                    <span>{badgeText}</span>
                    <IoSparkles className="w-3.5 h-3.5" />
                </div>

                <div className="p-6 sm:p-8 text-center relative z-10">
                    {/* Big Discount Visual */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <IoSparkles className="w-3.5 h-3.5" />
                        Exclusive Visitor Offer
                    </div>

                    <h2 id="promo-title" className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                        {rawTitle.includes(highlightText) ? (
                            <>
                                {rawTitle.split(highlightText)[0]}
                                <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">{highlightText}</span>
                                {rawTitle.split(highlightText)[1]}
                            </>
                        ) : rawTitle}
                    </h2>

                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                        {description}
                    </p>

                    {/* Countdown Timer */}
                    <div className="my-5 flex items-center justify-center gap-2.5 sm:gap-3 text-neutral-800 dark:text-neutral-100">
                        <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl px-3.5 py-2 min-w-[58px] border border-neutral-200/60 dark:border-neutral-700/60">
                            <span className="text-xl font-bold font-mono">
                                {String(timeLeft.hours).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-neutral-500 dark:text-neutral-400">Hours</span>
                        </div>
                        <span className="text-xl font-bold text-neutral-400 pb-3">:</span>
                        <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl px-3.5 py-2 min-w-[58px] border border-neutral-200/60 dark:border-neutral-700/60">
                            <span className="text-xl font-bold font-mono">
                                {String(timeLeft.minutes).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-neutral-500 dark:text-neutral-400">Mins</span>
                        </div>
                        <span className="text-xl font-bold text-neutral-400 pb-3">:</span>
                        <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl px-3.5 py-2 min-w-[58px] border border-neutral-200/60 dark:border-neutral-700/60">
                            <span className="text-xl font-bold font-mono text-rose-500">
                                {String(timeLeft.seconds).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-neutral-500 dark:text-neutral-400">Secs</span>
                        </div>
                    </div>

                    {/* Coupon Code Pill */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 border-2 border-dashed border-rose-300 dark:border-rose-800/60 rounded-2xl p-3 flex items-center justify-between gap-3 max-w-sm mx-auto mb-5">
                        <div className="text-left pl-2">
                            <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Coupon / Gift Code</div>
                            <div className="font-mono font-extrabold text-base sm:text-lg text-rose-600 dark:text-rose-400 tracking-wider">
                                {discountCode}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                                copied 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <IoCheckmark className="w-4 h-4" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <IoCopyOutline className="w-4 h-4" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Email Newsletter Input or Shop CTA */}
                    {!subscribed ? (
                        <form onSubmit={handleSubscribe} className="space-y-3 max-w-sm mx-auto">
                            <div className="relative">
                                <IoMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email for instant code"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="submit"
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5"
                                >
                                    <span>{ctaText}</span>
                                </button>
                                <Link
                                    href={shopUrl}
                                    onClick={() => handleClose(6)}
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span>Shop Now</span>
                                    <IoArrowForward className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-medium animate-fadeIn">
                            🎉 Awesome! You're subscribed and code <strong>{discountCode}</strong> has been copied to your clipboard.
                        </div>
                    )}

                    {/* Bottom fine print */}
                    <p className="mt-4 text-[11px] text-neutral-400 dark:text-neutral-500">
                        *Valid on orders over $50. No spam, unsubscribe anytime.{' '}
                        <button 
                            type="button" 
                            onClick={() => handleClose(72)} 
                            className="underline hover:text-neutral-600 dark:hover:text-neutral-300 ml-1"
                        >
                            Don't show again
                        </button>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.92) translateY(12px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-scaleUp {
                    animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
