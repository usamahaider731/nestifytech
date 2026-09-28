import React from 'react';
import AdsRender from '../Frontend/AdsRender';

const BottomAds = () => {
    return (
        <div className='w-full'>
            <AdsRender type={'main'} placement='product_bottom' className='w-full h-auto object-cover' />
        </div>
    );
}

export default BottomAds;
