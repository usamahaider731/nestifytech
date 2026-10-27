import React, { useState, useEffect } from 'react';
import {

    RiShieldCheckLine,
    RiBarChartLine,
    RiMegaphoneLine,
    RiSettings4Line,
    RiArrowDownSLine,
    RiArrowUpSLine,
} from 'react-icons/ri';
import { TbCookie } from 'react-icons/tb';

const COOKIE_KEY = 'nt_cookie_consent';
const COOKIE_VERSION = '1';

const defaultPrefs = {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
};

function loadSavedConsent() {
    try {
        const raw = localStorage.getItem(COOKIE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.version !== COOKIE_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}

function saveConsent(prefs) {
    const payload = {
        version: COOKIE_VERSION,
        consentedAt: new Date().toISOString(),
        prefs,
    };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: payload }));
}

const CATEGORIES = [
    {
        key: 'necessary',
        Icon: RiShieldCheckLine,
        label: 'Strictly Necessary',
        description:
            'Essential for the website to function. Cannot be disabled. Covers session management, cart, checkout, and security tokens.',
        locked: true,
    },
    {
        key: 'analytics',
        Icon: RiBarChartLine,
        label: 'Analytics',
        description:
            'Help us understand how visitors interact with our website by collecting anonymous usage data, page views, and performance metrics.',
        locked: false,
    },
    {
        key: 'marketing',
        Icon: RiMegaphoneLine,
        label: 'Marketing',
        description:
            'Used to track visitors across websites to display relevant advertisements and enable us to show personalised offers.',
        locked: false,
    },
    {
        key: 'preferences',
        Icon: RiSettings4Line,
        label: 'Preferences',
        description:
            'Remember your settings such as language, currency, theme, and personalised product recommendations based on your interests.',
        locked: false,
    },
];

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [prefs, setPrefs] = useState(defaultPrefs);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const saved = loadSavedConsent();
        if (!saved) {
            const t = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(t);
        }
    }, []);

    const dismiss = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setVisible(false);
        }, 350);
    };

    const handleAcceptAll = () => {
        const all = { necessary: true, analytics: true, marketing: true, preferences: true };
        setPrefs(all);
        saveConsent(all);
        dismiss();
    };

    const handleRejectAll = () => {
        const minimal = { necessary: true, analytics: false, marketing: false, preferences: false };
        setPrefs(minimal);
        saveConsent(minimal);
        dismiss();
    };

    const handleSaveCustom = () => {
        saveConsent(prefs);
        dismiss();
    };

    const togglePref = (key) => {
        if (key === 'necessary') return;
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (!visible) return null;

    return (
        <>
            {/* Soft backdrop */}
            <div
                className="fixed w-full inset-0 z-[2000] bg-black/25 backdrop-blur-[2px] pointer-events-none"
                aria-hidden="true"
            />

            {/* Full-width fixed row at the bottom — flex centres the panel */}
            <div
                className="fixed bottom-4 left-0 right-0 z-[2001] flex justify-center px-3 pointer-events-none"
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Cookie Consent"
                    className="w-full max-w-2xl pointer-events-auto"
                    style={{ animation: 'cookieBannerIn 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
                >
                <style>{`
                    @keyframes cookieBannerIn {
                        from { opacity: 0; transform: translateY(24px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                `}</style>


                <div className="bg-white border border-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Top colour bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30" />

                    <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className="shrink-0 size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                                <TbCookie size={22} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-sm font-bold text-heading leading-snug">
                                    We value your privacy 🍪
                                </h2>
                                <p className="mt-1 text-[11px] sm:text-xs text-res leading-relaxed">
                                    We use cookies to enhance your browsing experience, personalise content &amp; ads,
                                    analyse traffic, and provide social features. Clicking{' '}
                                    <strong className="text-heading">"Accept All"</strong> consents to all cookies.
                                    You may also customise your preferences.{' '}
                                    <a
                                        href="/privacy-policy"
                                        className="text-primary hover:underline font-semibold"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Privacy Policy ↗
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Expandable category toggles */}
                        {showDetails && (
                            <div className="mb-4 border border-border rounded-xl overflow-hidden divide-y divide-border text-sm">
                                {CATEGORIES.map(({ key, Icon, label, description, locked }) => (
                                    <div
                                        key={key}
                                        className="flex items-start gap-3 p-3.5 bg-bg/40 hover:bg-bg/70 transition-colors"
                                    >
                                        <Icon size={15} className="shrink-0 mt-0.5 text-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-heading">{label}</p>
                                            <p className="text-[11px] text-res mt-0.5 leading-relaxed">
                                                {description}
                                            </p>
                                        </div>
                                        <div className="shrink-0 ml-3 mt-0.5">
                                            {locked ? (
                                                <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                    Always On
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={prefs[key]}
                                                    onClick={() => togglePref(key)}
                                                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${prefs[key] ? 'bg-primary' : 'bg-gray-200'
                                                        }`}
                                                    title={prefs[key] ? 'Enabled' : 'Disabled'}
                                                >
                                                    <span
                                                        className={`inline-block size-4 mt-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ${prefs[key] ? 'translate-x-4.5' : 'translate-x-0.5'
                                                            }`}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action row */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                            {/* Toggle link */}
                            <button
                                type="button"
                                onClick={() => setShowDetails((v) => !v)}
                                className="flex items-center gap-1 text-xs font-medium text-res hover:text-primary transition-colors sm:mr-auto"
                            >
                                {showDetails ? <RiArrowUpSLine size={14} /> : <RiArrowDownSLine size={14} />}
                                {showDetails ? 'Hide details' : 'Customise preferences'}
                            </button>

                            {/* Reject All */}
                            <button
                                id="cookie-reject-all"
                                type="button"
                                disabled={saving}
                                onClick={handleRejectAll}
                                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg border border-border text-res hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer whitespace-nowrap"
                            >
                                Reject All
                            </button>

                            {/* Save Preferences — only in expanded mode */}
                            {showDetails && (
                                <button
                                    id="cookie-save-preferences"
                                    type="button"
                                    disabled={saving}
                                    onClick={handleSaveCustom}
                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg border border-primary text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer whitespace-nowrap"
                                >
                                    Save Preferences
                                </button>
                            )}

                            {/* Accept All */}
                            <button
                                id="cookie-accept-all"
                                type="button"
                                disabled={saving}
                                onClick={handleAcceptAll}
                                className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:brightness-95 transition-all duration-200 cursor-pointer shadow-sm whitespace-nowrap"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </>
    );
}


export function useCookieConsent() {
    const [consent, setConsent] = useState(() => loadSavedConsent());

    useEffect(() => {
        const handler = (e) => setConsent(e.detail);
        window.addEventListener('cookieConsentUpdated', handler);
        return () => window.removeEventListener('cookieConsentUpdated', handler);
    }, []);

    return {
        hasConsented: !!consent,
        prefs: consent?.prefs ?? defaultPrefs,
        consentedAt: consent?.consentedAt ?? null,
    };
}
