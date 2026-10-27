import { Link, usePage } from '@inertiajs/react';
import React from 'react';

const MenuHeader = ({ ContainerType, isScrolled =false }) => {
    const { props } = usePage();
    const menuLocation = props.setting.layout.Header.header_menu;
    const Menu = (props.setting.menu || []).filter((item) => !menuLocation || item.location === menuLocation);
    return (
        <div className={`w-full font-poppins hidden md:flex shadow-sm ${isScrolled ? 'bg-white' : 'bg-primary'}`}>
            <div className={` ${ContainerType === "container" ? "container mx-auto" : "w-full"}  px-5 flex`}>
                {
                    Menu.map((item, index) => (
                        <Link href={`${item?.link ? item?.link : '#'}`} key={index} className='px-5 py-3.5 text-[14px] font-semibold font-poppins text-text transition-colors hover:bg-black/10'>
                            {item.name}
                        </Link>
                    ))
                }
            </div>
        </div>
    );
}

export default MenuHeader;