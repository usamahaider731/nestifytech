import React from 'react';
import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { RiCalendarLine, RiFolder3Line, RiArrowLeftLine, RiNewspaperLine, RiPriceTag3Line } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function BlogSingle({ blog, recent_blogs = [], categories = [] }) {
    const { __ } = useLang();
    
    if (!blog) return null;

    const dateStr = blog.created_at
        ? new Date(blog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    const blogCategories = Array.isArray(blog.blog_category) ? blog.blog_category : [];
    const tags = Array.isArray(blog.tags) ? blog.tags : [];
    const gallery = Array.isArray(blog.gallery) ? blog.gallery : [];

    return (
        <FrontendLayout title={blog.title}>
            <Head title={blog.seo_title || blog.title}>
                {blog.seo_description && <meta name="description" content={blog.seo_description} />}
                {blog.seo_keywords && <meta name="keywords" content={blog.seo_keywords} />}
            </Head>

            <article className=" min-h-screen text-res font-primary pb-20">
                {/* Back to Blog Navigation Bar */}
                <div className="bg-bg border-b border-border/40 py-4 px-4 sm:px-6 lg:px-8">
                    <div className="container mx-auto flex items-center justify-between">
                        <Link
                            href={route('blog.index')}
                            className="inline-flex items-center gap-2 text-xs font-bold text-res hover:text-primary transition-colors uppercase tracking-wider"
                        >
                            <RiArrowLeftLine size={16} />
                            <span>{__('Back to Articles')}</span>
                        </Link>
                    </div>
                </div>

                {/* Main Content Grid (Article + Sidebar) */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Main Article Column */}
                        <div className="lg:col-span-8 flex flex-col space-y-12">
                            {/* Article Header */}
                            <div className='flex flex-col'>
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    {blogCategories.map((cat, idx) => (
                                        <span
                                            key={idx}
                                            className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                                        >
                                            {typeof cat === 'object' ? (cat.title || cat.name) : cat}
                                        </span>
                                    ))}
                                </div>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-heading font-oswald leading-tight tracking-tight">
                                    {blog.title}
                                </h1>

                                <div className="flex items-center gap-6 mt-4 pb-6 border-b border-border/40 text-xs text-res">
                                    {dateStr && (
                                        <span className="flex items-center gap-1.5">
                                            <RiCalendarLine size={16} className="text-primary" />
                                            <span>{dateStr}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Main Featured Image */}
                            {blog.image && (
                                <div className="rounded shadow-2xl max-h-100 border border-border/60 bg-dynamic">
                                    <ImageViwer
                                        image={blog.image}
                                        alt={blog.title}
                                        height={900}
                                        width={900}
                                        className="w-full max-h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Short Description Excerpt */}
                            {blog?.meta?.short_description && (
                                <div className="p-6 bg-bg rounded-2xl border-l-4 border-primary border text-heading text-lg font-medium italic">
                                    "{blog?.meta?.short_description.value}"
                                </div>
                            )}

                            {/* Rich Content */}
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none text-res leading-relaxed tracking-wide space-y-4 pt-2"
                                dangerouslySetInnerHTML={{ __html: blog.description || '' }}
                            />

                            {/* Gallery Images */}
                            {gallery.length > 0 && (
                                <div className="mt-12 pt-8 border-t border-border/40">
                                    <h3 className="text-xl font-bold text-heading mb-6">{__('Article Gallery')}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {gallery.map((img, idx) => (
                                            <div key={idx} className="overflow-hidden shadow-md border border-border/40 h-40 bg-bg">
                                                <ImageViwer image={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Article Tags */}
                            {tags.length > 0 && (
                                <div className="mt-10 pt-6 border-t border-border/40 flex items-center gap-3 flex-wrap">
                                    <RiPriceTag3Line className="text-primary" size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-heading">{__('Tags:')}</span>
                                    {tags.map((tag, idx) => (
                                        <span key={idx} className="bg-bg text-res text-xs px-3 py-1 rounded-lg border border-border/40">
                                            #{typeof tag === 'object' ? (tag.title || tag.name) : tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar Column */}
                        <aside className="lg:col-span-4 space-y-8 sticky top-24">
                            {/* Categories Widget */}
                            {categories.length > 0 && (
                                <div className="bg-bg rounded border border-border/60 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-heading font-oswald uppercase tracking-wider border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
                                        <RiFolder3Line className="text-primary" size={18} />
                                        <span>{__('Categories')}</span>
                                    </h3>
                                    <ul className="space-y-2.5">
                                        {categories.map((cat) => (
                                            <li key={cat.id}>
                                                <Link
                                                    href={route('blog.index', { category: cat.slug || cat.id })}
                                                    className="flex items-center justify-between text-sm font-medium text-res hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-bg/40"
                                                >
                                                    <span>{cat.title}</span>
                                                    <span className="text-xs bg-common px-2 py-0.5 rounded-full border border-border/40 text-res/70">
                                                        {cat.all_blogs ? cat.all_blogs.length : 0}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recent Articles Widget */}
                            {recent_blogs.length > 0 && (
                                <div className="bg-bg rounded-2xl border border-border/60 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-heading font-oswald uppercase tracking-wider border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
                                        <RiNewspaperLine className="text-primary" size={18} />
                                        <span>{__('Recent Posts')}</span>
                                    </h3>
                                    <div className="space-y-4">
                                        {recent_blogs.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 group">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-dynamic flex-shrink-0 border border-border/40">
                                                    {item.image ? (
                                                        <ImageViwer
                                                            image={item.image}
                                                            alt={item.title}
                                                            width={100}
                                                            height={100}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-accent flex items-center justify-center text-res/30">
                                                            <RiNewspaperLine size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold text-heading group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                                        <Link href={route('blog.single', { idOrSku: item.sku || item.id })}>
                                                            {item.title}
                                                        </Link>
                                                    </h4>
                                                    <span className="text-[11px] text-res/60 mt-1 block">
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>
                    </div>

                    {/* Related Articles Bottom Grid */}
                    {recent_blogs.length > 0 && (
                        <div className="mt-16 pt-12 border-t border-border/60">
                            <h2 className="text-2xl font-bold text-heading font-oswald mb-8 flex items-center gap-2">
                                <RiNewspaperLine className="text-primary" />
                                <span>{__('Related Articles')}</span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {recent_blogs.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-bg rounded-2xl border border-border/60 overflow-hidden hover:border-primary/40 transition-all flex flex-col group shadow-sm"
                                    >
                                        <div className="h-40 w-full overflow-hidden bg-dynamic">
                                            {item.image ? (
                                                <ImageViwer image={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full bg-bg flex items-center justify-center text-res/30">
                                                    <RiNewspaperLine size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <h3 className="text-base font-bold text-heading group-hover:text-primary transition-colors line-clamp-2">
                                                <Link href={route('blog.single', { idOrSku: item.sku || item.id })}>
                                                    {item.title}
                                                </Link>
                                            </h3>
                                            <span className="text-xs text-res/60 mt-3 block">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </FrontendLayout>
    );
}
