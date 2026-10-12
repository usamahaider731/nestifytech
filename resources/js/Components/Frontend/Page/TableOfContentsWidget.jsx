import React, { useEffect, useState, useMemo } from 'react';
import { RiListCheck2, RiArrowRightSLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@inertiajs/react';

export default function TableOfContentsWidget({ contentHtml = '', headings = null, className = '' }) {
    const { __ } = useLang();
    const [activeId, setActiveId] = useState('');

    // Extract headings from HTML if not passed directly
    const items = useMemo(() => {
        if (headings && Array.isArray(headings)) return headings;
        if (!contentHtml) return [];

        const list = [];
        const regex = /<(h[23])([^>]*)>(.*?)<\/\1>/gi;
        let match;

        while ((match = regex.exec(contentHtml)) !== null) {
            const tag = match[1].toLowerCase();
            const attrs = match[2];
            const rawContent = match[3];

            // Strip nested HTML tags
            const text = rawContent.replace(/<[^>]+>/g, '').trim();
            if (!text) continue;

            // Extract existing ID or generate one
            const idMatch = attrs.match(/id=["']([^"']+)["']/i);
            const id = idMatch
                ? idMatch[1]
                : text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

            list.push({
                id,
                text,
                level: tag === 'h2' ? 2 : 3,
            });
        }
        return list;
    }, [contentHtml, headings]);

    // Track active heading on scroll
    useEffect(() => {
        if (items.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-80px 0px -70% 0px',
                threshold: 0.1,
            }
        );

        items.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [items]);

    if (items.length < 2) {
        return null;
    }

    const scrollToHeading = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 90; // Header offset
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
            setActiveId(id);
            try {
                window.history.pushState(null, '', `#${id}`);
            } catch (_) {}
        }
    };

    return (
        <div className={`bg-bg rounded border border-border/60 p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="flex items-center gap-2.5 pb-3.5 mb-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <RiListCheck2 size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-heading font-oswald uppercase tracking-wider">
                        {__('Table of Contents')}
                    </h3>
                    <p className="text-[11px] text-res/70">{items.length} {__('sections')}</p>
                </div>
            </div>

            <nav className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                {items.map((item, index) => {
                    const isActive = activeId === item.id;
                    return (
                        <Link
                            key={`${item.id}-${index}`}
                            href={`#${item.id}`}
                            onClick={(e) => scrollToHeading(e, item.id)}
                            className={`group flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-all duration-200 ${
                                item.level === 3 ? 'ml-3 text-[11px]' : ''
                            } ${
                                isActive
                                    ? 'bg-primary/10 text-primary font-bold shadow-xs border-l-2 border-primary'
                                    : 'text-res/80 hover:text-heading hover:bg-common'
                            }`}
                        >
                            <span className="truncate pr-2">{item.text}</span>
                            <RiArrowRightSLine
                                size={14}
                                className={`shrink-0 transition-transform duration-200 ${
                                    isActive
                                        ? 'text-primary translate-x-0.5'
                                        : 'text-res/30 opacity-0 group-hover:opacity-100'
                                }`}
                            />
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
