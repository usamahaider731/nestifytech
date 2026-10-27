import { Head, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import TopHeader from './Header/TopHeader';
import HeaderWrapper from './Header/HeaderWrapper';
import MobileSidebar from './Header/MobileSidebar';

const Header = ({ title }) => {
    const { setting } = usePage().props;
    const siteName = setting?.site?.name?.value || 'NestifyTech';
    const headerSetting = setting.layout.Header;
    const ContainerType = headerSetting.header_container;

    const [isScrolled, setIsScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            if (headerSetting.sticky_header_toggle) {
            
                setIsScrolled((prev) => {
                    if (!prev && y >= 160) return true;
                    if (prev && y <= 90) return false;
                    return prev;
                });
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <Head title={title ? title + ' - ' + siteName : siteName} />

            {/* Mobile Drawer Sidebar */}
            <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* ── Static header (in document flow, scrolls naturally with page) ── */}
            <header className="w-full">
                {headerSetting.top_header_toggle && (
                    <TopHeader
                        ContainerType={ContainerType}
                        show_language={headerSetting.top_header_language_toggle}
                    />
                )}

                {/* Main nav + menu bar — static */}
                <HeaderWrapper
                    ContainerType={ContainerType}
                    isScrolled={false}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                />
            </header>

            {/* ── Sticky compact header — slides in from top when scrolled ── */}
            <header
                className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out ${
                    isScrolled
                        ? 'translate-y-0 opacity-100 shadow-lg'
                        : '-translate-y-full opacity-0 pointer-events-none'
                }`}
            >
                <HeaderWrapper
                    ContainerType={ContainerType}
                    isScrolled={true}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                />
            </header>
        </>
    );
};

export default Header;