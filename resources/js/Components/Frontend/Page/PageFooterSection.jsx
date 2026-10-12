import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    RiQuestionAnswerLine,
    RiArrowRightLine,
    RiCustomerService2Fill,
    RiPhoneLine,
    RiMailLine,
    RiMapPinLine,
    RiArticleLine,
    RiCalendarLine,
    RiArrowDownSLine,
    RiMailSendLine,
    RiCheckLine,
} from 'react-icons/ri';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { useLang } from '@/contexts/LanguageContext';

export default function PageFooterSection({
    widgetType = 'none',
    ctaTitle = '',
    ctaDesc = '',
    ctaBtnText = '',
    ctaBtnUrl = '',
    faqs = [],
    recentBlogs = [],
    className = '',
}) {
    const { __ } = useLang();
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    if (!widgetType || widgetType === 'none') {
        return null;
    }

    // ── 1. Call to Action Banner ──────────────────────────────────────────────
    if (widgetType === 'cta_banner') {
        const title = ctaTitle || __('Have Questions or Need Immediate Assistance?');
        const desc = ctaDesc || __('Our dedicated support team is available 24/7 to help you with order tracking, policies, warranty claims, or product specifications.');
        const btnText = ctaBtnText || __('Contact Support Team');
        const btnUrl = ctaBtnUrl || route('page.single', 'contact-us');

        return (
            <section className={`my-16 ${className}`}>
                <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded bg-gradient-to-r from-primary via-primary/95 to-secondary p-8 sm:p-12 text-white shadow-xl">
                        {/* Decorative background effects */}
                        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
                            <div className="max-w-2xl">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white text-xs font-extrabold uppercase tracking-widest mb-3">
                                    {__('We Are Here To Help')}
                                </span>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-oswald tracking-tight leading-tight">
                                    {title}
                                </h2>
                                <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
                                    {desc}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                <Link
                                    href={btnUrl}
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-heading hover:text-primary font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-white/95 transition-all hover:scale-105"
                                >
                                    <span>{btnText}</span>
                                    <RiArrowRightLine size={16} />
                                </Link>
                                <Link
                                    href={route('faqs')}
                                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-white/20"
                                >
                                    <span>{__('Browse FAQs')}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // ── 2. FAQ Accordion ──────────────────────────────────────────────────────
    if (widgetType === 'faq_accordion') {
        const faqList = Array.isArray(faqs) && faqs.length > 0
            ? faqs.slice(0, 5)
            : [
                  {
                      id: 1,
                      title: 'How long does standard delivery usually take?',
                      description: 'Standard domestic delivery typically arrives within 2 to 4 business days. Expedited shipping is available at checkout for next-day delivery.',
                  },
                  {
                      id: 2,
                      title: 'What is your refund and return policy?',
                      description: 'We offer an unconditional 30-day return policy for unused items in original packaging. Refunds are processed back to your original payment method within 3-5 business days.',
                  },
                  {
                      id: 3,
                      title: 'Are all products authentic and covered by warranty?',
                      description: 'Yes, 100% of our products are directly sourced from authorized manufacturers and include official manufacturer warranties.',
                  },
                  {
                      id: 4,
                      title: 'How can I contact your customer support department?',
                      description: 'You can reach us through email at support@nestifytech.com, phone at +1 (800) 123-4567, or via our 24/7 online contact center.',
                  },
              ];

        return (
            <section className={`my-16 py-12 bg-common/50 border-y border-border/40 ${className}`}>
                <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                            <RiQuestionAnswerLine size={14} />
                            <span>{__('Frequently Asked Questions')}</span>
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-heading font-oswald tracking-tight">
                            {ctaTitle || __('Quick Answers to Common Questions')}
                        </h2>
                        <p className="mt-2 text-sm text-res/80 max-w-lg mx-auto">
                            {ctaDesc || __('Find instant answers below or visit our dedicated help center.')}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {faqList.map((faq, index) => {
                            const isOpen = openFaqIndex === index;
                            return (
                                <div
                                    key={faq.id || index}
                                    className="bg-bg rounded-2xl border border-border/60 overflow-hidden shadow-xs transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-dynamic"
                                    >
                                        <span className="text-sm sm:text-base font-bold text-heading pr-4">
                                            {faq.title}
                                        </span>
                                        <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                                                isOpen ? 'bg-primary text-white rotate-180' : 'bg-dynamic text-res'
                                            }`}
                                        >
                                            <RiArrowDownSLine size={18} />
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-res/80 leading-relaxed border-t border-border/40 pt-3">
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: faq.description || '',
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-8">
                        <Link
                            href={route('faqs')}
                            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                        >
                            <span>{__('View Complete Help & FAQ Center')}</span>
                            <RiArrowRightLine size={14} />
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    // ── 3. 3-Column Contact & Support Grid ───────────────────────────────────
    if (widgetType === 'contact_grid') {
        return (
            <section className={`my-16 py-12 bg-common/40 border-y border-border/40 ${className}`}>
                <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                            {__('Customer Care Channels')}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-heading font-oswald tracking-tight">
                            {ctaTitle || __('Get In Touch With Our Team')}
                        </h2>
                        <p className="mt-2 text-sm text-res/80 max-w-lg mx-auto">
                            {ctaDesc || __('Choose the channel that works best for you and our specialists will assist you promptly.')}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Box 1 */}
                        <div className="bg-bg rounded-2xl border border-border/60 p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <RiPhoneLine size={24} />
                            </div>
                            <h3 className="text-base font-bold text-heading font-oswald uppercase mb-1">
                                {__('Phone Support')}
                            </h3>
                            <p className="text-xs text-res/80 mb-4">
                                {__('Speak directly with our technical support and order agents.')}
                            </p>
                            <a
                                href="tel:+18001234567"
                                className="mt-auto text-sm font-bold text-primary hover:underline"
                            >
                                +1 (800) 123-4567
                            </a>
                        </div>

                        {/* Box 2 */}
                        <div className="bg-bg rounded-2xl border border-border/60 p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <RiMailLine size={24} />
                            </div>
                            <h3 className="text-base font-bold text-heading font-oswald uppercase mb-1">
                                {__('Email Helpdesk')}
                            </h3>
                            <p className="text-xs text-res/80 mb-4">
                                {__('Send detailed queries or attachments for same-day response.')}
                            </p>
                            <a
                                href="mailto:support@nestifytech.com"
                                className="mt-auto text-sm font-bold text-primary hover:underline"
                            >
                                support@nestifytech.com
                            </a>
                        </div>

                        {/* Box 3 */}
                        <div className="bg-bg rounded-2xl border border-border/60 p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center sm:col-span-2 lg:col-span-1">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <RiMapPinLine size={24} />
                            </div>
                            <h3 className="text-base font-bold text-heading font-oswald uppercase mb-1">
                                {__('Headquarters')}
                            </h3>
                            <p className="text-xs text-res/80 mb-4">
                                {__('123 Innovation Boulevard, Suite 500, Tech City, USA')}
                            </p>
                            <span className="mt-auto text-xs font-semibold text-res/70">
                                {__('Open Mon - Fri: 9am - 6pm')}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // ── 4. Recent Blogs Grid ─────────────────────────────────────────────────
    if (widgetType === 'recent_blogs') {
        const blogs = Array.isArray(recentBlogs) ? recentBlogs.slice(0, 3) : [];
        if (blogs.length === 0) return null;

        return (
            <section className={`my-16 py-12 bg-common/30 border-y border-border/40 ${className}`}>
                <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                {__('Latest Articles')}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-heading font-oswald tracking-tight">
                                {ctaTitle || __('From Our Official Tech Blog')}
                            </h2>
                        </div>
                        <Link
                            href={route('blog.index')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                        >
                            <span>{__('View All Posts')}</span>
                            <RiArrowRightLine size={14} />
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map((b) => (
                            <article
                                key={b.id}
                                className="group bg-bg rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                            >
                                <Link
                                    href={route('blog.single', b.sku || b.id)}
                                    className="relative aspect-video overflow-hidden bg-dynamic block"
                                >
                                    {b.image ? (
                                        <ImageViwer
                                            image={b.image}
                                            alt={b.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary/30">
                                            <RiArticleLine size={32} />
                                        </div>
                                    )}
                                </Link>

                                <div className="p-5 flex-1 flex flex-col">
                                    {b.created_at && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-res/60 mb-2">
                                            <RiCalendarLine size={13} />
                                            <span>
                                                {new Date(b.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    <h3 className="text-sm font-bold text-heading group-hover:text-primary transition-colors line-clamp-2 mb-3">
                                        <Link href={route('blog.single', b.sku || b.id)}>
                                            {b.title}
                                        </Link>
                                    </h3>

                                    <Link
                                        href={route('blog.single', b.sku || b.id)}
                                        className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-primary hover:gap-2 transition-all"
                                    >
                                        <span>{__('Read Article')}</span>
                                        <RiArrowRightLine size={14} />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // ── 5. Full-Width Newsletter Callout ─────────────────────────────────────
    if (widgetType === 'newsletter') {
        return (
            <section className={`my-16 ${className}`}>
                <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-bg via-common to-primary/10 p-8 sm:p-12 text-center shadow-lg">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-primary/20">
                            <RiMailSendLine size={28} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-heading font-oswald tracking-tight">
                            {ctaTitle || __('Stay Ahead With NestifyTech')}
                        </h2>
                        <p className="mt-2 text-sm text-res/80 max-w-xl mx-auto mb-6">
                            {ctaDesc || __('Subscribe to our weekly dispatch for tech releases, verified promotions, and direct announcements.')}
                        </p>

                        {subscribed ? (
                            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-semibold">
                                <RiCheckLine size={20} />
                                <span>{__('You are now subscribed. Welcome aboard!')}</span>
                            </div>
                        ) : (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (email) setSubscribed(true);
                                }}
                                className="max-w-md mx-auto flex flex-col sm:flex-row gap-2"
                            >
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={__('Enter your work or personal email...')}
                                    required
                                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-white text-xs sm:text-sm text-heading placeholder:text-res/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all shrink-0"
                                >
                                    {__('Subscribe')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    return null;
}
