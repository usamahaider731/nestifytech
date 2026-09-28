import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import ImageViwer from '../Admin/ImageViwer';
const AdsRender = ({ type = 'sidebar', placement = 'product_sidebar', className='' }) => {
    const { setting } = usePage().props;
    const ads = setting?.ads?.items.value ?? [];
    const [Ads, setAds] = useState([]);
    useEffect(()=>{
    setAds(ads.find((ad) => ad.placement === placement));
    }, [])

    return (
        <Link href={Ads.link} target='_blank' className={className}>
            {
                Ads?.ad_type == "image" && <ImageViwer image={Ads.image} className="w-full h-full object-cover" alt={Ads.link}  />
            }
        </Link>
    );
}

export default AdsRender;
