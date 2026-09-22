import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    RiAddLine,
    RiCloseLine,
    RiDeleteBin6Line,
    RiShoppingBag3Line,
    RiSubtractLine,
} from 'react-icons/ri';
import { usePage } from '@inertiajs/react';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartCount, selectCartTotal, setComboQty, removeFromCart } from '@/store/cartSlice';

export default function CartDrawer() {
    const { setting } = usePage().props;
    const currency = setting?.site?.currency?.value ?? 'PKR';
    const { isOpen, setIsOpen } = useCart();
    const { __ } = useLang();
    
    const dispatch = useDispatch();
    const items = useSelector(selectCartItems);
    const itemCount = useSelector(selectCartCount);
    const subtotal = useSelector(selectCartTotal);
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1000]" onClose={() => setIsOpen(false)}>
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
                                                <RiShoppingBag3Line className="size-5 text-primary" />
                                                {__('Your Cart')}
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-text">
                                                    {itemCount}
                                                </span>
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                onClick={() => setIsOpen(false)}
                                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
                                                aria-label={__('Close cart')}
                                            >
                                                <RiCloseLine className="size-5" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-5 py-4">
                                            {items.length === 0 ? (
                                                <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-16">
                                                    <RiShoppingBag3Line className="size-12 text-slate-300" />
                                                    <p className="text-sm font-medium text-slate-500">
                                                        {__('Your cart is empty')}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsOpen(false)}
                                                        className="text-sm font-semibold text-primary hover:underline"
                                                    >
                                                        {__('Continue shopping')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <ul className="space-y-4">
                                                    {items.map((item) => (
                                                        <li
                                                            key={item.comboId}
                                                            className="flex gap-3 rounded-xl border border-slate-100 p-3"
                                                        >
                                                            <div className="size-16 shrink-0 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                                                                {typeof item.image === 'string' ? (
                                                                    <ImageViwer
                                                                        image={item.image}
                                                                        alt={item.title}
                                                                        className="size-full object-contain"
                                                                    />
                                                                ) : (
                                                                    <ImageViwer
                                                                        image={item.image}
                                                                        className="size-full object-contain"
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="flex flex-1 flex-col gap-2 min-w-0">
                                                                <p className="text-sm font-semibold text-heading line-clamp-2">
                                                                    {item.title}
                                                                    {item.color && <span className="block text-xs text-slate-500">{item.color}</span>}
                                                                </p>
                                                                <p className="text-sm font-bold text-primary">
                                                                    {currency}{' '}
                                                                    {Number(item.price).toLocaleString()}
                                                                </p>

                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="inline-flex items-center rounded-lg border border-slate-200">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                dispatch(setComboQty({ comboId: item.comboId, qty: item.qty - 1 }))
                                                                            }
                                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-l-lg"
                                                                            aria-label={__('Decrease quantity')}
                                                                        >
                                                                            <RiSubtractLine className="size-4" />
                                                                        </button>
                                                                        <span className="min-w-8 text-center text-sm font-semibold">
                                                                            {item.qty}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                dispatch(setComboQty({ comboId: item.comboId, qty: item.qty + 1 }))
                                                                            }
                                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-r-lg"
                                                                            aria-label={__('Increase quantity')}
                                                                        >
                                                                            <RiAddLine className="size-4" />
                                                                        </button>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => dispatch(removeFromCart(item.comboId))}
                                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                        aria-label={__('Remove item')}
                                                                    >
                                                                        <RiDeleteBin6Line className="size-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {items.length > 0 && (
                                            <div className="border-t border-slate-200 px-5 py-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-500">{__('Subtotal')}</span>
                                                    <span className="text-lg font-bold text-heading">
                                                        {currency} {subtotal.toLocaleString()}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-text transition-all hover:opacity-90 active:scale-[0.98]"
                                                >
                                                    {__('Proceed to Checkout')}
                                                </button>
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
