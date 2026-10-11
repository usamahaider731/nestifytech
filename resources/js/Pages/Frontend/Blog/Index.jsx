import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { RiSearchLine, RiCalendarLine, RiFolder3Line, RiArrowRightLine, RiNewspaperLine, RiArrowRightSLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import ArticalCard from '@/Components/ArticalCard';

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
            <div className="bg-white min-h-screen text-res font-primary pb-16">
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
                                <div className="text-center py-16 px-4 bg-bg rounded border border-dashed border-border">
                                    <RiNewspaperLine className="mx-auto size-14 text-res/40 mb-3" />
                                    <h3 className="text-lg font-semibold font-poppins text-heading">{__('No Blog Articles Found')}</h3>
                                    <p className="text-sm text-res font-roboto mt-1">{__('Try adjusting your search query or category filter.')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {blogList.map((blog) => {
                                      

                                        return (
                                           <ArticalCard blog={blog} />
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
                                <div className="bg-bg rounded p-6 border border-border/60 shadow-sm">
                                    <h3 className="text-lg font-bold text-heading border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
                                        <RiFolder3Line className="text-primary" />
                                        <span>{__('Categories')}</span>
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat.id)}
                                                className={`text-left text-sm py-2 px-3 rounded transition-all flex items-center justify-between ${
                                                    String(filters.category) === String(cat.id)
                                                        ? 'bg-primary text-white font-semibold'
                                                        : 'hover:bg-bg text-res'
                                                }`}
                                            >
                                                <span>{cat.title}</span>
                                                <RiArrowRightSLine size={16} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Blogs Widget */}
                            {recent_blogs.length > 0 && (
                                <div className="bg-bg rounded p-6 border border-border/60 shadow-sm">
                                    <h3 className="text-lg font-bold text-heading border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
                                        <RiNewspaperLine className="text-primary" />
                                        <span>{__('Recent Posts')}</span>
                                    </h3>
                                    <div className="space-y-4">
                                        {recent_blogs.map((item) => (
                                            <div key={item.id} className="flex gap-3 group">
                                                <div className="size-16 rounded overflow-hidden bg-dynamic shrink-0">
                                                    {item.image ? (
                                                        <ImageViwer image={item.image} alt={item.title} height={400} width={400} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-accent flex items-center justify-center text-res/30">
                                                            <RiNewspaperLine size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-semibold font-roboto text-heading line-clamp-2 group-hover:text-primary transition-colors leading-tight">
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
