import { calculateAdjustedPrice, resolveProductPrices, parseNumericPrice } from './helper';

/**
 * Normalize API product payloads for cart and display helpers.
 * Pass optional pricingContext: { user, pricingRules, couponCode }
 */
export function normalizeProduct(product, currency = 'PKR', pricingContext = {}) {
    if (!product) {
        return null;
    }

    if (product.price !== undefined && !product.meta) {
        return product;
    }

    const { firstPrice, basePrice, regularPrice } = resolveProductPrices(product);
    const user = pricingContext.user ?? null;
    const userDiscount = parseNumericPrice(user?.discount || user?.meta?.discount || pricingContext.userDiscount || 0);

    const pricing = calculateAdjustedPrice({
        basePrice,
        regularPrice,
        category: product.category,
        brand: product.brand,
        collection: product.collection ?? product.meta?.collection,
        userDiscount,
        userDiscountType: 'percentage',
        product,
        user,
        pricingRules: pricingContext.pricingRules ?? [],
        couponCode: pricingContext.couponCode ?? null,
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
