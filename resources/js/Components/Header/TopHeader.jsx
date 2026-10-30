import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { TbTruckDelivery } from 'react-icons/tb';
import LanguageDropdown from './LanguageDropdown';
import CitySelectorDropdown from './CitySelectorDropdown';
import { BiMap } from "react-icons/bi";
import { RiUser3Line, RiUserLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

const TopHeader = ({ show_language, ContainerType }) => {
    const { props } = usePage();
    const { __ } = useLang();

    return (
        <div className='w-full border-b border-border bg-bg text-text'>
            <div className={` ${ContainerType === "container" ? "container mx-auto" : ""}  px-5`}>
                <div className='flex w-full justify-between items-center flex-wrap'>
                    <div className='flex items-center'>
                        {/* <ul className='flex items-center leading-[38px]'>
                            <li className='text-xs px-3 leading-9.5'>
                                <Link className='font-medium'>
                                    Wishlist
                                </Link>
                            </li>
                            <li className='text-xs px-3 border-l-2 border-border'>
                                <Link className='font-medium'>
                                    Cart
                                </Link>
                            </li>
                            <li className='text-xs px-3 border-l-2 border-border'>
                                <Link className='font-medium'>
                                    Blog
                                </Link>
                            </li>
                            <li className='text-xs px-3 border-l-2 border-border'>
                                <Link className='font-medium'>
                                    Contact Us
                                </Link>
                            </li>
                        </ul> */}
                        <p className='text-xs leading-9.5 font-medium font-roboto text-res'>
                            {__('Welcome to Worldwide Electronics Store')}
                        </p>
                    </div>

                    <div className='sm:flex hidden items-center'>
                        <ul className='flex leading-9.5 items-center font-roboto'>
                            <li className='lg:px-3.75 pl-0 md:pl-3 px-3 text-[11px] md:text-[13px] flex items-center'>
                                <CitySelectorDropdown />
                            </li>
                            <li className='lg:px-3.75 px-3 text-[11px] md:text-[13px] h-4 border-l-2 border-l-border flex'>
                                <Link href={route('store.locator')} className='flex items-center gap-1 font-medium transition-colors hover:text-primary'>
                                    <BiMap size={13} />
                                    {__('Store Locator')}
                                </Link>
                            </li>
                            <li className='lg:px-3.75 px-3 text-[11px] md:text-[13px] h-4 border-l-2 border-l-border flex'>
                                <Link href={props.auth?.user ? route('profile.orders') : route('login')} className='flex items-center gap-1 font-medium transition-colors hover:text-primary'>
                                    <TbTruckDelivery size={18} />
                                    {__('Track Your Order')}
                                </Link>
                            </li>
                            {
                                show_language &&
                                <li className='lg:px-3.75 px-3 text-[11px] md:text-[13px] flex h-4 border-l-2 border-border'>
                                    <div className='font-medium flex items-center gap-1'>
                                        <LanguageDropdown />
                                    </div>
                                </li>
                            }
                            <li className='lg:px-3.75 px-3 text-[11px] md:text-[13px] h-4 flex items-center border-l-2 border-border relative'>
                                {props.auth.user ? (
                                    <div className="relative group">
                                        <Link
                                            href={route('profile.index')}
                                            className="font-medium hover:text-primary flex items-center gap-1 cursor-pointer"
                                        >
                                            <RiUserLine size={16} />
                                            <span className="truncate max-w-[120px]">{props.auth.user.name || __('My Account')}</span>
                                        </Link>
                                        <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50 min-w-44">
                                            <div className="bg-bg border border-border rounded shadow-lg py-1.5 text-xs text-text">
                                                <div className="px-3 py-1.5 border-b border-border font-semibold text-res text-[11px] truncate">
                                                    {props.auth.user.email}
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
                                    <Link href={route('login')} className='font-medium hover:text-primary flex items-center gap-1'>
                                        <RiUser3Line size={16} />
                                        {__('Register Or SignIn')}
                                    </Link>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TopHeader;
