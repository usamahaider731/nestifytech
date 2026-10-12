import React from 'react';
import TableOfContentsWidget from './TableOfContentsWidget';
import RecentBlogsWidget from './RecentBlogsWidget';
import CategoriesWidget from './CategoriesWidget';
import ContactCardWidget from './ContactCardWidget';
import NewsletterWidget from './NewsletterWidget';
import RelatedPagesWidget from './RelatedPagesWidget';
import CustomCtaWidget from './CustomCtaWidget';

export default function PageSidebar({
    enabledWidgets = [],
    page = null,
    contentHtml = '',
    recentBlogs = [],
    categories = [],
    otherPages = [],
    customWidgets = [],
    sticky = true,
    className = '',
}) {
    // Standardize enabled widget array (handles JSON strings or array of objects/strings)
    let widgets = [];
    if (Array.isArray(enabledWidgets)) {
        widgets = enabledWidgets.map((w) => (typeof w === 'object' ? (w.id || w.value || w) : w));
    } else if (typeof enabledWidgets === 'string' && enabledWidgets.trim().length > 0) {
        try {
            const parsed = JSON.parse(enabledWidgets);
            widgets = Array.isArray(parsed)
                ? parsed.map((w) => (typeof w === 'object' ? (w.id || w.value || w) : w))
                : [enabledWidgets];
        } catch (_) {
            widgets = enabledWidgets.split(',').map((s) => s.trim());
        }
    }

    // Default widgets fallback if sidebar is shown but list is empty
    if (!widgets || widgets.length === 0) {
        widgets = ['toc', 'recent_blogs', 'contact_card'];
    }

    const currentPageSlug = page?.sku || (page?.id ? String(page.id) : '');

    return (
        <aside className={`w-full ${sticky ? 'lg:sticky lg:top-24' : ''} space-y-6 ${className}`}>
            {widgets.map((widgetId, index) => {
                switch (widgetId) {
                    case 'toc':
                        return (
                            <TableOfContentsWidget
                                key={`toc-${index}`}
                                contentHtml={contentHtml || page?.description || ''}
                            />
                        );

                    case 'recent_blogs':
                        return (
                            <RecentBlogsWidget
                                key={`blogs-${index}`}
                                blogs={recentBlogs}
                            />
                        );

                    case 'categories':
                        return (
                            <CategoriesWidget
                                key={`cat-${index}`}
                                categories={categories}
                            />
                        );

                    case 'contact_card':
                        return (
                            <ContactCardWidget
                                key={`contact-${index}`}
                            />
                        );

                    case 'newsletter':
                        return (
                            <NewsletterWidget
                                key={`news-${index}`}
                            />
                        );

                    case 'related_pages':
                        return (
                            <RelatedPagesWidget
                                key={`pages-${index}`}
                                pages={otherPages}
                                currentPageSlug={currentPageSlug}
                            />
                        );

                    case 'custom_cta':
                        return (
                            <CustomCtaWidget
                                key={`cta-${index}`}
                                widgets={customWidgets}
                            />
                        );

                    default:
                        return null;
                }
            })}
        </aside>
    );
}
