import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import wishlistReducer from './wishListSlice';
import compareReducer from './compareSlice';

const store = configureStore({
    reducer: {
        cart: cartReducer,
        wishlist: wishlistReducer,
        compare: compareReducer,
    },
});

export default store;
