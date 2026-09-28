import React from 'react';
import { Link } from '@inertiajs/react';
import { RiArrowRightUpLine, RiStore2Line } from 'react-icons/ri';
import ImageViwer from './Admin/ImageViwer';

export default function CategoryCard({ category }) {
    // Fallback values
    const title = category?.title || category?.name || 'Category Name';
    const slug = category?.slug || '#';
    const itemCount = category?.products_count ?? category?.item_count ?? 0;
    const image = category?.image || category?.thumbnail;

    return (
        <div className="group relative h-72 w-full overflow-hidden rounded-2xl bg-bg border border-border shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
            {/* Background Image / Placeholder */}
            {image ? (
                <ImageViwer
                    image={image}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/20 text-res">
                    <RiStore2Line className="text-5xl opacity-40" />
                </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

            {/* Top Badge (Item Count) */}
            <div className="absolute top-4 left-4 z-10">
                <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10">
                    {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
                </span>
            </div>

            {/* Arrow Button */}
            <div className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-primary group-hover:text-black group-hover:rotate-45">
                <RiArrowRightUpLine className="text-lg" />
            </div>

            {/* Content (Title & Link) */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
                <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-primary">
                    {title}
                </h3>
                
                <p className="mt-1 text-xs text-gray-300 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    Explore collection &rarr;
                </p>

                {/* Full Card Link */}
                <Link
                    href={`/category/${slug}`}
                    className="absolute inset-0 z-20"
                    aria-label={`Browse ${title}`}
                />
            </div>
        </div>
    );
}