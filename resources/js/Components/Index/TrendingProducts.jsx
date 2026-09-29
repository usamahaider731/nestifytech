import React from 'react';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import { useLang } from '@/contexts/LanguageContext';

const TrendingProducts = ({ products }) => {
    const { __ } = useLang();
    return (
        <ProductGrid
            products={products}
            title={__('Trending This Month')}
            subtitle={__('The hottest picks based on what everyone is buying right now')}
            headingStyle="underline"
            useMockFallback={false}
        />
    );
};

export default TrendingProducts;
