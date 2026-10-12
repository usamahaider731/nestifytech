import React from 'react';
import { Link } from '@inertiajs/react';
import { RiCustomerService2Fill, RiMailLine, RiPhoneLine, RiTimeLine, RiArrowRightLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function ContactCardWidget({ className = '' }) {
    const { __ } = useLang();

    return (
        <div className={`relative overflow-hidden rounded border border-primary/25 bg-gradient-to-br from-primary/10 via-bg to-primary/5 p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
            {/* Ambient decorative glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                        <RiCustomerService2Fill size={22} />
                    </div>
                    <div>
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-0.5">
                            {__('Dedicated Support')}
                        </span>
                        <h3 className="text-sm font-bold text-heading font-oswald uppercase tracking-wider">
                            {__('Need Assistance?')}
                        </h3>
                    </div>
                </div>

                <p className="text-xs text-res/80 leading-relaxed mb-4">
                    {__('Have questions regarding our terms, orders, or policies? Our customer support team is available 24/7.')}
                </p>

                <div className="space-y-2 mb-4 text-xs">
                    <a
                        href="mailto:support@nestifytech.com"
                        className="flex items-center gap-2.5 text-res/80 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-white/60"
                    >
                        <RiMailLine size={15} className="text-primary shrink-0" />
                        <span className="truncate">support@nestifytech.com</span>
                    </a>
                    <a
                        href="tel:+18001234567"
                        className="flex items-center gap-2.5 text-res/80 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-white/60"
                    >
                        <RiPhoneLine size={15} className="text-primary shrink-0" />
                        <span>+1 (800) 123-4567</span>
                    </a>
                    <div className="flex items-center gap-2.5 text-res/70 py-1 px-2">
                        <RiTimeLine size={15} className="text-primary shrink-0" />
                        <span>{__('Mon - Sat: 9:00 AM - 8:00 PM')}</span>
                    </div>
                </div>

                <Link
                    href={route('page.single', 'contact-us')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.01]"
                >
                    <span>{__('Get in Touch')}</span>
                    <RiArrowRightLine size={14} />
                </Link>
            </div>
        </div>
    );
}
