import React from 'react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { Head, Link } from '@inertiajs/react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCompareItems, removeFromCompare, clearCompare } from '@/store/compareSlice';
import { useLang } from '@/contexts/LanguageContext';
import { usePage } from '@inertiajs/react';
import { RiDeleteBin6Line, RiStackLine, RiCloseLine } from 'react-icons/ri';
import ImageViwer from '@/Components/Admin/ImageViwer';

export default function ComparePage() {
    const { setting } = usePage().props;
    const currency = setting?.site?.currency?.value ?? 'PKR';
    const { __ } = useLang();
    const dispatch = useDispatch();
    const items = useSelector(selectCompareItems);

    const parsePrice = (priceVal) => {
        if (typeof priceVal === 'number') return priceVal;
        if (!priceVal) return 0;
        const parsed = Number(String(priceVal).replace(/,/g, ''));
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    // Collect all unique attribute keys across compared products
    const allAttributeKeys = [...new Set(
        items.flatMap(item => Object.keys(item.product?.meta ?? {}))
            .filter(key => !['stock', 'first_price', 'second_price', 'images', 'category', 'brand', 'user_id', 'type', 'state', 'city', 'address_coordinates', 'short_description'].includes(key))
    )];

    return (
        <FrontendLayout title={__('Compare Products')}>
            <Head title={__('Compare Products')} />

            <div className="container mx-auto px-5 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold font-poppins text-heading">
                        <RiStackLine className="text-primary" />
                        {__('Compare Products')}
                    </h1>
                    {items.length > 0 && (
                        <button
                            type="button"
                            onClick={() => dispatch(clearCompare())}
                            className="text-sm text-red-500 hover:underline"
                        >
                            {__('Clear All')}
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                        <RiStackLine className="size-16 text-slate-200" />
                        <p className="text-slate-500">{__('No products to compare')}</p>
                        <Link href={route('index')} className="rounded bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
                            {__('Continue Shopping')}
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                        <table className="w-full min-w-[640px] border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-common">
                                    <th className="w-40 p-4 text-left text-sm font-semibold text-res">{__('Feature')}</th>
                                    {items.map(item => (
                                        <th key={item.productId} className="p-4 text-center">
                                            <div className="relative flex flex-col items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch(removeFromCompare(item.productId))}
                                                    className="absolute -right-2 -top-2 rounded-full bg-red-100 p-0.5 text-red-500 hover:bg-red-200"
                                                >
                                                    <RiCloseLine className="size-3.5" />
                                                </button>
                                                <div className="size-20 overflow-hidden rounded-lg border border-border bg-white">
                                                    <ImageViwer image={item.product?.image} className="size-full object-contain p-1" />
                                                </div>
                                                <span className="line-clamp-2 text-xs font-semibold text-heading">{item.product?.title}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Price Row */}
                                <tr className="border-b border-border even:bg-common/40">
                                    <td className="p-4 text-sm font-medium text-res">{__('Price')}</td>
                                    {items.map(item => {
                                        const firstPrice = parsePrice(item.product?.meta?.first_price?.value);
                                        const secondPrice = parsePrice(item.product?.meta?.second_price?.value);
                                        const salePrice = firstPrice > secondPrice && secondPrice > 0 ? secondPrice : firstPrice;
                                        return (
                                            <td key={item.productId} className="p-4 text-center">
                                                <span className="font-bold font-oswald text-heading">{currency} {salePrice.toLocaleString()}</span>
                                                {firstPrice > secondPrice && secondPrice > 0 && (
                                                    <span className="ml-2 text-xs text-res line-through font-oswald">{currency} {firstPrice.toLocaleString()}</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>

                                {/* Stock Row */}
                                <tr className="border-b border-border even:bg-common/40">
                                    <td className="p-4 text-sm font-medium text-res">{__('Stock')}</td>
                                    {items.map(item => {
                                        const stock = Number(item.product?.meta?.stock?.value ?? 0);
                                        return (
                                            <td key={item.productId} className="p-4 text-center">
                                                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                    {stock > 0 ? __('In Stock') : __('Out of Stock')}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>

                                {/* Dynamic attribute rows */}
                                {allAttributeKeys.map(key => (
                                    <tr key={key} className="border-b border-border even:bg-common/40">
                                        <td className="p-4 text-sm font-medium capitalize text-res">{key.replace(/_/g, ' ')}</td>
                                        {items.map(item => {
                                            if (item.product.meta[key],key != "seo_description") {
                                                return (
                                                    <td key={item.productId} className="p-4 text-center text-sm text-heading">
                                                        {item.product?.meta?.[key]?.value ?? <span className="text-slate-300">—</span>}
                                                    </td>
                                                )
                                            }
                                            else {
                                                return (
                                                    <td key={item.productId} className="p-4 text-sm text-heading">
                                                        <span dangerouslySetInnerHTML={{ __html: item.product?.meta?.[key]?.value ?? '-' }} />
                                                    </td>
                                                )
                                            }
                                        })}
                                    </tr>
                                ))}

                                {/* Action Row */}
                                <tr>
                                    <td className="p-4 text-sm font-medium text-res">{__('Action')}</td>
                                    {items.map(item => (
                                        <td key={item.productId} className="p-4 text-center">
                                            {item.product?.sku && item.product?.id ? (
                                                <Link
                                                    href={route('post', { sku: item.product.sku, id: item.product.id, type: 'product' })}
                                                    className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                                                >
                                                    {__('View Details')}
                                                </Link>
                                            ) : '—'}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </FrontendLayout>
    );
}
