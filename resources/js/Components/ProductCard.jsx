import React from 'react';
import { usePage } from '@inertiajs/react';
import ProductCardV1 from './ProductCardV1';
import ProductCardV2 from './ProductCardV2';

/**
 * Renders the product card variant selected in Home layout settings.
 */
export default function ProductCard(props) {
    const { setting } = usePage().props;
    const cardType = setting?.layout?.Home?.product_card_type ?? 'v1';

    if (cardType === 'v2') {
        return <ProductCardV2 {...props} />;
    }

    return <ProductCardV1 {...props} />;
}
