import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { TbTruckDelivery } from 'react-icons/tb';
import LanguageDropdown from './LanguageDropdown';
import { BiMap } from "react-icons/bi";
import { RiUser3Line, RiUserLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

const TopHeader = ({ show_language, ContainerType }) => {
    const { props } = usePage();
    const { __ } = useLang();

    return (
        <div className='w-full border-b border-border bg-bg text-text'>
            <div className={` ${ContainerType === "container" ? "container mx-auto" : ""}  px-5`}>
                <div className='flex w-full justify-between items-center'>
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
                            <p className='text-xs font-medium text-res'>
                            {__('Welcome to Worldwide Electronics Store')}
                        </p>
                    </div>

                    <div className='flex items-center'>
                        <ul className='flex leading-9.5 items-center'>
                            <li className='px-3.75 text-[13px]'>
                                    <Link className='flex items-center gap-1 font-medium transition-colors hover:text-primary'>
                                    <BiMap size={13} />
                                    {__('Store Locator')}
                                </Link>
                            </li>
                            <li className='px-3.75 text-[13px] h-4 border-l-2 border-l-border flex'>
                                <Link className='flex items-center gap-1 font-medium transition-colors hover:text-primary'>
                                    <TbTruckDelivery size={18} />
                                    {__('Track Your Order')}
                                </Link>
                            </li>
                            {
                                show_language &&
                                <li className='px-3.75 text-[13px] flex h-4 border-l-2 border-border'>
                                    <div className='font-medium flex items-center gap-1'>
                                        <LanguageDropdown />
                                    </div>
                                </li>
                            }
                            <li className='px-3.75 text-[13px] h-4 flex items-center border-l-2 border-border'>
                                {props.auth.user ? <Link href={route('admin.dashboard')} className='font-medium hover:text-primary flex items-center gap-1'><RiUserLine size={16} /> {__('My Account')}</Link> :
                                    <Link href={route('login')} className='font-medium hover:text-primary flex items-center gap-1'>
                                        <RiUser3Line size={16} />
                                        {__('Register Or SignIn')}
                                    </Link>
                                }
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TopHeader;
