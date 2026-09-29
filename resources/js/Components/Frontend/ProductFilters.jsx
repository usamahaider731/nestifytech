import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { RiCloseLine, RiFilter3Line } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

const SORT_OPTIONS = [
    { value: 'latest', label: 'Latest' },
    { value: 'popular', label: 'Most popular' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
];

function toQuery(next, bounds = {}) {
    const params = {};
    const minBound = bounds.min;
    const maxBound = bounds.max;
    const minPrice = next.min_price === '' || next.min_price == null ? null : Number(next.min_price);
    const maxPrice = next.max_price === '' || next.max_price == null ? null : Number(next.max_price);

    if (minPrice !== null && (minBound === undefined || minPrice !== Number(minBound))) {
        params.min_price = minPrice;
    }
    if (maxPrice !== null && (maxBound === undefined || maxPrice !== Number(maxBound))) {
        params.max_price = maxPrice;
    }
    if (next.brands?.length) {
        params.brands = next.brands.join(',');
    }
    if (next.subcategory?.length) {
        params.subcategory = next.subcategory.join(',');
    }
    if (next.in_stock) {
        params.in_stock = 1;
    }
    if (next.sort && next.sort !== 'latest') {
        params.sort = next.sort;
    }
    return params;
}

export default function ProductFilters({
    filters,
    options,
    currency = 'PKR',
    className = '',
    mobileOpen = false,
    onClose,
}) {
    const { __ } = useLang();
    const price = options?.price ?? { min: 0, max: 100000 };
    const [local, setLocal] = useState({
        min_price: filters?.min_price ?? price.min,
        max_price: filters?.max_price ?? price.max,
        brands: filters?.brands ?? [],
        subcategory: filters?.subcategory ?? [],
        in_stock: Boolean(filters?.in_stock),
        sort: filters?.sort ?? 'latest',
    });

    useEffect(() => {
        setLocal({
            min_price: filters?.min_price ?? price.min,
            max_price: filters?.max_price ?? price.max,
            brands: filters?.brands ?? [],
            subcategory: filters?.subcategory ?? [],
            in_stock: Boolean(filters?.in_stock),
            sort: filters?.sort ?? 'latest',
        });
    }, [filters, price.min, price.max]);

    const activeCount = useMemo(() => {
        let count = 0;
        if (filters?.brands?.length) count += filters.brands.length;
        if (filters?.subcategory?.length) count += filters.subcategory.length;
        if (filters?.in_stock) count += 1;
        if (filters?.min_price != null || filters?.max_price != null) count += 1;
        if (filters?.sort && filters.sort !== 'latest') count += 1;
        return count;
    }, [filters]);

    const apply = (next) => {
        router.get(window.location.pathname, toQuery(next, price), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const toggleId = (key, id) => {
        const current = (local[key] ?? []).map(String);
        const idStr = String(id);
        const nextIds = current.includes(idStr)
            ? current.filter((item) => item !== idStr)
            : [...current, idStr];
        const next = { ...local, [key]: nextIds };
        setLocal(next);
        apply(next);
    };

    const applyPrice = () => {
        const next = {
            ...local,
            min_price: Number(local.min_price),
            max_price: Number(local.max_price),
        };
        apply(next);
    };

    const clearAll = () => {
        const next = {
            min_price: price.min,
            max_price: price.max,
            brands: [],
            subcategory: [],
            in_stock: false,
            sort: 'latest',
        };
        setLocal(next);
        apply({ ...next, min_price: null, max_price: null });
    };

    const body = (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <RiFilter3Line className="size-5 text-primary" />
                    <h2 className="text-lg font-bold text-heading">{__('Filters')}</h2>
                    {activeCount > 0 && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-heading">
                            {activeCount}
                        </span>
                    )}
                </div>
                {activeCount > 0 && (
                    <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
                        {__('Clear all')}
                    </button>
                )}
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-secondary px-3 py-2.5">
                <span className="text-sm font-semibold text-heading">{__('In stock only')}</span>
                <input
                    type="checkbox"
                    checked={local.in_stock}
                    onChange={(e) => {
                        const next = { ...local, in_stock: e.target.checked };
                        setLocal(next);
                        apply(next);
                    }}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                />
            </label>

            <section className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-res">{__('Price')}</h3>
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-res">{__('Min')}</span>
                        <input
                            type="number"
                            min={price.min}
                            max={local.max_price}
                            value={local.min_price ?? ''}
                            onChange={(e) => setLocal((prev) => ({ ...prev, min_price: e.target.value }))}
                            onBlur={applyPrice}
                            className="w-full rounded-lg border-border bg-white px-3 py-2 text-sm text-heading focus:border-primary focus:ring-primary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-res">{__('Max')}</span>
                        <input
                            type="number"
                            min={local.min_price}
                            max={price.max}
                            value={local.max_price ?? ''}
                            onChange={(e) => setLocal((prev) => ({ ...prev, max_price: e.target.value }))}
                            onBlur={applyPrice}
                            className="w-full rounded-lg border-border bg-white px-3 py-2 text-sm text-heading focus:border-primary focus:ring-primary"
                        />
                    </label>
                </div>
                <p className="text-[11px] text-res">
                    {currency} {Number(price.min).toLocaleString()} – {currency} {Number(price.max).toLocaleString()}
                </p>
            </section>

            {options?.categories?.length > 0 && (
                <section className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-res">{__('Subcategories')}</h3>
                    <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                        {options.categories.map((category) => (
                            <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm text-heading">
                                <input
                                    type="checkbox"
                                    checked={local.subcategory.map(String).includes(String(category.id))}
                                    onChange={() => toggleId('subcategory', category.id)}
                                    className="size-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="line-clamp-1">{category.title}</span>
                            </label>
                        ))}
                    </div>
                </section>
            )}

            {options?.brands?.length > 0 && (
                <section className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-res">{__('Brands')}</h3>
                    <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                        {options.brands.map((brand) => (
                            <label key={brand.id} className="flex cursor-pointer items-center gap-2 text-sm text-heading">
                                <input
                                    type="checkbox"
                                    checked={local.brands.map(String).includes(String(brand.id))}
                                    onChange={() => toggleId('brands', brand.id)}
                                    className="size-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="line-clamp-1">{brand.title}</span>
                            </label>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );

    return (
        <>
            <aside className={`hidden lg:block ${className}`}>
                <div className="sticky top-24 rounded border border-border bg-white p-5 shadow-sm">
                    {body}
                </div>
            </aside>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button type="button" className="absolute inset-0 bg-heading/40" onClick={onClose} aria-label={__('Close filters')} />
                    <div className="absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <span className="font-bold text-heading">{__('Filters')}</span>
                            <button type="button" onClick={onClose} className="rounded-full p-2 text-res hover:bg-accent">
                                <RiCloseLine className="size-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">{body}</div>
                    </div>
                </div>
            )}
        </>
    );
}

export function CatalogSort({ value, onChange }) {
    const { __ } = useLang();
    return (
        <label className="flex items-center gap-2 text-sm text-res">
            <span className="hidden sm:inline font-medium">{__('Sort')}</span>
            <select
                value={value || 'latest'}
                onChange={(e) => onChange(e.target.value)}
                className="rounded border-border bg-white px-4 py-2 text-sm font-semibold text-heading focus:border-primary focus:ring-primary"
            >
                {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {__(option.label)}
                    </option>
                ))}
            </select>
        </label>
    );
}

export { toQuery };
