import React from 'react';
import ProductCard from '@/Components/ProductCard';
import { MOCK_PRODUCTS } from './mockProducts';

/**
 * Responsive product grid using the settings-driven ProductCard (V1 or V2).
 */
export default function ProductGrid({
    products,
    title = 'Featured Products',
    subtitle = 'Discover our hand-picked selection of top-rated products',
    id = 'products',
    className = '',
    useMockFallback = false,
    headingStyle = 'default',
}) {
    const displayProducts =
        products?.length > 0 ? products : useMockFallback ? MOCK_PRODUCTS : [];

    if (displayProducts.length === 0) {
        return null;
    }

    const titleClass =
        headingStyle === 'underline'
            ? 'relative inline-block text-2xl md:text-3xl font-extrabold text-slate-900 before:absolute before:-bottom-2 before:left-0 before:w-16 before:h-1 before:bg-primary before:rounded-full hover:before:w-full before:transition-all before:duration-500 pb-2'
            : 'text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight';

    return (
        <section id={id} className={`py-16 md:py-24 ${className}`}>
            <div className="mb-10 md:mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                    <h2 className={titleClass}>{title}</h2>
                    {subtitle && (
                        <p className="mt-4 text-slate-500 text-sm md:text-base leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="flex items-center">
                    <span className="text-sm font-semibold bg-primary/10 text-primary px-4 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-primary/20">
                        {displayProducts.length} items
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-8 gap-6 md:gap-8">
                {displayProducts.map((product, index) => (
                    <ProductCard key={product.id ?? index} product={product} />
                ))}
            </div>
        </section>
    );
}
