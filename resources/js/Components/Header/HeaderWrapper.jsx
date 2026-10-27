import React from 'react';
import MainNav from './MainNav';
import MenuHeader from './MenuHeader';

const HeaderWrapper = ({ ContainerType, isScrolled = false, onOpenSidebar }) => {
    return (
        <div className={`w-full ${isScrolled ? 'bg-white' : ''}`}>
            <MainNav ContainerType={ContainerType} isScrolled={isScrolled} onOpenSidebar={onOpenSidebar} />
            <MenuHeader ContainerType={ContainerType} isScrolled={isScrolled} />
        </div>
    );
};

export default HeaderWrapper;
