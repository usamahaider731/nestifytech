import { Link, usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';
import ImageViwer from '../Admin/ImageViwer';
import { RiHeartLine, RiMenuLine, RiMessage2Line, RiRepeat2Line, RiShoppingBag3Line } from 'react-icons/ri';
import HeaderSearch from './HeaderSearch';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { useSelector } from 'react-redux';
import { selectCartCount, selectCartTotal } from '@/store/cartSlice';

const MainNav = ({ ContainerType }) => {
    const { setting } = usePage().props;
    const { setIsOpen } = useCart();
    const { __ } = useLang();
    
    // Get item count and subtotal from Redux instead of old Context
    const itemCount = useSelector(selectCartCount);
    const subtotal = useSelector(selectCartTotal);

    const currency = setting?.site?.currency?.value ?? 'PKR';
    const is_index = location.href === "http://nestifytech.localhost/" || location.href === "http://nestifytech.localhost";

    const getLogoName = (logo_name) => {
        if (logo_name === "logo_light") {
            return "light_logo";
        } else if (logo_name === "logo_dark") {
            return "dark_logo";
        }
        return logo_name;
    };
    
    let home_header_logo = setting?.layout?.Header?.home_header_logo;
    let other_header_logo = setting?.layout?.Header?.other_page_header_logo;
    let logo_path = "";
    
    if (is_index && home_header_logo) {
        home_header_logo = getLogoName(home_header_logo);
        console.log(home_header_logo);
        logo_path = setting?.site?.[home_header_logo].value || "";
    }
    else{
        other_header_logo =getLogoName(other_header_logo)
        logo_path = setting?.site?.[other_header_logo].value || "";
    }

    return (
        <div className='w-full border-b border-border bg-white'>
            <div className={` ${ContainerType === "container" ? "container mx-auto" : ""}  px-5 relative`}>
                <div className='flex flex-1 items-center gap-5 py-5 lg:gap-10 lg:py-7'>
                    <div className="logo">
                        <Link href="/">
                            <ImageViwer className="w-40" image={logo_path} alt={setting?.site_name} />
                        </Link>
                    </div>
                    <RiMenuLine size={21} className='mr-1 cursor-pointer text-text transition-colors hover:text-primary lg:mr-4' />
                    <HeaderSearch />
                    <div className='flex gap-4 text-text lg:gap-6'>
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
