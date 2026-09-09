import React from 'react';
import ProductGrid from '@/Components/Frontend/ProductGrid';

const LatestProducts = ({ products }) => {
    return (
        <ProductGrid
            products={products}
            title="Latest Products"
            subtitle="Shop from the best collection of latest products"
            headingStyle="underline"
            useMockFallback={false}
        />
    );
};

export default LatestProducts;
