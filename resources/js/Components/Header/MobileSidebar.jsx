import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, usePage } from '@inertiajs/react';
import { useLang } from '@/contexts/LanguageContext';
import ImageViwer from '@/Components/Admin/ImageViwer';
import LanguageDropdown from './LanguageDropdown';
import {
    RiCloseLine,
    RiHome4Line,
    RiShoppingBag3Line,
    RiHeartLine,
    RiRepeat2Line,
    RiUserLine,
    RiUser3Line,
    RiMapPin2Line,
    RiTruckLine,
    RiAppsLine,
    RiArrowRightSLine,
    RiLogoutBoxRLine,
    RiSettings4Line,
    RiFileList3Line,
} from 'react-icons/ri';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount } from '@/store/cartSlice';
import { selectWishlistCount, toggleWishlist } from '@/store/wishListSlice';
import { selectCompareCount, toggleCompare } from '@/store/compareSlice';
import { useCart } from '@/contexts/CartContext';

export default function MobileSidebar({ isOpen, onClose }) {
    const { props } = usePage();
    const { setting, auth, searchCategories = [] } = props;
    const { __ } = useLang();
    const { setIsOpen: setCartOpen } = useCart();
    const dispatch = useDispatch();

    const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'categories'

    const menuLocation = setting?.layout?.Header?.header_menu;
    const menuItems = (setting?.menu || []).filter((item) => !menuLocation || item.location === menuLocation);

    const wishlistCount = useSelector(selectWishlistCount);
    const cartCount = useSelector(selectCartCount);
    const compareCount = useSelector(selectCompareCount);

    const logoPath = setting?.site?.dark_logo?.value || setting?.site?.light_logo?.value || '';
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1100]" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-200"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-xs sm:max-w-sm">
                                    <div className="flex h-full flex-col bg-white shadow-2xl">
                                        {/* Header */}
                                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
                                            <Link href="/" onClick={onClose} className="block shrink-0">
                                                <ImageViwer
                                                    className="max-h-9 max-w-40"
                                                    image={logoPath}
                                                    alt={setting?.site_name || 'NestifyTech'}
                                                />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                                                aria-label={__('Close sidebar')}
                                            >
                                                <RiCloseLine size={22} />
                                            </button>
                                        </div>

                                        {/* User Brief Card */}
                                        <div className="px-5 py-3.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/15 flex items-center justify-between">
                                            {auth?.user ? (
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="size-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                                        {
                                                            auth.user.user_avater ?

                                                                <ImageViwer className="w-9 h-9 rounded-full object-cover" height={900} width={900} image={auth.user.user_avater} />
                                                                :
                                                                (auth.user.name || auth.user.email || 'U').charAt(0).toUpperCase()
                                                        }
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-heading truncate">{auth.user.name || __('My Account')}</p>
                                                        <p className="text-[11px] text-res truncate">{auth.user.email}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={route('login')}
                                                    onClick={onClose}
                                                    className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                                                >
                                                    <RiUser3Line size={16} />
                                                    <span>{__('Sign In / Register')}</span>
                                                </Link>
                                            )}
                                        </div>

                                        {/* Tabs: Navigation Menu vs Categories */}
                                        <div className="grid grid-cols-2 border-b border-slate-200 text-xs font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('menu')}
                                                className={`py-3 text-center border-b-2 transition-all cursor-pointer ${activeTab === 'menu'
                                                        ? 'border-primary text-primary bg-primary/5'
                                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                                    }`}
                                            >
                                                {__('Menu')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('categories')}
                                                className={`py-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'categories'
                                                        ? 'border-primary text-primary bg-primary/5'
                                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                                    }`}
                                            >
                                                <RiAppsLine size={14} />
                                                <span>{__('Categories')}</span>
                                            </button>
                                        </div>

                                        {/* Body content */}
                                        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-slate-100">
                                            {activeTab === 'menu' ? (
                                                <nav className="flex flex-col gap-0.5 pb-3">
                                                    <Link
                                                        href="/"
                                                        onClick={onClose}
                                                        className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-semibold text-heading hover:bg-slate-100/80 transition-colors"
                                                    >
                                                        <span className="flex items-center gap-2.5">
                                                            <RiHome4Line size={16} className="text-primary" />
                                                            {__('Home')}
                                                        </span>
                                                        <RiArrowRightSLine size={16} className="text-slate-400" />
                                                    </Link>

                                                    {menuItems.map((item, idx) => (
                                                        <Link
                                                            key={idx}
                                                            href={item.link || '#'}
                                                            onClick={onClose}
                                                            className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                        >
                                                            <span>{item.name}</span>
                                                            <RiArrowRightSLine size={16} className="text-slate-400" />
                                                        </Link>
                                                    ))}
                                                </nav>
                                            ) : (
                                                <div className="flex flex-col gap-0.5 pb-3">
                                                    {searchCategories.length > 0 ? (
                                                        searchCategories.map((cat, idx) => (
                                                            <Link
                                                                key={idx}
                                                                href={route('taxonomy.view', { type: 'category', id: cat.id, slug: cat.slug || '' })}
                                                                onClick={onClose}
                                                                className="flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                            >
                                                                <span className="truncate">{cat.title}</span>
                                                                <RiArrowRightSLine size={16} className="text-slate-400 shrink-0" />
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-res py-4 text-center">{__('No categories found')}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Quick Actions Shortcuts */}
                                            <div className="py-3 flex flex-col gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onClose();
                                                        setCartOpen(true);
                                                    }}
                                                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2.5">
                                                        <RiShoppingBag3Line size={16} className="text-primary" />
                                                        {__('Shopping Cart')}
                                                    </span>
                                                    {cartCount > 0 && (
                                                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            {cartCount}
                                                        </span>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onClose();
                                                        dispatch(toggleWishlist(true));
                                                    }}
                                                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2.5">
                                                        <RiHeartLine size={16} className="text-rose-500" />
                                                        {__('Wishlist')}
                                                    </span>
                                                    {wishlistCount > 0 && (
                                                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            {wishlistCount}
                                                        </span>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onClose();
                                                        dispatch(toggleCompare(true));
                                                    }}
                                                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2.5">
                                                        <RiRepeat2Line size={16} className="text-blue-500" />
                                                        {__('Compare')}
                                                    </span>
                                                    {compareCount > 0 && (
                                                        <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            {compareCount}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Account Links */}
                                            {auth?.user && (
                                                <div className="py-3 flex flex-col gap-1">
                                                    <Link
                                                        href={route('profile.index')}
                                                        onClick={onClose}
                                                        className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                    >
                                                        <RiUserLine size={16} className="text-slate-500" />
                                                        {__('Dashboard')}
                                                    </Link>
                                                    <Link
                                                        href={route('profile.orders')}
                                                        onClick={onClose}
                                                        className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                    >
                                                        <RiFileList3Line size={16} className="text-slate-500" />
                                                        {__('My Orders')}
                                                    </Link>
                                                    <Link
                                                        href={route('profile.settings')}
                                                        onClick={onClose}
                                                        className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-medium text-heading hover:bg-slate-100/80 transition-colors"
                                                    >
                                                        <RiSettings4Line size={16} className="text-slate-500" />
                                                        {__('Account Settings')}
                                                    </Link>
                                                    <Link
                                                        href={route('logout')}
                                                        method="post"
                                                        as="button"
                                                        onClick={onClose}
                                                        className="w-full text-left flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        <RiLogoutBoxRLine size={16} />
                                                        {__('Log Out')}
                                                    </Link>
                                                </div>
                                            )}

                                            {/* Store & Tracking Utilities */}
                                            <div className="py-3 flex flex-col gap-1">
                                                {props.shopCities?.length > 0 && (
                                                    <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/10 mb-1">
                                                        <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1">
                                                            <RiMapPin2Line size={13} />
                                                            {__('Shop by City')}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <Link
                                                                href={route('shop')}
                                                                onClick={onClose}
                                                                className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-border text-heading hover:border-primary hover:text-primary transition-colors"
                                                            >
                                                                {__('All')}
                                                            </Link>
                                                            {props.shopCities.map((city) => (
                                                                <Link
                                                                    key={city.id}
                                                                    href={route('shop', { city: city.id })}
                                                                    onClick={onClose}
                                                                    className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-border text-heading hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
                                                                >
                                                                    <span>{city.title}</span>
                                                                    {city.product_count !== undefined && (
                                                                        <span className="text-[9px] text-res">({city.product_count})</span>
                                                                    )}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <Link
                                                    href={route('store.locator')}
                                                    onClick={onClose}
                                                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-medium text-res hover:text-primary hover:bg-slate-100/80 transition-colors"
                                                >
                                                    <RiMapPin2Line size={16} />
                                                    {__('Store Locator')}
                                                </Link>
                                                <Link
                                                    href={auth?.user ? route('profile.orders') : route('login')}
                                                    onClick={onClose}
                                                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-medium text-res hover:text-primary hover:bg-slate-100/80 transition-colors"
                                                >
                                                    <RiTruckLine size={16} />
                                                    {__('Track Your Order')}
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Footer Language dropdown */}
                                        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 font-medium">{__('Language')}</span>
                                            <LanguageDropdown />
                                        </div>
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
