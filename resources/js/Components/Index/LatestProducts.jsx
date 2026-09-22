import React from 'react';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import { useLang } from '@/contexts/LanguageContext';

const LatestProducts = ({ products }) => {
    const { __ } = useLang();
    return (
        <ProductGrid
            products={products}
            title={__('Latest Products')}
            subtitle={__('Shop from the best collection of latest products')}
            headingStyle="underline"
            useMockFallback={false}
        />
    );
};

export default LatestProducts;
