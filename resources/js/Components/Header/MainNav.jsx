import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import ImageViwer from '../Admin/ImageViwer';
import { RiHeartLine, RiMenuLine, RiMessage2Line, RiMessage3Line, RiMessageLine, RiRepeat2Line, RiRepeatLine, RiShoppingBag3Line } from 'react-icons/ri';
import HeaderSearch from './HeaderSearch';
import { useCart } from '@/contexts/CartContext';
import { TbGitCompare } from 'react-icons/tb';
import { FiMessageCircle, FiMessageSquare, FiRepeat } from 'react-icons/fi';

const MainNav = ({ ContainerType }) => {
    const { setting } = usePage().props;
    const { setIsOpen, itemCount, subtotal } = useCart();
    const currency = setting?.site?.currency?.value ?? 'PKR';
    return (
        <div className='w-full bg-white'>
            <div className={` ${ContainerType === "container" ? "container mx-auto" : ""}  px-5 relative`}>
                <div className='flex items-center gap-5 flex-1 pt-7.75 pb-5.25'>
                    <div className="logo pr-2.5">
                        <Link href="/">
                            <ImageViwer className="w-32" image={setting.site.light_logo.value} alt={setting?.site_name} />
                        </Link>
                    </div>
                    <RiMenuLine size={20} className='cursor-pointer mr-7.5' />
                    <HeaderSearch />
                    <div className='text-text flex gap-7'>
                        <div className='flex text-text cursor-pointer items-center'>
                            <RiHeartLine size={20} className='fill-text text-text' />
                        </div>
                        <div className='flex text-text cursor-pointer items-center'>
                            <RiRepeat2Line size={20} className='fill-text text-text' />
                        </div>
                        <div className='flex text-text cursor-pointer items-center'>
                            <RiMessage2Line size={20} className='fill-text text-text' />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="flex gap-3 items-center text-left"
                            aria-label="Open cart"
                        >
                            <div className="relative flex items-center">
                                <RiShoppingBag3Line size={20} />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-info font-semibold rounded-full text-text text-xs text-center flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </div>
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
}

export default MainNav;
