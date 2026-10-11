import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { useLang } from '@/contexts/LanguageContext';
import {
    RiQuestionLine,
    RiSearchLine,
    RiArrowDownSLine,
    RiThumbUpLine,
    RiThumbDownLine,
    RiCustomerService2Line,
    RiMailSendLine,
    RiPhoneLine,
    RiShareForwardLine,
    RiCheckLine,
    RiCloseCircleLine,
    RiFolder3Line,
    RiShieldCheckLine,
    RiTruckLine,
    RiExchangeFundsLine,
    RiBankCardLine,
    RiUserFollowLine,
    RiInformationLine,
    RiSparklingLine,
} from 'react-icons/ri';

export default function FaqsIndex({ faqs = [], categories = [], filters = {} }) {
    const { __ } = useLang();
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [activeCategory, setActiveCategory] = useState(filters.category || 'all');
    const [openIndex, setOpenIndex] = useState(0); // Open first item by default
    const [feedback, setFeedback] = useState({});
    const [copiedId, setCopiedId] = useState(null);

    // Normalize incoming FAQ items
    const rawFaqs = useMemo(() => {
        let list = [];
        if (Array.isArray(faqs?.data)) {
            list = faqs.data;
        } else if (Array.isArray(faqs)) {
            list = faqs;
        } else if (faqs && typeof faqs === 'object') {
            list = Object.values(faqs);
        }

        return list.map((item) => {
            // Extract meta category or fallback
            let cat = 'General';
            if (item.faq_category) {
                cat = item.faq_category;
            } else if (Array.isArray(item.meta)) {
                const found = item.meta.find((m) => m.key === 'faq_category');
                if (found?.value) cat = found.value;
            } else if (item.meta && typeof item.meta === 'object') {
                if (item.meta.faq_category) {
                    cat = typeof item.meta.faq_category === 'object' ? item.meta.faq_category.value : item.meta.faq_category;
                }
            }

            // Extract display order
            let ord = 999;
            if (item.order !== undefined && item.order !== null) {
                ord = parseInt(item.order, 10);
            } else if (Array.isArray(item.meta)) {
                const found = item.meta.find((m) => m.key === 'order');
                if (found?.value) ord = parseInt(found.value, 10);
            }

            return {
                ...item,
                categoryName: cat || 'General',
                sortOrder: isNaN(ord) ? 999 : ord,
            };
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [faqs]);

    // Unique category list derived from existing FAQs + taxonomy categories
    const categoryList = useMemo(() => {
        const set = new Set();
        rawFaqs.forEach((f) => {
            if (f.categoryName) set.add(f.categoryName);
        });

        if (Array.isArray(categories)) {
            categories.forEach((c) => {
                if (c.title) set.add(c.title);
            });
        }

        return Array.from(set);
    }, [rawFaqs, categories]);

    // Category count map
    const categoryCounts = useMemo(() => {
        const counts = { all: rawFaqs.length };
        rawFaqs.forEach((f) => {
            const cat = f.categoryName;
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [rawFaqs]);

    // Filter FAQs by search query and selected category
    const filteredFaqs = useMemo(() => {
        return rawFaqs.filter((item) => {
            const matchesCat = activeCategory === 'all' || item.categoryName === activeCategory;
            if (!matchesCat) return false;

            if (!searchQuery.trim()) return true;

            const q = searchQuery.toLowerCase();
            const titleMatch = item.title?.toLowerCase().includes(q);
            const descMatch = (item.description || '').toLowerCase().includes(q);
            const catMatch = item.categoryName?.toLowerCase().includes(q);

            return titleMatch || descMatch || catMatch;
        });
    }, [rawFaqs, activeCategory, searchQuery]);

    // Toggle accordion item
    const toggleAccordion = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    // Helpful feedback handler
    const handleFeedback = (id, type) => {
        setFeedback((prev) => ({
            ...prev,
            [id]: type,
        }));
    };

    // Copy link to question
    const handleCopy = (id, title) => {
        if (typeof window !== 'undefined') {
            const url = `${window.location.origin}/faqs#faq-${id}`;
            navigator.clipboard?.writeText(url).then(() => {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2500);
            });
        }
    };

    // Category icon helper
    const getCategoryIcon = (name) => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('ship') || lower.includes('order') || lower.includes('deliver')) {
            return <RiTruckLine className="text-primary size-5" />;
        }
        if (lower.includes('pay') || lower.includes('checkout') || lower.includes('card') || lower.includes('price')) {
            return <RiBankCardLine className="text-amber-500 size-5" />;
        }
        if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
            return <RiExchangeFundsLine className="text-emerald-500 size-5" />;
        }
        if (lower.includes('product') || lower.includes('warranty') || lower.includes('device')) {
            return <RiShieldCheckLine className="text-cyan-500 size-5" />;
        }
        if (lower.includes('account') || lower.includes('security') || lower.includes('password')) {
            return <RiUserFollowLine className="text-purple-500 size-5" />;
        }
        return <RiInformationLine className="text-blue-500 size-5" />;
    };

    // Clean plain text string for SEO JSON-LD schema
    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    };

    // Build standard Schema.org FAQPage JSON-LD Structured Data
    const faqJsonLd = useMemo(() => {
        const entities = filteredFaqs.map((item) => ({
            '@type': 'Question',
            name: item.title,
            acceptedAnswer: {
                '@type': 'Answer',
                text: stripHtml(item.description),
            },
        }));

        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: entities,
        };
    }, [filteredFaqs]);

    return (
        <FrontendLayout title={__('Frequently Asked Questions')}>
            <Head>
                <title>{__('FAQs & Help Center | NestifyTech')}</title>
                <meta
                    name="description"
                    content={__('Find answers to common questions about shipping, delivery, payments, returns, warranty, and customer accounts.')}
                />
                {/* Dynamically generated Schema.org FAQPage Structured Data for Google Rich Results */}
                <script type="application/ld+json">
                    {JSON.stringify(faqJsonLd)}
                </script>
            </Head>

            <div className="min-h-screen text-res font-primary pb-20">
                {/* ── Top Hero Banner ── */}
                <div className="relative overflow-hidden bg-gradient-to-b from-accent/70 via-bg to-bg border-b border-border/50 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
                    {/* Background decorative glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

                    <div className="container mx-auto max-w-4xl text-center">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
                            <RiQuestionLine size={16} />
                            <span>{__('Help Center & FAQs')}</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-heading font-oswald tracking-tight uppercase">
                            {__('Frequently Asked Questions')}
                        </h1>

                        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-res/80 leading-relaxed">
                            {__('Got questions? We have answers. Search our knowledge base or browse by category below.')}
                        </p>

                        {/* Search Input Bar */}
                        <div className="mt-8 max-w-2xl mx-auto relative">
                            <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden bg-white dark:bg-dynamic border border-border/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <div className="pl-5 text-res/60">
                                    <RiSearchLine size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={__('Search for answers (e.g. shipping, returns, warranty)...')}
                                    className="w-full bg-transparent px-4 py-4 text-heading placeholder-res/50 text-sm sm:text-base border-0 ring-0 focus:outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="pr-4 text-res/50 hover:text-heading transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <RiCloseCircleLine size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Category Filter Pills ── */}
                <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-10">
                    <div className="flex items-center gap-2.5 overflow-x-auto sm:flex-wrap sm:justify-center pb-2 sm:pb-0 scrollbar-none max-w-full">
                        <button
                            type="button"
                            onClick={() => setActiveCategory('all')}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                                activeCategory === 'all'
                                    ? 'bg-primary text-heading shadow-md shadow-primary/20'
                                    : 'bg-bg text-res hover:bg-common hover:text-heading border border-border/40'
                            }`}
                        >
                            <RiSparklingLine size={16} />
                            <span>{__('All Questions')}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                activeCategory === 'all' ? 'bg-black/10 text-heading' : 'bg-primary/10 text-primary'
                            }`}>
                                {categoryCounts.all || 0}
                            </span>
                        </button>

                        {categoryList.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                                    activeCategory === cat
                                        ? 'bg-primary text-heading shadow-md shadow-primary/20'
                                        : 'bg-bg text-res hover:bg-common hover:text-heading border border-border/40'
                                }`}
                            >
                                <span>{cat}</span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                    activeCategory === cat ? 'bg-black/10 text-heading' : 'bg-primary/10 text-primary'
                                }`}>
                                    {categoryCounts[cat] || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Main FAQ Accordion List ── */}
                <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-10">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-16 bg-bg rounded border border-dashed border-border/80 px-4">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <RiQuestionLine size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-heading font-oswald uppercase">
                                {__('No Matching Questions Found')}
                            </h3>
                            <p className="mt-2 text-sm text-res/70 max-w-md mx-auto">
                                {__('We couldn\'t find any questions matching your search term. Try another keyword or browse our support categories.')}
                            </p>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md"
                            >
                                <span>{__('Reset Filters')}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredFaqs.map((faq, index) => {
                                const isOpen = openIndex === index;
                                const isHelpful = feedback[faq.id];
                                const isCopied = copiedId === faq.id;

                                return (
                                    <div
                                        key={faq.id || index}
                                        id={`faq-${faq.id || index}`}
                                        className={`rounded border transition-all duration-300 overflow-hidden ${
                                            isOpen
                                                ? 'bg-white dark:bg-dynamic/90 border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20'
                                                : 'bg-white/60 dark:bg-dynamic/40 border-border/60 hover:border-border hover:bg-white dark:hover:bg-dynamic'
                                        }`}
                                    >
                                        {/* Question Header Button */}
                                        <button
                                            type="button"
                                            onClick={() => toggleAccordion(index)}
                                            className="w-full text-left p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 cursor-pointer focus:outline-none"
                                            aria-expanded={isOpen}
                                        >
                                            <div className="flex items-start sm:items-center gap-3.5 flex-1">
                                                <div className="mt-0.5 sm:mt-0 p-2 rounded-xl bg-bg border border-border/40 shrink-0">
                                                    {getCategoryIcon(faq.categoryName)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[11px] font-semibold font-roboto text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                                                            {faq.categoryName}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base sm:text-lg font-medium font-poppins text-heading leading-snug">
                                                        {faq.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div
                                                className={`p-1 rounded-full bg-bg text-heading shrink-0 transition-transform duration-300 ${
                                                    isOpen ? 'rotate-180 bg-primary/10 text-primary' : ''
                                                }`}
                                            >
                                                <RiArrowDownSLine size={18} />
                                            </div>
                                        </button>

                                        {/* Expanded Answer Content */}
                                        {isOpen && (
                                            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-border/40 animate-fadeIn">
                                                <div
                                                    className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-res/90 leading-relaxed font-normal"
                                                    dangerouslySetInnerHTML={{ __html: faq.description || '' }}
                                                />

                                                {/* Bottom interactive action strip */}
                                                <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap items-center justify-between gap-4 text-xs text-res/70">
                                                    {/* Helpful feedback buttons */}
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium text-heading/80">
                                                            {__('Was this answer helpful?')}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFeedback(faq.id, 'yes')}
                                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                                                                    isHelpful === 'yes'
                                                                        ? 'bg-green-500/10 border-emerald-500 text-emerald-600 font-bold'
                                                                        : 'bg-bg border-border/50 hover:bg-common text-res'
                                                                }`}
                                                            >
                                                                <RiThumbUpLine size={14} />
                                                                <span>{__('Yes')}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFeedback(faq.id, 'no')}
                                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                                                                    isHelpful === 'no'
                                                                        ? 'bg-secondary/10 border-secondary text-secondary font-bold'
                                                                        : 'bg-bg border-border/50 hover:bg-common text-res'
                                                                }`}
                                                            >
                                                                <RiThumbDownLine size={14} />
                                                                <span>{__('No')}</span>
                                                            </button>
                                                        </div>
                                                        {isHelpful && (
                                                            <span className="text-emerald-500 font-medium animate-fadeIn">
                                                                {__('Thank you for your feedback!')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Copy Question Link */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(faq.id, faq.title)}
                                                        className="inline-flex items-center gap-1.5 text-xs text-res/70 hover:text-primary transition-colors cursor-pointer"
                                                    >
                                                        {isCopied ? (
                                                            <>
                                                                <RiCheckLine size={15} className="text-emerald-500" />
                                                                <span className="text-emerald-500 font-bold">{__('Link copied!')}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RiShareForwardLine size={15} />
                                                                <span>{__('Share this answer')}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-16">
                    <div className="rounded bg-gradient-to-br from-bg/70 via-common/60 to-bg/80 border border-border/60 p-8 sm:p-10 shadow-lg text-center relative overflow-hidden">
                        <div className="max-w-2xl mx-auto space-y-3">
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                {__('Need More Assistance?')}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-heading font-oswald uppercase tracking-tight">
                                {__('Still Can\'t Find What You\'re Looking For?')}
                            </h2>
                            <p className="text-sm sm:text-base font-roboto text-res/80">
                                {__('Our customer experience champions are available around the clock to help with any product or order inquiry.')}
                            </p>
                        </div>

                        {/* Contact Action Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                            {/* Card 1: Live Chat */}
                            <div className="bg-white/80 dark:bg-dynamic/80 rounded-2xl p-6 border border-border/50 text-center hover:shadow-md transition-all">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <RiCustomerService2Line size={24} />
                                </div>
                                <h4 className="font-bold text-heading text-sm uppercase">{__('24/7 Live Chat')}</h4>
                                <p className="text-xs text-res/70 mt-1">{__('Instant response time')}</p>
                                <a
                                    href="#chat"
                                    onClick={(e) => { e.preventDefault(); alert(__('Our live chat representative will be with you shortly!')); }}
                                    className="mt-4 inline-block text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                                >
                                    {__('Start Chat')} →
                                </a>
                            </div>

                            {/* Card 2: Email Us */}
                            <div className="bg-white/80 dark:bg-dynamic/80 rounded-2xl p-6 border border-border/50 text-center hover:shadow-md transition-all">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <RiMailSendLine size={24} />
                                </div>
                                <h4 className="font-bold text-heading text-sm uppercase">{__('Email Support')}</h4>
                                <p className="text-xs text-res/70 mt-1">support@nestifytech.com</p>
                                <a
                                    href="mailto:support@nestifytech.com"
                                    className="mt-4 inline-block text-xs font-bold text-emerald-500 hover:underline uppercase tracking-wider"
                                >
                                    {__('Send Email')} →
                                </a>
                            </div>

                            {/* Card 3: Call Us */}
                            <div className="bg-white/80 dark:bg-dynamic/80 rounded-2xl p-6 border border-border/50 text-center hover:shadow-md transition-all">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <RiPhoneLine size={24} />
                                </div>
                                <h4 className="font-bold text-heading text-sm uppercase">{__('Phone Support')}</h4>
                                <p className="text-xs text-res/70 mt-1">+1 (800) 123-4567</p>
                                <a
                                    href="tel:+18001234567"
                                    className="mt-4 inline-block text-xs font-bold text-amber-500 hover:underline uppercase tracking-wider"
                                >
                                    {__('Call Now')} →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}
