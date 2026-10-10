import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { RiSearchLine, RiCalendarLine, RiFolder3Line, RiArrowRightLine, RiNewspaperLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function BlogIndex({ blogs, recent_blogs = [], categories = [], filters = {} }) {
    const { __ } = useLang();
    const [search, setSearch] = useState(filters.search || '');
    const blogList = Array.isArray(blogs?.data) ? blogs.data : (Array.isArray(blogs) ? blogs : []);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('blog.index'), { search, category: filters.category }, { preserveState: true });
    };

    const handleCategorySelect = (catId) => {
        const newCat = filters.category === catId ? '' : catId;
        router.get(route('blog.index'), { search: filters.search, category: newCat }, { preserveState: true });
    };

    return (
        <FrontendLayout title={__('Blog & Articles')}>
            <Head title="Blog & News" />
            <div className="bg-bg min-h-screen text-res font-primary pb-16">
                {/* Hero Header */}
                <div className="relative bg-gradient-to-r from-common via-bg to-common/90 border-b border-border/40 py-16 px-4 sm:px-6 lg:px-8">
                    <div className="container mx-auto max-w-6xl text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                            <RiNewspaperLine size={16} />
                            <span>{__('Articles & Insights')}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading font-oswald tracking-tight">
                            {__('Latest News & Blog Posts')}
                        </h1>
                        <p className="mt-3 max-w-2xl mx-auto text-base text-res/80">
                            {__('Discover trends, expert reviews, and in-depth guides curated just for you.')}
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex items-center shadow-lg rounded-xl overflow-hidden bg-white/10 border border-border/40 backdrop-blur-md">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={__('Search articles by keyword...')}
                                    className="w-full bg-transparent px-5 py-3.5 text-heading placeholder-res/60 text-sm border-0 ring-0 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-primary text-white px-6 py-3.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <RiSearchLine size={18} />
                                <span className="hidden sm:inline">{__('Search')}</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Articles Grid */}
                        <div className="lg:col-span-3">
                            {blogList.length === 0 ? (
                                <div className="text-center py-16 px-4 bg-accent/20 rounded-2xl border border-dashed border-border">
                                    <RiNewspaperLine className="mx-auto size-14 text-res/40 mb-3" />
                                    <h3 className="text-lg font-bold text-heading">{__('No Blog Articles Found')}</h3>
                                    <p className="text-sm text-res mt-1">{__('Try adjusting your search query or category filter.')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {blogList.map((blog) => {
                                        const dateStr = blog.created_at
                                            ? new Date(blog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                            : null;
                                        const cats = Array.isArray(blog.category) ? blog.category : [];

                                        return (
                                            <article
                                                key={blog.id}
                                                className="group rounded border border-border/60 hover:border-primary/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                                            >
                                                <div className="relative h-52 w-full overflow-hidden bg-dynamic">
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
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {blogs?.links && blogs.links.length > 3 && (
                                <div className="mt-10 flex justify-center gap-2">
                                    {blogs.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                                                link.active
                                                    ? 'bg-primary text-white border-primary font-bold'
                                                    : 'bg-accent/40 text-res border-border hover:border-primary/50'
                                            } ${!link.url ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Categories Widget */}
                            {categories.length > 0 && (
                                <div className="bg-accent/30 rounded-2xl p-6 border border-border/60 shadow-sm">
                                    <h3 className="text-lg font-bold text-heading border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
                                        <RiFolder3Line className="text-primary" />
                                        <span>{__('Categories')}</span>
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat.id)}
                                                className={`text-left text-sm py-2 px-3 rounded-lg transition-all flex items-center justify-between ${
                                                    String(filters.category) === String(cat.id)
                                                        ? 'bg-primary text-white font-bold shadow-sm'
                                                        : 'hover:bg-accent/60 text-res'
                                                }`}
                                            >
                                                <span>{cat.title}</span>
                                                
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Blogs Widget */}
                            {recent_blogs.length > 0 && (
                                <div className="bg-accent/30 rounded-2xl p-6 border border-border/60 shadow-sm">
                                    <h3 className="text-lg font-bold text-heading border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
                                        <RiNewspaperLine className="text-primary" />
                                        <span>{__('Recent Posts')}</span>
                                    </h3>
                                    <div className="space-y-4">
                                        {recent_blogs.map((item) => (
                                            <div key={item.id} className="flex gap-3 group">
                                                <div className="size-16 rounded-xl overflow-hidden bg-dynamic shrink-0">
                                                    {item.image ? (
                                                        <ImageViwer image={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-accent flex items-center justify-center text-res/30">
                                                            <RiNewspaperLine size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-semibold text-heading line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                                        <Link href={route('blog.single', { idOrSku: item.sku || item.id })}>
                                                            {item.title}
                                                        </Link>
                                                    </h4>
                                                    <span className="text-[11px] text-res/60 mt-1 block">
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}
