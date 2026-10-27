import FrontendLayout from '@/Layouts/FrontendLayout';
import React, { useState } from 'react';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import ProductFilters, { CatalogSort, toQuery } from '@/Components/Frontend/ProductFilters';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { RiFilter3Line, RiGridFill, RiListUnordered, RiSearch2Line, RiSparkling2Line, RiCloseCircleLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import AdsRender from '@/Components/Frontend/AdsRender';

export default function Search({ query = '', products, filters = {}, filterOptions = {} }) {
    const { setting } = usePage().props;
    const { __ } = useLang();
    const [layoutType, setLayoutType] = useState('v1');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const currency = setting?.site?.currency?.value ?? 'PKR';

    const productItems = products?.data || products || [];
    const productCount = products?.total ?? productItems.length;

    const applySort = (sort) => {
        router.get(window.location.pathname, toQuery({ ...filters, sort, q: query }, filterOptions.price), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <div className="mx-auto w-full max-w-[1600px] bg-bg min-h-screen">
            <Head title={query ? `${query} - ${__('Search Results')}` : __('Search')} />

            {/* Search Header Banner */}
            <div className="relative mb-8 bg-gradient-to-r from-primary/10 via-bg to-primary/5 border-b border-border py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="container mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                <RiSparkling2Line size={14} className="text-primary animate-pulse" />
                                <span>{__('Search Results')}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-poppins text-heading flex items-center gap-2">
                                <RiSearch2Line className="text-primary size-7 shrink-0" />
                                <span>
                                    {query ? (
                                        <>
                                            {__('Results for')}{' '}
                                            <span className="text-primary font-bold">"{query}"</span>
                                        </>
                                    ) : (
                                        __('All Products')
                                    )}
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-res mt-1.5 font-roboto">
                                {__('Found :count matching products', { count: productCount })}
                            </p>
                        </div>

                        {query && (
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('search')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-border hover:border-rose-400 text-res hover:text-rose-600 rounded-full transition-colors shadow-2xs"
                                >
                                    <RiCloseCircleLine size={15} />
                                    <span>{__('Clear Search')}</span>
                                </Link>
                                <Link
                                    href={route('shop')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-white hover:opacity-90 rounded-full transition-opacity shadow-2xs"
                                >
                                    <span>{__('View All in Shop')}</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content: Filters + Product Grid */}
            <div className="flex flex-col pb-10 container mx-auto px-4 gap-6 lg:flex-row lg:items-start">
                <ProductFilters
                    filters={filters}
                    options={filterOptions}
                    currency={currency}
                    className="w-full shrink-0 lg:w-72"
                    mobileOpen={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />

                <div className="min-w-0 flex-1">
                    {/* Top Action Bar */}
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-white px-4 py-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setFiltersOpen(true)}
                                className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm font-semibold text-heading lg:hidden cursor-pointer hover:bg-bg"
                            >
                                <RiFilter3Line className="size-4" />
                                <span>{__('Filters')}</span>
                            </button>
                            <h2 className="text-sm font-bold text-heading">
                                {__('Showing')} <span className="text-primary font-bold">{productCount}</span> {__('Items')}
                            </h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <CatalogSort value={filters.sort} onChange={applySort} />
                            <div className="flex items-center gap-1 rounded border border-border bg-white p-1">
                                <button
                                    type="button"
                                    onClick={() => setLayoutType('v1')}
                                    className={`rounded p-1.5 transition-colors cursor-pointer ${layoutType === 'v1' ? 'bg-primary text-white shadow-2xs' : 'text-res hover:bg-bg'}`}
                                    title={__('Grid View')}
                                >
                                    <RiGridFill className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLayoutType('v2')}
                                    className={`rounded p-1.5 transition-colors cursor-pointer ${layoutType === 'v2' ? 'bg-primary text-white shadow-2xs' : 'text-res hover:bg-bg'}`}
                                    title={__('List View')}
                                >
                                    <RiListUnordered className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid or Empty State */}
                    {productItems.length > 0 ? (
                        <>
                            <ProductGrid
                                products={productItems}
                                showHeader={false}
                                compact
                                cardType={layoutType}
                                widthType={75}
                            />

                            {products?.links && products.links.length > 3 && (
                                <div className="mt-8 flex flex-wrap items-center justify-center gap-2 pb-8">
                                    {products.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || ''}
                                            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${link.active
                                                ? 'bg-primary text-heading shadow-lg shadow-primary/20'
                                                : 'border border-border bg-white text-res hover:bg-bg'
                                                } ${!link.url && 'pointer-events-none opacity-50'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-16 px-4 text-center shadow-2xs">
                            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <RiSearch2Line size={36} />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-heading">
                                {__('No Products Found')}
                            </h3>
                            <p className="max-w-md text-xs sm:text-sm text-res leading-relaxed">
                                {query
                                    ? __('We couldn\'t find any products matching ":query". Please try another search term or browse our categories.', { query })
                                    : __('No products match the selected filters.')}
                            </p>
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                {query && (
                                    <Link
                                        href={route('search')}
                                        className="rounded px-5 py-2.5 text-xs font-semibold bg-bg border border-border text-heading hover:bg-border transition-colors cursor-pointer"
                                    >
                                        {__('Clear Search')}
                                    </Link>
                                )}
                                <Link
                                    href={route('shop')}
                                    className="rounded px-5 py-2.5 text-xs font-semibold bg-primary text-heading shadow-md shadow-primary/20 hover:brightness-95 transition cursor-pointer"
                                >
                                    {__('Browse Shop Catalog')}
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Bottom Ad / Banner */}
                    <AdsRender type="main" placement="store_bottom" className="w-full mt-10" />
                </div>
            </div>
        </div>
    );
}

Search.layout = (view) => <FrontendLayout>{view}</FrontendLayout>;
