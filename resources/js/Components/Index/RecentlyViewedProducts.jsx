import React from 'react';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import { useLang } from '@/contexts/LanguageContext';
import { RiHistoryLine } from 'react-icons/ri';

const RecentlyViewedProducts = ({ products, cardType }) => {
    const { __ } = useLang();

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="relative py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                        <RiHistoryLine size={14} className="text-secondary" />
                        <span>{__('Your Activity')}</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-heading md:text-3xl">
                        {__('Recently Viewed')}
                    </h2>
                    <p className="text-xs text-res mt-1 max-w-xl">
                        {__('Pick up right where you left off from your recent searches and visits')}
                    </p>
                </div>
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

export default RecentlyViewedProducts;
