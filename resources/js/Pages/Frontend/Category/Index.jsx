import FrontendLayout from '@/Layouts/FrontendLayout'
import React, { useState } from 'react'
import ProductGrid from '@/Components/Frontend/ProductGrid'
import ProductFilters, { CatalogSort, toQuery } from '@/Components/Frontend/ProductFilters'
import { Head, Link, router, usePage } from '@inertiajs/react'
import ImageViwer from '@/Components/Admin/ImageViwer';
import { RiFilter3Line, RiGridFill, RiListUnordered } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function Category({ category, products, filters = {}, filterOptions = {} }) {
  const { setting } = usePage().props;
  const { __ } = useLang();
  const [Settings] = useState(setting?.layout?.Single_Category);
  const [layoutType, setLayoutType] = useState('v1');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currency = setting.site.currency.value ?? 'PKR';

  const cat = Array.isArray(category) ? category[0] : category;
  const productItems = products?.data || products || [];
  const productCount = products?.total ?? productItems.length;

  const applySort = (sort) => {
    router.get(window.location.pathname, toQuery({ ...filters, sort }, filterOptions.price), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] bg-bg">
      <Head title={cat?.title ? `${cat.title} - Category` : 'Category'} />

      <div className="relative mb-10 bg-bg flex min-h-[280px] flex-col items-center gap-8 overflow-hidden rounded border border-border p-8 text-center shadow-sm md:min-h-[360px] md:flex-row md:p-12 lg:text-left">
        <ImageViwer image={Settings?.banner_image} className="absolute inset-0 z-0 size-full object-cover" />
        <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-sm"></div>
        <div className="absolute -top-24 -right-24 z-0 size-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 z-0 size-64 rounded-full bg-primary/10 blur-3xl"></div>

        {cat?.image && (
          <div className="relative z-10 flex size-30 shrink-0 items-center justify-center rounded-full border border-border bg-white overflow-hidden shadow-md md:size-40">
            <ImageViwer
              image={cat.image}
              width={900}
              height={900}
              alt={cat?.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="relative z-10 flex-1">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold capitalize font-oswald tracking-wider text-permanent lg:justify-start">
            <Link href="/" className="hover:underline">{__('Home')}</Link>
            <span>/</span>
            <span>{cat?.type === 'brand' ? __('Brand') : __('Category')}</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold font-poppins text-common md:text-5xl">{cat?.title}</h1>
          {cat?.description && (
            <div dangerouslySetInnerHTML={{ __html: cat?.description }} className="mx-auto max-w-3xl text-base leading-relaxed text-permanent font-roboto lg:mx-0"></div>
          )}
        </div>
      </div>

      <div className="flex flex-col pb-5 container mx-auto px-4 gap-6 lg:flex-row lg:items-start">
        <ProductFilters
          filters={filters}
          options={filterOptions}
          currency={currency}
          className="w-full shrink-0 lg:w-72"
          mobileOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm font-semibold text-heading lg:hidden"
              >
                <RiFilter3Line className="size-4" />
                {__('Filters')}
              </button>
              <h2 className="text-lg font-bold text-secondary">
                {__('Products')} <span className="text-sm font-medium text-res">({productCount})</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <CatalogSort value={filters.sort} onChange={applySort} />
              <div className="flex items-center gap-1 rounded border border-border bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLayoutType('v1')}
                  className={`rounded p-2 transition-colors ${layoutType === 'v1' ? 'bg-primary text-white shadow' : 'text-res hover:bg-white'}`}
                  title={__('Grid View')}
                >
                  <RiGridFill className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutType('v2')}
                  className={`rounded p-2 transition-colors ${layoutType === 'v2' ? 'bg-primary text-white shadow' : 'text-res hover:bg-white'}`}
                  title={__('List View')}
                >
                  <RiListUnordered className="size-5" />
                </button>
              </div>
            </div>
          </div>

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
                        : 'border border-border bg-white text-res hover:bg-accent'
                        } ${!link.url && 'pointer-events-none opacity-50'}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-accent py-20 text-center">
              <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-white">
                <svg className="size-10 text-secondary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-heading">{__('No Products Found')}</h3>
              <p className="max-w-md text-res">
                {__('We could not find products matching these filters. Try clearing them or browse another category.')}
              </p>
              <Link href="/" className="mt-8 rounded-xl bg-primary px-6 py-3 font-bold text-heading shadow-lg shadow-primary/20 transition hover:brightness-95">
                {__('Continue Shopping')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

Category.layout = (view) => {
  return (
    <FrontendLayout>
      {view}
    </FrontendLayout>
  )
}
