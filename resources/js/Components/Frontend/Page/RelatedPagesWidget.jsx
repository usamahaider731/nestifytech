import React from 'react';
import { Link } from '@inertiajs/react';
import { RiPagesLine, RiFileTextLine, RiArrowRightSLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function RelatedPagesWidget({ pages = [], currentPageSlug = '', className = '' }) {
    const { __ } = useLang();
    const pageList = Array.isArray(pages) ? pages : (pages?.data ?? []);

    if (!pageList || pageList.length === 0) {
        return null;
    }

    return (
        <div className={`bg-bg rounded border border-border/60 p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="flex items-center gap-2.5 pb-3.5 mb-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <RiPagesLine size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-heading font-oswald uppercase tracking-wider">
                        {__('Company Pages')}
                    </h3>
                    <p className="text-[11px] text-res/70">{__('Policies & Information')}</p>
                </div>
            </div>

            <div className="space-y-1">
                {pageList.map((p) => {
                    const slug = p.sku || String(p.id);
                    const isActive = slug === currentPageSlug;

                    return (
                        <Link
                            key={p.id}
                            href={route('page.single', slug)}
                            className={`group flex items-center justify-between py-2 px-2.5 rounded text-xs transition-all duration-200 ${
                                isActive
                                    ? 'bg-primary/10 text-primary font-bold shadow-xs border-l-2 border-primary'
                                    : 'text-res/80 hover:text-heading hover:bg-common'
                            }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <RiFileTextLine
                                    size={14}
                                    className={`shrink-0 ${isActive ? 'text-primary' : 'text-res/40 group-hover:text-primary transition-colors'}`}
                                />
                                <span className="truncate">{p.title}</span>
                            </div>
                            <RiArrowRightSLine
                                size={14}
                                className={`shrink-0 transition-transform ${
                                    isActive
                                        ? 'text-primary translate-x-0.5'
                                        : 'text-res/30 opacity-0 group-hover:opacity-100'
                                }`}
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
