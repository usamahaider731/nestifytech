import React from 'react';
import MainNav from './MainNav';
import MenuHeader from './MenuHeader';

const HeaderWrapper = ({ ContainerType, isScrolled = false }) => {
    return (
        <div className={`w-full ${isScrolled ? 'bg-white' : ''}`}>
            <MainNav ContainerType={ContainerType} isScrolled={isScrolled} />
            {/* Hide the menu/category bar in sticky mode — keeps it compact */}
            <MenuHeader ContainerType={ContainerType} isScrolled={isScrolled} />
        </div>
    );
};

export default HeaderWrapper;
