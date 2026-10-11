import React from 'react';
import { Link } from '@inertiajs/react';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { RiCalendarLine, RiArrowRightLine, RiNewspaperLine, RiFolder3Line } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import ArticalCard from '../ArticalCard';


export default function LatestBlogs({ blogs = [] }) {
    const { __ } = useLang();

    if (!blogs || blogs.length === 0) return null;


    return (
        <section className="py-14">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-8 gap-4">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-2">
                        <RiNewspaperLine size={14} />
                        {__('From Our Blog')}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-heading font-oswald leading-tight">
                        {__('Latest Articles & Insights')}
                    </h2>
                </div>
                <Link
                    href={route('blog.index')}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 rounded-full px-4 py-2 hover:bg-primary hover:text-white transition-colors"
                >
                    {__('View All')}
                    <RiArrowRightLine size={14} />
                </Link>
            </div>

            {/* Layout: featured (left) + list (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Featured Post */}
                {blogs.map((blog) => (
                    <ArticalCard key={blog.id} blog={blog} />
                ))}
            </div>
        </section>
    );
}
