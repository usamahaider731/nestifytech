import { Head, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import TopHeader from './Header/TopHeader';
import HeaderWrapper from './Header/HeaderWrapper';

const Header = ({ title }) => {
    const { setting } = usePage().props;
    const siteName = setting?.site?.name?.value || 'NestifyTech';
    const headerSetting = setting.layout.Header;
    const ContainerType = headerSetting.header_container;

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY >= 81.01);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <Head title={title ? title + ' - ' + siteName : siteName} />

            {/* ── Static header (in document flow, scrolls with page) ── */}
            <header className="w-full">
                {/* Top bar — collapses smoothly when scrolled */}
                <div
                    className={` transition-all duration-300 ease-in-out ${
                        isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
                    }`}
                >
                    {headerSetting.top_header_toggle && (
                        <TopHeader
                            ContainerType={ContainerType}
                            show_language={headerSetting.top_header_language_toggle}
                        />
                    )}
                </div>

                {/* Main nav + menu bar — static */}
                <HeaderWrapper ContainerType={ContainerType} isScrolled={false} />
            </header>

            {/* ── Sticky compact header — slides in from top when scrolled ── */}
            <header
                className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out ${
                    isScrolled
                        ? 'translate-y-0 opacity-100 shadow-lg'
                        : '-translate-y-full opacity-0 pointer-events-none'
                }`}
            >
                <HeaderWrapper ContainerType={ContainerType} isScrolled={true} />
            </header>
        </>
    );
};

export default Header;