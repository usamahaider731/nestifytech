import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import ImageViwer from '../Admin/ImageViwer';
import { RiHeartLine, RiMenuLine, RiMessage2Line, RiRepeat2Line, RiShoppingBag3Line, RiUserLine, RiUser3Line } from 'react-icons/ri';
import HeaderSearch from './HeaderSearch';
import NotificationBell from './NotificationBell';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount, selectCartTotal } from '@/store/cartSlice';
import { selectWishlistCount, toggleWishlist } from '@/store/wishListSlice';
import { selectCompareCount, toggleCompare } from '@/store/compareSlice';

const MainNav = ({ ContainerType, isScrolled = false }) => {
    const { setting, auth } = usePage().props;
    const { setIsOpen } = useCart();
    const { __ } = useLang();
    const dispatch = useDispatch();

    const itemCount = useSelector(selectCartCount);
    const subtotal = useSelector(selectCartTotal);
    const wishlistCount = useSelector(selectWishlistCount);
    const compareCount = useSelector(selectCompareCount);

    const currency = setting?.site?.currency?.value ?? 'PKR';
    const is_index = window.location.pathname === '/' || window.location.pathname === '';

    const getLogoName = (logo_name) => {
        if (logo_name === 'logo_light') return 'light_logo';
        if (logo_name === 'logo_dark') return 'dark_logo';
        return logo_name;
    };

    let home_header_logo = setting?.layout?.Header?.home_header_logo;
    let other_header_logo = setting?.layout?.Header?.other_page_header_logo;
    let logo_path = '';

    if (is_index && home_header_logo) {
        home_header_logo = getLogoName(home_header_logo);
        logo_path = setting?.site?.[home_header_logo]?.value || '';
    } else {
        other_header_logo = getLogoName(other_header_logo);
        logo_path = setting?.site?.[other_header_logo]?.value || '';
    }

    return (
        <div
            className={`w-full border-b border-border transition-all duration-300 ${isScrolled ? 'py-0 shadow-none bg-white' : 'bg-white'
                }`}
        >
            <div className={`${ContainerType === 'container' ? 'container mx-auto' : ''} px-5 relative`}>
                <div className={`flex flex-1 items-center gap-5 lg:gap-10 transition-all duration-300 ${isScrolled ? 'py-2.5' : 'py-5 lg:py-7'
                    }`}>

                    {/* Logo */}
                    <div className="logo shrink-0">
                        <Link href="/">
                            <ImageViwer
                                className={`transition-all max-h-12 duration-300 ${isScrolled ? 'max-w-48' : 'max-w-56'}`}
                                image={logo_path}
                                alt={setting?.site_name}
                            />
                        </Link>
                    </div>

                    <RiMenuLine size={21} className="mr-1 cursor-pointer text-text transition-colors hover:text-primary lg:mr-4" />

                    {/* Search — always shown */}
                    <HeaderSearch />

                    {/* Action icons */}
                    <div className="flex gap-4 text-text lg:gap-6">
                        {/* Wishlist */}
                        <button
                            type="button"
                            onClick={() => dispatch(toggleWishlist(true))}
                            className="relative flex cursor-pointer items-center text-text transition hover:text-primary"
                            aria-label={__('Open Wishlist')}
                        >
                            <RiHeartLine size={20} />
                            {wishlistCount > 0 && (
                                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold text-white">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Compare */}
                        <button
                            type="button"
                            onClick={() => dispatch(toggleCompare(true))}
                            className="relative flex cursor-pointer items-center text-text transition hover:text-primary"
                            aria-label={__('Open Compare')}
                        >
                            <RiRepeat2Line size={20} />
                            {compareCount > 0 && (
                                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-info px-1 text-center text-[10px] font-semibold text-text">
                                    {compareCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Bell */}
                        <NotificationBell />

                        {/* Account / Profile */}
                        {auth?.user ? (
                            <div className="relative group flex items-center">
                                <Link
                                    href={route('profile.index')}
                                    className="flex cursor-pointer items-center text-text transition hover:text-primary"
                                    aria-label={__('My Account')}
                                    title={auth.user.name || __('My Account')}
                                >
                                    <RiUserLine size={20} />
                                </Link>
                                <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50 min-w-44">
                                    <div className="bg-bg border border-border rounded shadow-lg py-1.5 text-xs text-text">
                                        <div className="px-3 py-1.5 border-b border-border font-semibold text-res text-[11px] truncate">
                                            {auth.user.name || auth.user.email}
                                        </div>
                                        <Link
                                            href={route('profile.index')}
                                            className="block px-3 py-1.5 hover:bg-bg hover:text-primary transition-colors"
                                        >
                                            {__('Dashboard')}
                                        </Link>
                                        <Link
                                            href={route('profile.orders')}
                                            className="block px-3 py-1.5 hover:bg-bg hover:text-primary transition-colors"
                                        >
                                            {__('My Orders')}
                                        </Link>
                                        <Link
                                            href={route('profile.wishlist')}
                                            className="block px-3 py-1.5 hover:bg-bg hover:text-primary transition-colors"
                                        >
                                            {__('Wishlist')}
                                        </Link>
                                        <Link
                                            href={route('profile.settings')}
                                            className="block px-3 py-1.5 hover:bg-bg hover:text-primary transition-colors"
                                        >
                                            {__('Settings')}
                                        </Link>
                                        <div className="border-t border-border mt-1 pt-1">
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                            >
                                                {__('Log Out')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href={route('login')}
                                className="flex cursor-pointer items-center text-text transition hover:text-primary"
                                aria-label={__('Sign In')}
                                title={__('Sign In')}
                            >
                                <RiUser3Line size={20} />
                            </Link>
                        )}

                        {/* Cart — always shown */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="flex gap-3 items-center text-left"
                            aria-label={__('Open cart')}
                        >
                            <div className="relative flex items-center">
                                <RiShoppingBag3Line size={20} />
                                {itemCount > 0 && (
                                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-info px-1 text-center text-[10px] font-semibold text-text">
                                        {itemCount}
                                    </span>
                                )}
                            </div>
                            {/* Show subtotal only in non-sticky mode */}
                            <div className="flex flex-col">
                                <span className="text-md font-semibold">
                                    {currency} {subtotal.toLocaleString()}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainNav;
