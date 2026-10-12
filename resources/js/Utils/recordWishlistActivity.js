export function recordWishlistActivity(action, productId = null, count = null) {
    if (!window.axios) return;

    window.axios.post(route('profile.wishlist.activity'), {
        action,
        product_id: productId,
        count,
    }).catch(() => {});
}