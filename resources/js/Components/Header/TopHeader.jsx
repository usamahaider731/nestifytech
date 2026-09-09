import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { TbTruckDelivery } from 'react-icons/tb';
import LanguageDropdown from './LanguageDropdown';
import { RiFacebookLine, RiInstagramLine, RiProfileLine, RiTiktokLine, RiTwitterXLine, RiUser2Line, RiUser3Line, RiUserLine, RiYoutubeLine } from 'react-icons/ri';

const TopHeader = ({ show_language, ContainerType }) => {
    const { props } = usePage();

    return (
        <div className='bg-primary w-full text-text'>
            <div className={` ${ContainerType === "container" ? "container mx-auto" : ""}  px-5`}>
                <div className='flex w-full justify-between items-center'>
                    <div className='flex items-center'>
                        <ul className='flex items-center leading-[38px]'>
                            <li className='text-sm px-3 leading-9.5'>
                                <Link className='font-light'>
                                    Wishlist
                                </Link>
                            </li>
                            <li className='text-sm px-3 border-l-2 border-border'>
                                <Link className='font-light'>
                                    Cart
                                </Link>
                            </li>
                            <li className='text-sm px-3 border-l-2 border-border'>
                                <Link className='font-light'>
                                    Blog
                                </Link>
                            </li>
                            <li className='text-sm px-3 border-l-2 border-border'>
                                <Link className='font-light'>
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className='flex items-center'>
                        <div className='flex items-center gap-2.75'>
                            <Link>
                                <RiTiktokLine size={16} />
                            </Link>
                            <Link>
                                <RiFacebookLine size={16} />
                            </Link>
                            <Link>
                                <RiInstagramLine size={16} />
                            </Link>
                            <Link>
                                <RiTwitterXLine size={16} />
                            </Link>
                            <Link>
                                <RiYoutubeLine size={16} />
                            </Link>
                        </div>
                    </div>
                    <div className='flex items-center'>
                        <ul className='flex leading-9.5'>
                            <li className='px-3.75 text-sm'>
                                <Link className='font-light flex items-center gap-1'>
                                    <TbTruckDelivery size={18} />
                                    Track Your Order
                                </Link>
                            </li>
                            {
                                show_language &&
                                <li className='px-3.75 text-xs border-l-2 border-border'>
                                    <div className='font-light flex items-center gap-1'>
                                        <LanguageDropdown />
                                    </div>
                                </li>
                            }
                            <li className='px-3.75 text-sm border-l-2 border-border'>
                                {props.auth.user ? <Link href={route('admin.dashboard')} className='font-light flex items-center gap-1'><RiUser3Line size={16} /> Profile</Link> :
                                    <Link href={route('login')} className='font-light flex items-center gap-1'>
                                        <RiUser3Line size={16} />
                                        Register Or SignIn
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
