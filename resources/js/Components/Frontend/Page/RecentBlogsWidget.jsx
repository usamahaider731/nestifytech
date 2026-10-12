import React from 'react';
import { Link } from '@inertiajs/react';
import { RiArticleLine, RiCalendarLine, RiArrowRightLine } from 'react-icons/ri';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { useLang } from '@/contexts/LanguageContext';

export default function RecentBlogsWidget({ blogs = [], className = '' }) {
    const { __ } = useLang();
    const blogList = Array.isArray(blogs) ? blogs : (blogs?.data ?? []);

    if (!blogList || blogList.length === 0) {
        return null;
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch (_) {
            return dateStr;
        }
    };

    return (
        <div className={`bg-bg rounded border border-border/60 p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <RiArticleLine size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-heading font-oswald uppercase tracking-wider">
                            {__('Recent Articles')}
                        </h3>
                        <p className="text-[11px] text-res/70">{__('Latest news & insights')}</p>
                    </div>
                </div>
                <Link
                    href={route('blog.index')}
                    className="text-[11px] font-bold text-primary hover:underline"
                >
                    {__('View All')}
                </Link>
            </div>

            <div className="space-y-3.5">
                {blogList.slice(0, 4).map((blog) => (
                    <article key={blog.id} className="group flex items-start gap-3">
                        <Link
                            href={route('blog.single', blog.sku || blog.id)}
                            className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-dynamic border border-border/40"
                        >
                            {blog.image ? (
                                <ImageViwer
                                    image={blog.image}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40">
                                    <RiArticleLine size={22} />
                                </div>
                            )}
                        </Link>

                        <div className="flex-1 min-w-0">
                            {blog.created_at && (
                                <div className="flex items-center gap-1 text-[11px] text-res/60 mb-1">
                                    <RiCalendarLine size={12} />
                                    <span>{formatDate(blog.created_at)}</span>
                                </div>
                            )}
                            <h4 className="text-xs font-semibold text-heading group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                <Link href={route('blog.single', blog.sku || blog.id)}>
                                    {blog.title}
                                </Link>
                            </h4>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border/40">
                <Link
                    href={route('blog.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:gap-2 transition-all"
                >
                    <span>{__('Explore Blog & Guides')}</span>
                    <RiArrowRightLine size={14} />
                </Link>
            </div>
        </div>
    );
}
