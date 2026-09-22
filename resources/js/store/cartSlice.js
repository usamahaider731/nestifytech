import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Async thunk – sends cart items to the backend.
 * On success the backend decrements post_variations.stock.
 */
export const placeOrder = createAsyncThunk(
    'cart/placeOrder',
    async (items, { rejectWithValue }) => {
        try {
            const csrf = document.cookie
                .split('; ')
                .find(r => r.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            const res = await fetch('/api/cart/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf) : '',
                },
                body: JSON.stringify({ items }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                return rejectWithValue(data.message ?? 'Order failed.');
            }
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);


/**
 * Cart slice – stores items the user selects from variation combos.
 *
 * Each cart item shape:
 * {
 *   comboId   : number,   // combo (child variation) id
 *   productId : number,
 *   colorId   : number,   // parent variation id
 *   color     : string,
 *   attributes: [],       // e.g. [{ key: 'Size', value: 'XL' }]
 *   price     : number,
 *   qty       : number,
 *   maxStock  : number,
 * }
 */
const loadFromLocalStorage = () => {
    try {
        const serializedState = localStorage.getItem('cartItems');
        if (serializedState === null) {
            return [];
        }
        return JSON.parse(serializedState);
    } catch (e) {
        console.warn("Could not load cart items", e);
        return [];
    }
};

const saveToLocalStorage = (items) => {
    try {
        localStorage.setItem('cartItems', JSON.stringify(items));
    } catch (e) {
        console.warn("Could not save cart items", e);
    }
};

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: loadFromLocalStorage(),
        ordering: false,   // true while POST is in flight
        orderError: null,
        lastOrderId: null,
    },
    reducers: {
        /** Add or increase qty of an existing combo line */
        addToCart(state, { payload }) {
            
            const existing = state.items.find(i => i.comboId === payload.comboId);
            if (existing) {

                existing.qty = Math.min(existing.qty + payload.qty, existing.maxStock);
            } else {

                state.items.push({ ...payload });
            }
            saveToLocalStorage(state.items);
        },

        /** Set exact qty for a combo (used by QuantitySelector) */
        setComboQty(state, { payload: { comboId, qty } }) {
            const item = state.items.find(i => i.comboId === comboId);
            if (item) {
                item.qty = Math.min(Math.max(1, qty), item.maxStock);
                saveToLocalStorage(state.items);
            }
        },

        /** Remove a single combo line */
        removeFromCart(state, { payload: comboId }) {
            state.items = state.items.filter(i => i.comboId !== comboId);
            saveToLocalStorage(state.items);
        },

        /** Remove all lines for a product */
        removeProduct(state, { payload: productId }) {
            state.items = state.items.filter(i => i.productId !== productId);
            saveToLocalStorage(state.items);
        },

        clearCart(state) {
            state.items = [];
            saveToLocalStorage(state.items);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(placeOrder.pending, (state) => {
                state.ordering = true;
                state.orderError = null;
            })
            .addCase(placeOrder.fulfilled, (state, { payload }) => {
                state.ordering = false;
                state.lastOrderId = payload.order_id;
                state.items = [];  // clear cart after successful order
                saveToLocalStorage(state.items);
            })
            .addCase(placeOrder.rejected, (state, { payload }) => {
                state.ordering = false;
                state.orderError = payload ?? 'Unknown error';
            });
    },
});

export const { addToCart, setComboQty, removeFromCart, removeProduct, clearCart } = cartSlice.actions;

/** Selectors */
export const selectCartItems = state => state.cart.items;
export const selectCartCount = state => state.cart.items.reduce((sum, i) => sum + i.qty, 0);
export const selectCartTotal = state => state.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
export const selectComboQty  = (comboId) => state => state.cart.items.find(i => i.comboId === comboId)?.qty ?? 0;

export default cartSlice.reducer;
