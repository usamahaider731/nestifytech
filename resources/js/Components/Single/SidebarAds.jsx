import React from 'react';
import AdsRender from '../Frontend/AdsRender';

const SidebarAds = () => {
    return (
        <div className='w-full sticky top-0 right-0 shadow'>
            <AdsRender type={'sidebar'} />
        </div>
    );
}

export default SidebarAds;
