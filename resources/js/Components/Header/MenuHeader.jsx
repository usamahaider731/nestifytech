import { Link, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

const MenuHeader = ({ ContainerType }) => {
    const { props } = usePage();
    const [Menu, SetMenu] = useState([]);
    const menuLocation = props.setting.layout.Header.header_menu;
    useEffect(() => {
        axios.get(route("menu", { location: menuLocation })).then((response) => {
            SetMenu(response.data);
        });
    }, [menuLocation]);
    return (
        <div className='bg-primary w-full'>
            <div className={` ${ContainerType === "container" ? "container mx-auto" : "w-full"}  px-5 flex`}>
                {
                    Menu.map((item, index) => (
                        <Link href={`${item?.slug ? item?.slug : '#'}`} key={index} className='text-[15px] p-[13.5px_20px] font-semibold uppercase text-text'>
                            {item.name}
                        </Link>
                    ))
                }
            </div>
        </div>
    );
}

export default MenuHeader;
