import React from 'react';
import ImageViwer from './Admin/ImageViwer';
import { RiArrowRightLine, RiCalendarLine, RiNewspaperLine } from 'react-icons/ri';
import { Link } from '@inertiajs/react';
import { useLang } from '@/contexts/LanguageContext';
const ArticalCard = ({ blog }) => {
    const { __ } = useLang();
    const dateStr = blog.created_at
        ? new Date(blog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : null;
    const cats = Array.isArray(blog.category) ? blog.category : [];
    return (
        <article
            key={blog.id}
            className="group rounded border bg-white border-border/60 hover:border-primary/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
        >
            <div className="relative h-52 w-full overflow-hidden bg-accent/30">
                {blog.image ? (
                    <ImageViwer
                        image={blog.image}
                        alt={blog.title}
                        height={600}
                        width={600}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent text-res/40">
                        <RiNewspaperLine size={48} />
                    </div>
                )}
                {cats.length > 0 && (
                    <span className="absolute top-3 left-3 bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                        {typeof cats[0] === 'object' ? (cats[0].title || cats[0].name) : cats[0]}
                    </span>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-4 text-xs text-res mb-3">
                        {dateStr && (
                            <span className="flex items-center gap-1">
                                <RiCalendarLine size={14} className="text-primary" />
                                {dateStr}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-heading group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        <Link href={route('blog.single', { idOrSku: blog.sku || blog.id })}>
                            {blog.title}
                        </Link>
                    </h2>
                    <p className="mt-3 text-sm text-res/80 line-clamp-3 leading-relaxed">
                        {blog.short_description || (blog.description ? blog.description.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : '')}
                    </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                    <Link
                        href={route('blog.single', { idOrSku: blog.sku || blog.id })}
                        className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-wider"
                    >
                        <span>{__('Read Article')}</span>
                        <RiArrowRightLine size={16} />
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default ArticalCard;
