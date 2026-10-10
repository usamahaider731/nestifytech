import React from 'react';
import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { RiArrowLeftLine, RiFileTextLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function PageSingle({ page }) {
    const { __ } = useLang();
    if (!page) return null;

    return (
        <FrontendLayout title={page.title}>
            <Head title={page.seo_title || page.title}>
                {page.seo_description && <meta name="description" content={page.seo_description} />}
                {page.seo_keywords && <meta name="keywords" content={page.seo_keywords} />}
            </Head>

            <div className="bg-bg min-h-screen text-res font-primary pb-20">
                {/* Hero Header */}
                <div className="relative bg-gradient-to-r from-accent via-dynamic to-accent/90 border-b border-border/40 py-16 px-4 sm:px-6 lg:px-8">
                    <div className="container mx-auto max-w-4xl text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                            <RiFileTextLine size={16} />
                            <span>{__('Information Page')}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading font-oswald tracking-tight">
                            {page.title}
                        </h1>
                        {page.short_description && (
                            <p className="mt-3 max-w-2xl mx-auto text-base text-res/80 italic">
                                {page.short_description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Banner Image if defined */}
                {page.image && (
                    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
                        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/60 bg-dynamic max-h-[380px]">
                            <ImageViwer image={page.image} alt={page.title} className="w-full h-full object-cover" />
                        </div>
                    </div>
                )}

                {/* Main Content Body */}
                <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-12">
                    <div className="bg-accent/20 rounded-3xl p-8 sm:p-12 border border-border/60 shadow-sm">
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none text-res leading-relaxed space-y-4"
                            dangerouslySetInnerHTML={{ __html: page.description || '' }}
                        />
                    </div>

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
            </div>
        </FrontendLayout>
    );
}
