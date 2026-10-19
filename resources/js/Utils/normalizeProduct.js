import { calculateAdjustedPrice } from './helper';

/**
 * Normalize API product payloads for cart and display helpers.
 */
export function normalizeProduct(product, currency = 'PKR') {
    if (!product) {
        return null;
    }

    if (product.price !== undefined && !product.meta) {
        return product;
    }

    const firstPrice = Number(product.meta?.first_price?.value ?? 0);
    const secondPrice = Number(product.meta?.second_price?.value ?? firstPrice);

    // Calculate price adjusted by category tax and category discount
    const pricing = calculateAdjustedPrice({
        basePrice: (firstPrice > secondPrice && secondPrice > 0) ? secondPrice : (firstPrice || product.price || 0),
        regularPrice: firstPrice || secondPrice || 0,
        category: product.category,
    });

    const finalPrice = pricing.finalPrice;
    const hasDiscount = pricing.totalSavings > 0 || (firstPrice > finalPrice && finalPrice > 0);

    return {
        id: product.id,
        sku: product.sku,
        title: product.title,
        image: product.image,
        price: finalPrice,
        originalPrice: hasDiscount ? (pricing.rawRegular || firstPrice) : null,
        pricingBreakdown: pricing,
        rating: Number(product.meta?.rating?.value ?? 4.5),
        reviewCount: Number(product.meta?.review_count?.value ?? 0),
        currency,
        href:
            product.sku && product.id
                ? route('singleproduct', { sku: product.sku, id: product.id })
                : undefined,
        _raw: product,
    };
}

export function normalizeProducts(products = [], currency = 'PKR') {
    return products.map((product) => normalizeProduct(product, currency)).filter(Boolean);
}
