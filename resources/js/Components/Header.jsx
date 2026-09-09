import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';
import { RiTruckFill, RiTruckLine } from 'react-icons/ri';
import { TbTruckDelivery } from 'react-icons/tb';
import TopHeader from './Header/TopHeader';
import HeaderWrapper from './Header/HeaderWrapper';

const Header = ({ title }) => {
    const { setting } = usePage().props
    const siteName = setting?.site?.name?.value || 'NestifyTech';
    const headerSetting = setting.layout.Header;
    const ContainerType = headerSetting.header_container;
    return (

        <header className='w-full h-fit'>
            <Head title={title ? title + " - " + siteName : siteName} />
            {headerSetting.top_header_toggle &&
                <TopHeader ContainerType={ContainerType} show_language={headerSetting.top_header_language_toggle} />
            }
            <HeaderWrapper ContainerType={ContainerType} />
        </header>
    );
}

export default Header;