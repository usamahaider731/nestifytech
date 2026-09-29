import { createSlice } from '@reduxjs/toolkit';

const loadFromLocalStorage = () => {
    try {
        const serializedState = localStorage.getItem('wishlistItems');
        if (serializedState === null) {
            return [];
        }
        return JSON.parse(serializedState);
    } catch (e) {
        console.warn("Could not load wishlist items", e);
        return [];
    }
};

const saveToLocalStorage = (items) => {
    try {
        localStorage.setItem('wishlistItems', JSON.stringify(items));
    } catch (e) {
        console.warn("Could not save wishlist items", e);
    }
};

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: loadFromLocalStorage(),
        isOpen: false,
    },
    reducers: {
        toggleWishlist(state, { payload }) {
            state.isOpen = payload ?? !state.isOpen;
        },
        addToWishlist(state, { payload }) {
            const existing = state.items.find(i => i.productId === payload.productId);
            if (!existing) {
                state.items.push({ ...payload });
                saveToLocalStorage(state.items);
            }
        },
        removeFromWishlist(state, { payload: productId }) {
            state.items = state.items.filter(i => i.productId !== productId);
            saveToLocalStorage(state.items);
        },
        clearWishlist(state) {
            state.items = [];
            saveToLocalStorage(state.items);
        },
    },
});

export const { addToWishlist, removeFromWishlist, clearWishlist, toggleWishlist } = wishlistSlice.actions;

export const selectWishlistItems = state => state.wishlist.items;
export const selectWishlistCount = state => state.wishlist.items.length;
export const selectIsInWishlist = (productId) => state => state.wishlist.items.some(i => i.productId === productId);
export const selectIsWishlistOpen = state => state.wishlist.isOpen;

export default wishlistSlice.reducer;
