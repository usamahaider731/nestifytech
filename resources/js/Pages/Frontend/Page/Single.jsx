import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import ImageViwer from '@/Components/Admin/ImageViwer';
import PageSidebar from '@/Components/Frontend/Page/PageSidebar';
import PageFooterSection from '@/Components/Frontend/Page/PageFooterSection';
import {
    RiArrowLeftLine,
    RiFileTextLine,
    RiHomeLine,
    RiArrowRightSLine,
    RiShareForwardLine,
    RiPrinterLine,
    RiCheckLine,
    RiTimeLine,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

/**
 * Helper: extract a scalar string/number value from post meta
 */
function getMeta(page, key) {
    if (!page?.meta) return null;
    if (Array.isArray(page.meta)) {
        const found = page.meta.find((m) => m.key === key);
        return found?.value ?? null;
    }
    if (typeof page.meta === 'object') {
        const entry = page.meta[key];
        if (!entry) return null;
        return typeof entry === 'object' ? (entry.value ?? null) : entry;
    }
    return null;
}

/**
 * Helper: safely extract and parse JSON array/object from post meta
 */
function getMetaJson(page, key, fallback = null) {
    const raw = getMeta(page, key);
    if (!raw) return fallback;
    if (Array.isArray(raw) || (typeof raw === 'object' && raw !== null)) {
        return raw;
    }
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch (_) {
            return raw;
        }
    }
    return fallback;
}

