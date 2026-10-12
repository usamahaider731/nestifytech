import React from 'react';
import { Link } from '@inertiajs/react';
import { RiSparkling2Fill, RiArrowRightLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function CustomCtaWidget({ widget = null, widgets = [], className = '' }) {
    const { __ } = useLang();
    const widgetList = Array.isArray(widgets) && widgets.length > 0
        ? widgets
        : (widget ? [widget] : []);

    if (widgetList.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {widgetList.map((item, index) => {
                if (!item || (!item.title && !item.content)) return null;

                const hasLink = Boolean(item.button_url || item.url);
                const buttonUrl = item.button_url || item.url || '#';
                const buttonText = item.button_text || item.button_label || __('Learn More');

                return (
                    <div
                        key={index}
                        className="relative overflow-hidden rounded border border-primary/20 bg-gradient-to-br from-bg via-common to-primary/5 p-5 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <RiSparkling2Fill size={16} />
                            <span className="text-[10px] font-extrabold uppercase tracking-widest">
                                {__('Featured Highlight')}
                            </span>
                        </div>

                        {item.title && (
                            <h3 className="text-sm font-bold text-heading font-oswald mb-2">
                                {item.title}
                            </h3>
                        )}

                        {item.content && (
                            <p className="text-xs text-res/80 leading-relaxed mb-4">
                                {item.content}
                            </p>
                        )}

                        {hasLink && (
                            buttonUrl.startsWith('http') ? (
                                <a
                                    href={buttonUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    <span>{buttonText}</span>
                                    <RiArrowRightLine size={14} />
                                </a>
                            ) : (
                                <Link
                                    href={buttonUrl}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    <span>{buttonText}</span>
                                    <RiArrowRightLine size={14} />
                                </Link>
                            )
                        )}
                    </div>
                );
            })}
        </div>
    );
}
