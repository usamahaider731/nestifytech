import React from 'react';
import { Link } from '@inertiajs/react';
import { RiGridLine, RiArrowRightSLine, RiFolderLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function CategoriesWidget({ categories = [], className = '' }) {
    const { __ } = useLang();
    const catList = Array.isArray(categories) ? categories : (categories?.data ?? []);

    if (!catList || catList.length === 0) {
        return null;
    }

    return (
        <div className={`bg-bg rounded border border-border/60 p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="flex items-center gap-2.5 pb-3.5 mb-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <RiGridLine size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-heading font-oswald uppercase tracking-wider">
                        {__('Explore Categories')}
                    </h3>
                    <p className="text-[11px] text-res/70">{__('Popular departments')}</p>
                </div>
            </div>

            <div className="space-y-1">
                {catList.slice(0, 8).map((cat) => (
                    <Link
                        key={cat.id}
                        href={route('taxonomy.view', {
                            type: 'category',
                            id: cat.id,
                            slug: cat.slug || cat.sku || cat.id,
                        })}
                        className="group flex items-center justify-between py-2 px-2.5 rounded-lg text-xs text-res/80 hover:text-primary hover:bg-common transition-all duration-200"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <RiFolderLine size={14} className="text-res/40 group-hover:text-primary shrink-0 transition-colors" />
                            <span className="truncate font-medium">{cat.title || cat.name}</span>
                        </div>
                        <RiArrowRightSLine
                            size={14}
                            className="shrink-0 text-res/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                        />
                    </Link>
                ))}
            </div>
        </div>
    );
}