export default function PageSingle({
    page,
    recent_blogs = [],
    categories = [],
    other_pages = [],
    faqs = [],
}) {
    const { __ } = useLang();
    const [copied, setCopied] = useState(false);

    if (!page) return null;

    // Meta extraction
    const shortDescription = page.short_description ?? getMeta(page, 'short_description');
    const seoTitle         = page.seo_title        ?? getMeta(page, 'seo_title');
    const seoDescription   = page.seo_description  ?? getMeta(page, 'seo_description');
    const seoKeywords      = page.seo_keywords      ?? getMeta(page, 'seo_keywords');
    const layoutType = getMeta(page, 'layout_type') || (page.image ? 'sidebar_right' : 'narrow_center');
    const containerWidth = getMeta(page, 'container_width') || 'container';
    const headerStyle = getMeta(page, 'header_style') || 'hero_gradient';
    const showBreadcrumbs = getMeta(page, 'show_breadcrumbs') !== false && getMeta(page, 'show_breadcrumbs') !== 'false';
    const stickySidebar = getMeta(page, 'sticky_sidebar') !== false && getMeta(page, 'sticky_sidebar') !== 'false';
    const sidebarWidgets = getMetaJson(page, 'sidebar_widgets') || ['toc', 'recent_blogs', 'contact_card'];
    const customWidgets = getMetaJson(page, 'custom_widgets') || [];
    const footerWidget = getMeta(page, 'footer_widget') || 'none';
    const footerCtaTitle = getMeta(page, 'footer_cta_title') || '';
    const footerCtaDesc = getMeta(page, 'footer_cta_desc') || '';
    const footerCtaBtnText = getMeta(page, 'footer_cta_btn_text') || '';
    const footerCtaBtnUrl = getMeta(page, 'footer_cta_btn_url') || '';
    const containerClass = {
        narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
        container: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
        wide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        full: 'w-full px-4 sm:px-6 lg:px-8',
    }[containerWidth] || 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

    const processedContent = useMemo(() => {
        if (!page.description) return '';
        return page.description.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, content) => {
            if (/id=["'][^"']+["']/i.test(attrs)) {
                return match;
            }
            const text = content.replace(/<[^>]+>/g, '').trim();
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
        });
    }, [page.description]);

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const hasSidebar = layoutType === 'sidebar_right' || layoutType === 'sidebar_left';

    return (
        <FrontendLayout title={seoTitle || page.title}>
            <Head title={seoTitle || page.title}>
                {seoDescription && <meta name="description" content={seoDescription} />}
                {seoKeywords    && <meta name="keywords"    content={seoKeywords}    />}
            </Head>

            <div className="bg-white min-h-screen text-res font-primary pb-20">
                {/* ── HEADER STYLES ─────────────────────────────────────────── */}

                {/* 1. Hero Gradient Header */}
                {headerStyle === 'hero_gradient' && (
                    <div className="relative bg-gradient-to-r from-bg via-common to-bg/90 border-b border-border/40 py-14 sm:py-16 px-4 sm:px-6 lg:px-8">
                        <div className="container mx-auto max-w-4xl text-center">
                            {showBreadcrumbs && (
                                <nav className="flex items-center justify-center gap-1.5 text-xs text-res/70 mb-4">
                                    <Link href={route('index')} className="hover:text-primary transition-colors flex items-center gap-1">
                                        <RiHomeLine size={13} />
                                        <span>{__('Home')}</span>
                                    </Link>
                                    <RiArrowRightSLine size={14} className="text-res/40" />
                                    <span>{__('Pages')}</span>
                                    <RiArrowRightSLine size={14} className="text-res/40" />
                                    <span className="text-primary font-semibold truncate max-w-[200px]">{page.title}</span>
                                </nav>
                            )}

                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                                <RiFileTextLine size={15} />
                                <span>{__('Information')}</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading font-oswald tracking-tight">
                                {page.title}
                            </h1>

                            {shortDescription && (
                                <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-res/80 italic leading-relaxed">
                                    {shortDescription}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Clean Minimal Header */}
                {headerStyle === 'clean_minimal' && (
                    <div className="border-b border-border/50 bg-bg/50 py-8 px-4 sm:px-6 lg:px-8">
                        <div className={containerClass}>
                            {showBreadcrumbs && (
                                <nav className="flex items-center gap-1.5 text-xs text-res/70 mb-3">
                                    <Link href={route('index')} className="hover:text-primary transition-colors flex items-center gap-1">
                                        <RiHomeLine size={13} />
                                        <span>{__('Home')}</span>
                                    </Link>
                                    <RiArrowRightSLine size={14} className="text-res/40" />
                                    <span>{__('Pages')}</span>
                                    <RiArrowRightSLine size={14} className="text-res/40" />
                                    <span className="text-primary font-semibold truncate">{page.title}</span>
                                </nav>
                            )}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-heading font-oswald">
                                {page.title}
                            </h1>
                            {shortDescription && (
                                <p className="mt-2 text-sm text-res/80">{shortDescription}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Featured Image Banner Header */}
                {headerStyle === 'with_image' && page.image && (
                    <div className="relative w-full h-[280px] sm:h-[360px] bg-heading overflow-hidden border-b border-border/60">
                        <ImageViwer image={page.image} alt={page.title} className="w-full h-full object-cover opacity-40" height={900} width={900} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
                            <div className={`${containerClass} pb-8 text-white w-full`}>
                                {showBreadcrumbs && (
                                    <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-3">
                                        <Link href={route('index')} className="hover:text-white transition-colors">{__('Home')}</Link>
                                        <RiArrowRightSLine size={14} className="text-white/40" />
                                        <span>{__('Pages')}</span>
                                        <RiArrowRightSLine size={14} className="text-white/40" />
                                        <span className="text-white font-semibold truncate">{page.title}</span>
                                    </nav>
                                )}
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-oswald tracking-tight">
                                    {page.title}
                                </h1>
                                {shortDescription && (
                                    <p className="mt-2 text-sm sm:text-base text-white/80 max-w-2xl">{shortDescription}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Optional Top Banner Image if header is gradient/minimal but image exists */}
                {headerStyle !== 'with_image' && page.image && (
                    <div className={`${containerClass} mt-8`}>
                        <div className="relative rounded overflow-hidden shadow-lg border border-border/60 bg-dynamic h-[220px] sm:h-[300px] md:h-[360px]">
                            <ImageViwer image={page.image} alt={page.title} height={900} width={900} className="w-full h-full object-cover" />
                        </div>
                    </div>
                )}

                {/* ── MAIN CONTENT & SIDEBAR GRID ──────────────────────────── */}
                <div className={`${containerClass} mt-10`}>
                    {/* Action Bar (Share, Print, Updated date) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-border/40 text-xs">
                        <div className="flex items-center gap-2 text-res/60">
                            {page.updated_at && (
                                <span className="inline-flex items-center gap-1">
                                    <RiTimeLine size={14} />
                                    <span>
                                        {__('Updated')}: {new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleShare}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-res/80 hover:text-primary hover:border-primary/40 bg-bg hover:bg-dynamic transition-all"
                            >
                                {copied ? <RiCheckLine size={14} className="text-green-600" /> : <RiShareForwardLine size={14} />}
                                <span>{copied ? __('Copied Link') : __('Share')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-res/80 hover:text-primary hover:border-primary/40 bg-bg hover:bg-dynamic transition-all"
                            >
                                <RiPrinterLine size={14} />
                                <span>{__('Print')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Layout Variant 1: Sidebar Right */}
                    {layoutType === 'sidebar_right' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                            <main className="lg:col-span-8 min-w-0">
                                <div className="bg-bg rounded-2xl p-6 sm:p-10 border border-border/60 shadow-xs">
                                    <div
                                        className="prose prose-lg dark:prose-invert max-w-none text-res leading-relaxed space-y-4 prose-headings:text-heading prose-headings:font-oswald prose-h2:text-2xl prose-h2:font-extrabold prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-p:text-res/90 prose-p:leading-relaxed prose-li:text-res/90 prose-strong:text-heading"
                                        dangerouslySetInnerHTML={{ __html: processedContent }}
                                    />
                                </div>
                            </main>

                            <div className="lg:col-span-4 min-w-0">
                                <PageSidebar
                                    enabledWidgets={sidebarWidgets}
                                    page={page}
                                    contentHtml={page.description}
                                    recentBlogs={recent_blogs}
                                    categories={categories}
                                    otherPages={other_pages}
                                    customWidgets={customWidgets}
                                    sticky={stickySidebar}
                                />
                            </div>
                        </div>
                    )}

                    {/* Layout Variant 2: Sidebar Left */}
                    {layoutType === 'sidebar_left' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                            <div className="lg:col-span-4 order-2 lg:order-1 min-w-0">
                                <PageSidebar
                                    enabledWidgets={sidebarWidgets}
                                    page={page}
                                    contentHtml={page.description}
                                    recentBlogs={recent_blogs}
                                    categories={categories}
                                    otherPages={other_pages}
                                    customWidgets={customWidgets}
                                    sticky={stickySidebar}
                                />
                            </div>

                            <main className="lg:col-span-8 order-1 lg:order-2 min-w-0">
                                <div className="bg-bg rounded p-6 sm:p-10 border border-border/60 shadow-xs">
                                    <div
                                        className="prose prose-lg dark:prose-invert max-w-none text-res leading-relaxed space-y-4 prose-headings:text-heading prose-headings:font-oswald prose-h2:text-2xl prose-h2:font-extrabold prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-p:text-res/90 prose-p:leading-relaxed prose-li:text-res/90 prose-strong:text-heading"
                                        dangerouslySetInnerHTML={{ __html: processedContent }}
                                    />
                                </div>
                            </main>
                        </div>
                    )}

                    {/* Layout Variant 3: Narrow Centered (No sidebar) */}
                    {layoutType === 'narrow_center' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-bg rounded-2xl p-6 sm:p-12 border border-border/60 shadow-xs">
                                <div
                                    className="prose prose-lg dark:prose-invert max-w-none text-res leading-relaxed space-y-4 prose-headings:text-heading prose-headings:font-oswald prose-h2:text-2xl prose-h2:font-extrabold prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-p:text-res/90 prose-p:leading-relaxed prose-li:text-res/90 prose-strong:text-heading"
                                    dangerouslySetInnerHTML={{ __html: processedContent }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Layout Variant 4: Full Width (No sidebar) */}
                    {layoutType === 'full_width' && (
                        <div className="w-full">
                            <div className="bg-bg rounded-2xl p-6 sm:p-12 border border-border/60 shadow-xs">
                                <div
                                    className="prose prose-lg dark:prose-invert max-w-none text-res leading-relaxed space-y-4 prose-headings:text-heading prose-headings:font-oswald prose-h2:text-2xl prose-h2:font-extrabold prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-p:text-res/90 prose-p:leading-relaxed prose-li:text-res/90 prose-strong:text-heading"
                                    dangerouslySetInnerHTML={{ __html: processedContent }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Back to Home Button */}
                    <div className="mt-8 flex items-center justify-between">
                        <Link
                            href={route('index')}
                            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                        >
                            <RiArrowLeftLine size={16} />
                            <span>{__('Back to Home')}</span>
                        </Link>
                    </div>
                </div>

                {/* ── DYNAMIC PRE-FOOTER SECTION (ABOVE SITE FOOTER) ───────── */}
                <PageFooterSection
                    widgetType={footerWidget}
                    ctaTitle={footerCtaTitle}
                    ctaDesc={footerCtaDesc}
                    ctaBtnText={footerCtaBtnText}
                    ctaBtnUrl={footerCtaBtnUrl}
                    faqs={faqs}
                    recentBlogs={recent_blogs}
                />
            </div>
        </FrontendLayout>
    );
}
