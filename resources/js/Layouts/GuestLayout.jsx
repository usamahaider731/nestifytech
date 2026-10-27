import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Link, usePage } from '@inertiajs/react';
import React from 'react';

export default function GuestLayout({ children }) {
    const { setting } = usePage().props;
    const siteTitle = setting?.site?.site_title?.value || 'NestifyTech';
    const logoLight = setting?.site?.light_logo?.value;
    const logoDark = setting?.site?.dark_logo?.value;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12 font-primary text-text">
            {/* Background subtle radial ambient gradients */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-3xl opacity-70" />
            </div>

            <div className="absolute top-4 right-4 z-20">
                <ThemeSwitcher />
            </div>

            {/* Brand Logo / Link */}
            <div className="relative z-10 mb-6 flex flex-col items-center">
                <Link href="/" className="inline-flex items-center gap-2 group transition-transform hover:scale-105">
                    {logoLight || logoDark ? (
                        <img
                            src={logoLight ? `/storage/uploads/image/${logoLight}` : `/storage/uploads/image/${logoDark}`}
                            alt={siteTitle}
                            className="h-10 w-auto object-contain"
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-2xl font-black text-heading tracking-tight">
                            <span className="text-primary font-black">N</span>
                            <span>{siteTitle}</span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Card Container */}
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-permanent/20 backdrop-blur-xs">
                {children}
            </div>

            {/* Footer note */}
            <div className="relative z-10 mt-6 text-center text-xs text-res">
                &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
            </div>
        </div>
    );
}
