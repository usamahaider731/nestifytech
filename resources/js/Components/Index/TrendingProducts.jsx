import React from 'react';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import { useLang } from '@/contexts/LanguageContext';

const TrendingProducts = ({ products, cardType }) => {
    const { __ } = useLang();
    return (
        <ProductGrid
            products={products}
            title={__('Trending In This Month')}
            subtitle={__('The hottest picks based on what everyone is buying right now')}
            headingStyle="underline"
            useMockFallback={false}
            cardType={cardType}
        />
    );
};

export default TrendingProducts;
