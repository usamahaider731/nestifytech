import React from 'react';
import MainNav from './MainNav';
import MenuHeader from './MenuHeader';

const HeaderWrapper = ({ ContainerType }) => {
    return (
        <div className='w-full'>
            <MainNav ContainerType={ContainerType} />
            <MenuHeader ContainerType={ContainerType} />
        </div>
    );
}

export default HeaderWrapper;
