import FrontendLayout from '@/Layouts/FrontendLayout'
import React, { useState } from 'react'
import ProductGrid from '@/Components/Frontend/ProductGrid'
import { Head, Link, usePage } from '@inertiajs/react'
import ImageViwer from '@/Components/Admin/ImageViwer';
import { RiGridFill, RiListUnordered } from 'react-icons/ri';

export default function Category({ category, products }) {
  const { setting } = usePage().props;
  const [Settings, SetSettings] = useState(setting?.layout?.Single_Category);
  const [layoutType, setLayoutType] = useState('v1');

  // get_taxonomy returns collection, if limit 1 it might be array or object. Just safe check:
  const cat = Array.isArray(category) ? category[0] : category;

  return (
    <div className='w-full max-w-[1600px] mx-auto px-4 py-8 md:py-12'>
      <Head title={cat?.title ? `${cat.title} - Category` : 'Category'} />

      {/* Category Header Banner */}
      <div className="mb-12 bg-accent p-8 min-h-[500px] text-center md:p-14 lg:text-left relative flex flex-col md:flex-row items-center gap-10 shadow-sm border border-permanent/10 overflow-hidden">
        <ImageViwer image={Settings?.banner_image} className='absolute right-0 top-0 z-0' />
        {/* Subtle background decoration */}
        <div className='absolute inset-0 z-0 bg-white/20'></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0"></div>

        {cat?.image && (
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-2xl bg-white flex items-center justify-center p-4 shadow-md border border-permanent/5 relative z-10">
            <img
              src={`/storage/uploads/image/${cat.image.filename}`}
              alt={cat?.title}
              className="max-w-full max-h-full object-contain drop-shadow-sm"
            />
          </div>
        )}

        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 justify-center lg:justify-start mb-3 text-primary text-sm font-bold uppercase tracking-wider">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Category</span>
          </div>
          <h1 className="text-4xl font-extrabold text-heading md:text-5xl lg:text-6xl mb-4">{cat?.title}</h1>
          {cat?.description && (
            <div dangerouslySetInnerHTML={{ __html: cat?.description }} className="text-res max-w-3xl text-lg mx-auto lg:mx-0 leading-relaxed opacity-80"></div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-permanent/10">
        <h2 className="text-2xl font-bold text-heading">Products ({products?.total || (products?.data ? products.data.length : products.length)})</h2>
        <div className="flex items-center gap-2 bg-accent p-1 rounded-xl shadow-sm border border-permanent/10">
            <button 
                onClick={() => setLayoutType('v1')}
                className={`p-2 rounded-lg transition-colors ${layoutType === 'v1' ? 'bg-primary text-white shadow' : 'text-res hover:bg-dynamic'}`}
                title="Grid View"
            >
                <RiGridFill className="size-5" />
            </button>
            <button 
                onClick={() => setLayoutType('v2')}
                className={`p-2 rounded-lg transition-colors ${layoutType === 'v2' ? 'bg-primary text-white shadow' : 'text-res hover:bg-dynamic'}`}
                title="List View"
            >
                <RiListUnordered className="size-5" />
            </button>
        </div>
      </div>

      {/* Products Section */}
      <div className="min-h-[500px]">
        {products && (products.data?.length > 0 || products.length > 0) ? (
          <>
            <ProductGrid
              products={products?.data || products}
              title={`Shop ${cat?.title}`}
              subtitle={`Browse all ${products?.total || (products?.data ? products.data.length : products.length)} products in this category`}
              headingStyle="underline"
              cardType={layoutType}
            />

            {/* Pagination Controls */}
            {products?.links && products.links.length > 3 && (
              <div className="mt-12 flex items-center justify-center gap-2 flex-wrap pb-12">
                {products.links.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.url}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${link.active
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-accent text-res hover:bg-dynamic border border-permanent/20'
                      } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-accent rounded-3xl border border-permanent/10">
            <div className="w-24 h-24 bg-dynamic rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-secondary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-heading mb-2">No Products Found</h3>
            <p className="text-res max-w-md">We couldn't find any products in the {cat?.title} category right now. Please check back later!</p>
            <Link href="/" className="mt-8 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              Continue Shopping
            </Link>
          </div>
        )}
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