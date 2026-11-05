import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useLang } from '@/contexts/LanguageContext';
import { buildPalettesFromTypes } from '@/Utils/colorPalettes';
import { applyThemeColors } from '@/Utils/applyThemeColors';
import {
    RiHome4Line,
    RiArrowGoBackLine,
    RiSearchLine,
    RiRefreshLine,
    RiShieldCrossLine,
    RiCompass3Line,
    RiServerLine,
    RiLock2Line,
    RiErrorWarningLine,
} from 'react-icons/ri';

const ERROR_DETAILS = {
    404: {
        badge: '404 Error',
        title: 'Page Not Found',
        description: "Sorry, the page you are looking for doesn't exist, has been removed, or is temporarily unavailable.",
        icon: RiCompass3Line,
        color: 'from-amber-500/20 via-primary/10 to-transparent',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    403: {
        badge: '403 Forbidden',
        title: 'Access Denied',
        description: 'You do not have permission to view or access this resource. Please verify your credentials or contact administrator.',
        icon: RiLock2Line,
        color: 'from-rose-500/20 via-primary/10 to-transparent',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    419: {
        badge: '419 Expired',
        title: 'Page / Session Expired',
        description: 'Your security token or session has expired due to inactivity. Please refresh the page and try again.',
        icon: RiRefreshLine,
        color: 'from-blue-500/20 via-primary/10 to-transparent',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    500: {
        badge: '500 Server Error',
        title: 'Internal Server Error',
        description: 'Something went wrong on our servers. Our technical team has been notified and is looking into it.',
        icon: RiServerLine,
        color: 'from-red-500/20 via-primary/10 to-transparent',
        badgeColor: 'bg-red-100 text-red-800 border-red-200',
    },
    503: {
        badge: '503 Maintenance',
        title: 'Service Temporarily Unavailable',
        description: 'We are currently performing routine maintenance or updates. We will be back online shortly.',
        icon: RiShieldCrossLine,
        color: 'from-indigo-500/20 via-primary/10 to-transparent',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
};

const STORAGE_KEY = 'nestify-site-color-theme';

function paletteToColors(palette) {
    const colors = { ...palette };
    delete colors.label;
    delete colors.swatch;
    return colors;
}

export default function ErrorPage({ status = 404, message = null }) {
    const { setting } = usePage().props || {};
    const { __ } = useLang();

    useEffect(() => {
        try {
            const themes = setting?.color?.color_types?.value ?? [];
            const defaultKey = setting?.color?.color_type?.value ?? '';
            const palettes = buildPalettesFromTypes(themes);
            const paletteKeys = Object.keys(palettes);
            const saved = localStorage.getItem(STORAGE_KEY);
            const key = (saved && palettes[saved]) ? saved : ((defaultKey && palettes[defaultKey]) ? defaultKey : (paletteKeys[0] || ''));
            if (key && palettes[key]) {
                applyThemeColors(paletteToColors(palettes[key]));
            }
        } catch (e) {}
    }, [setting]);
    const statusCode = Number(status) || 404;
    const config = ERROR_DETAILS[statusCode] || {
        badge: `${statusCode} Error`,
        title: 'Unexpected Error',
        description: message || 'An unexpected error occurred while processing your request.',
        icon: RiErrorWarningLine,
        color: 'from-slate-500/20 via-primary/10 to-transparent',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    };

    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-bg text-text flex flex-col">
            <Head title={`${statusCode} - ${__(config.title)}`} />

            <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-6 relative overflow-hidden bg-bg">
                {/* Background ambient glow */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[36rem] h-[36rem] rounded-full bg-primary/10 blur-3xl opacity-70" />
                </div>

                <div className="relative z-10 max-w-xl w-full text-center flex flex-col items-center">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider mb-6 ${config.badgeColor}`}>
                        <span className="size-2 rounded-full bg-current animate-pulse" />
                        {__(config.badge)}
                    </span>

                    {/* Big Visual Code */}
                    <div className="relative select-none mb-2">
                        <span className="text-8xl sm:text-9xl font-black tracking-tight text-heading/10 font-mono block">
                            {statusCode}
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-20 sm:size-24 rounded-2xl bg-white shadow-xl border border-border flex items-center justify-center text-primary transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                                <Icon className="size-10 sm:size-12" />
                            </div>
                        </div>
                    </div>

                    {/* Heading & Description */}
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-heading tracking-tight mb-3">
                        {__(config.title)}
                    </h1>
                    <p className="text-sm sm:text-base text-res max-w-md mx-auto leading-relaxed mb-8">
                        {message ? __(message) : __(config.description)}
                    </p>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold hover:brightness-95 shadow-md hover:shadow-lg transition-all"
                        >
                            <RiHome4Line size={18} />
                            <span>{__('Back to Home')}</span>
                        </Link>

                        {statusCode === 419 ? (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-border text-heading text-sm font-semibold hover:bg-slate-50 hover:border-primary/40 transition-all shadow-sm"
                            >
                                <RiRefreshLine size={18} />
                                <span>{__('Reload Page')}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-border text-heading text-sm font-semibold hover:bg-slate-50 hover:border-primary/40 transition-all shadow-sm"
                            >
                                <RiArrowGoBackLine size={18} />
                                <span>{__('Go Back')}</span>
                            </button>
                        )}

                        <Link
                            href={route('search')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-transparent text-heading text-sm font-medium hover:text-primary transition-colors"
                        >
                            <RiSearchLine size={17} />
                            <span>{__('Search Products')}</span>
                        </Link>
                    </div>

                    {/* Helpful Quick Links */}
                    <div className="mt-12 pt-8 border-t border-border w-full flex flex-wrap items-center justify-center gap-6 text-xs text-res font-medium">
                        <Link href={route('shop')} className="hover:text-primary transition-colors">
                            {__('Browse Shop')}
                        </Link>
                        <span>•</span>
                        <Link href={route('faqs')} className="hover:text-primary transition-colors">
                            {__('Help & FAQs')}
                        </Link>
                        <span>•</span>
                        <Link href="/track-order" className="hover:text-primary transition-colors">
                            {__('Track Order')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

