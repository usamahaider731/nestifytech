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
    const hasDiscount = firstPrice > secondPrice;

    return {
        id: product.id,
        sku: product.sku,
        title: product.title,
        image: product.image,
        price: hasDiscount ? secondPrice : firstPrice,
        originalPrice: hasDiscount ? firstPrice : null,
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
