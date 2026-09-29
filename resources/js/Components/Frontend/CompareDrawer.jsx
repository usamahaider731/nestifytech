import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    RiCloseLine,
    RiDeleteBin6Line,
    RiStackLine,
} from 'react-icons/ri';
import { Link, usePage } from '@inertiajs/react';
import { useLang } from '@/contexts/LanguageContext';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { useSelector, useDispatch } from 'react-redux';
import { selectCompareItems, selectCompareCount, removeFromCompare, toggleCompare, selectIsCompareOpen } from '@/store/compareSlice';
import { MdCompareArrows } from 'react-icons/md';

export default function CompareDrawer() {
    const { setting } = usePage().props;
    const currency = setting?.site?.currency?.value ?? 'PKR';
    const isOpen = useSelector(selectIsCompareOpen);
    const { __ } = useLang();
    
    const dispatch = useDispatch();
    const items = useSelector(selectCompareItems);
    const itemCount = useSelector(selectCompareCount);

    const parsePrice = (priceVal) => {
        if (typeof priceVal === 'number') return priceVal;
        if (!priceVal) return 0;
        const parsed = Number(String(priceVal).replace(/,/g, ''));
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1000]" onClose={() => dispatch(toggleCompare(false))}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-200"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-white shadow-2xl">
                                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                            <Dialog.Title className="flex items-center gap-2 text-lg font-bold text-heading">
                                                <RiStackLine className="size-5 text-primary" />
                                                {__('Compare Products')}
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-text">
                                                    {itemCount}/4
                                                </span>
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                onClick={() => dispatch(toggleCompare(false))}
                                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
                                                aria-label={__('Close compare')}
                                            >
                                                <RiCloseLine className="size-5" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-5 py-4">
                                            {items.length === 0 ? (
                                                <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-16">
                                                    <RiStackLine className="size-12 text-slate-300" />
                                                    <p className="text-sm font-medium text-slate-500">
                                                        {__('No products to compare')}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => dispatch(toggleCompare(false))}
                                                        className="text-sm font-semibold text-primary hover:underline"
                                                    >
                                                        {__('Continue shopping')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <ul className="space-y-4">
                                                    {items.map((item) => {
                                                        const firstPrice = parsePrice(item.product?.meta?.first_price?.value);
                                                        const secondPrice = parsePrice(item.product?.meta?.second_price?.value);
                                                        const salePrice = firstPrice > secondPrice && secondPrice > 0 ? secondPrice : firstPrice;

                                                        return (
                                                        <li
                                                            key={item.productId}
                                                            className="flex gap-3 rounded-xl border border-slate-100 p-3"
                                                        >
                                                            <div className="size-16 shrink-0 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                                                                {typeof item.product?.image === 'string' ? (
                                                                    <ImageViwer
                                                                        image={item.product?.image}
                                                                        alt={item.product?.title}
                                                                        className="size-full object-contain"
                                                                    />
                                                                ) : (
                                                                    <ImageViwer
                                                                        image={item.product?.image}
                                                                        className="size-full object-contain"
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="flex flex-1 flex-col gap-2 min-w-0">
                                                                <p className="text-sm font-semibold text-heading line-clamp-2">
                                                                    {item.product?.title}
                                                                </p>
                                                                <p className="text-sm font-bold text-primary">
                                                                    {currency}{' '}
                                                                    {salePrice.toLocaleString()}
                                                                </p>

                                                                <div className="flex items-center justify-between gap-2 mt-auto">
                                                                    {item.product?.sku && item.product?.id && (
                                                                        <Link
                                                                            href={route('post', { sku: item.product.sku, id: item.product.id, type: 'product' })}
                                                                            onClick={() => dispatch(toggleCompare(false))}
                                                                            className="text-xs font-semibold text-primary hover:underline"
                                                                        >
                                                                            {__('View Details')}
                                                                        </Link>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => dispatch(removeFromCompare(item.productId))}
                                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                                                                        aria-label={__('Remove item')}
                                                                    >
                                                                        <RiDeleteBin6Line className="size-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    )})}
                                                </ul>
                                            )}
                                        </div>

                                        {items.length > 0 && (
                                            <div className="border-t border-slate-200 px-5 py-4">
                                                <Link
                                                    href={route('compare')} // Ensure this route exists or update it later
                                                    onClick={() => dispatch(toggleCompare(false))}
                                                    className="w-full rounded-xl flex items-center justify-center gap-2 px-3 bg-primary py-3 text-sm font-bold text-text transition-all hover:opacity-90 active:scale-[0.98]"
                                                >
                                                    <MdCompareArrows className='size-5' />
                                                    {__('Compare Now')}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
