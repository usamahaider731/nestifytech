import React from 'react';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import { useLang } from '@/contexts/LanguageContext';
import { RiSparkling2Line, RiCompass3Line } from 'react-icons/ri';

const ForYouProducts = ({ products, cardType, interestTags = [] }) => {
    const { __ } = useLang();

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="relative py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                        <RiSparkling2Line size={14} className="text-primary animate-pulse" />
                        <span>{__('Personalized Recommendation')}</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-heading md:text-3xl">
                        {__('Products For You')}
                    </h2>
                    <p className="text-xs text-res mt-1 max-w-xl">
                        {__('Handpicked based on your searches, favorite product tags, and viewed items')}
                    </p>
                </div>

                {Array.isArray(interestTags) && interestTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:max-w-md sm:justify-end">
                        <span className="text-[11px] font-medium text-res flex items-center gap-1">
                            <RiCompass3Line size={13} />
                            {__('Matched:')}
                        </span>
                        {interestTags.slice(0, 4).map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-2.5 py-0.5 text-[11px] font-semibold bg-bg border border-border rounded-full text-text capitalize"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <ProductGrid
                products={products}
                headingStyle="none"
                showHeader={false}
                useMockFallback={false}
                cardType={cardType}
            />
        </div>
    );
};

export default ForYouProducts;
