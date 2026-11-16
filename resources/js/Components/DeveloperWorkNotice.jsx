import React, { useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { IoClose, IoConstructOutline, IoMailOutline } from 'react-icons/io5';
import { hasPermission } from '@/Utils/helper';

const PREVIEW_KEY = 'nt_dev_work_preview';

function isEnabled(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function readPreviewFlag() {
    try {
        return sessionStorage.getItem(PREVIEW_KEY) === '1';
    } catch (e) {
        return false;
    }
}

export default function DeveloperWorkNotice() {
    const { setting, auth } = usePage().props;
    const site = setting?.site || {};
    const enabled = isEnabled(site.developer_work_enabled?.value);
    const mode = site.developer_work_mode?.value === 'overlay' ? 'overlay' : 'banner';
    const title = site.developer_work_title?.value || 'Developer is currently working on this site';
    const message = site.developer_work_message?.value
        || 'We are actively building and testing this store. Thank you for your patience.';
    const siteName = site.name?.value || 'this store';
    const contactEmail = site.contact_email?.value || '';
    const canPreview = Boolean(auth?.user) && hasPermission(auth.user, 'setting-write');

    const [previewing, setPreviewing] = useState(readPreviewFlag);
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const showOverlay = useMemo(
        () => enabled && mode === 'overlay' && !previewing,
        [enabled, mode, previewing]
    );

    if (!enabled || bannerDismissed) {
        return null;
    }

    const enterPreview = () => {
        try {
            sessionStorage.setItem(PREVIEW_KEY, '1');
        } catch (e) {
            // ignore
        }
        setPreviewing(true);
    };

    if (showOverlay) {
        return (
            <div
                className="fixed inset-0 z-[99995] flex items-center justify-center p-4 sm:p-8 bg-neutral-950/80 backdrop-blur-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dev-work-title"
            >
                <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-white dark:bg-neutral-900 shadow-2xl">
                    <div className="bg-gradient-to-r from-primary via-indigo-600 to-secondary px-6 py-3 text-center text-white text-xs font-roboto font-semibold tracking-wider uppercase flex items-center justify-center gap-2">
                        <IoConstructOutline className="w-4 h-4" />
                        <span>Under development</span>
                    </div>

                    <div className="p-6 sm:p-8 text-center">
                        <h2 id="dev-work-title" className="text-2xl sm:text-3xl font-poppins font-bold text-neutral-900 dark:text-white tracking-tight">
                            {title}
                        </h2>
                        <p className="mt-3 text-sm font-roboto text-neutral-600 dark:text-neutral-400">
                            {message}
                        </p>
                        <p className="mt-2 text-xs font-roboto text-neutral-400">
                            {siteName} is not fully launched yet. This notice appears once on every page.
                        </p>

                        {contactEmail && (
                            <a
                                href={`mailto:${contactEmail}`}
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <IoMailOutline className="w-4 h-4" />
                                {contactEmail}
                            </a>
                        )}

                        {canPreview && (
                            <button
                                type="button"
                                onClick={enterPreview}
                                className="mt-4 w-full rounded-xl bg-gradient-to-r from-secondary to-primary py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-secondary/25"
                            >
                                Preview storefront
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="sticky top-0 z-[60] w-full bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white"
            role="status"
        >
            <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <IoConstructOutline className="w-4 h-4 shrink-0" />
                    <p className="text-xs sm:text-sm font-roboto font-medium truncate">
                        <span className="font-semibold">{title}</span>
                        <span className="hidden sm:inline opacity-90"> — {message}</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setBannerDismissed(true)}
                    className="shrink-0 p-1.5 rounded-full hover:bg-white/15 transition-colors"
                    aria-label="Dismiss developer notice"
                >
                    <IoClose className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function isDeveloperOverlayActive(setting, previewing = false) {
    const site = setting?.site || {};
    const enabled = isEnabled(site.developer_work_enabled?.value);
    return enabled && site.developer_work_mode?.value === 'overlay' && !previewing;
}

export function AdminDeveloperWorkBanner() {
    const { setting } = usePage().props;
    const site = setting?.site || {};

    if (!isEnabled(site.developer_work_enabled?.value)) {
        return null;
    }

    const mode = site.developer_work_mode?.value === 'overlay' ? 'full-page overlay' : 'top banner';

    return (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-heading">
                Developer working mode is on. Storefront visitors see a single {mode} on every page.
            </p>
            <Link
                href={route('admin.setting', { type: 'site' })}
                className="text-sm font-semibold text-primary hover:underline"
            >
                Manage in Site Settings
            </Link>
        </div>
    );
}
