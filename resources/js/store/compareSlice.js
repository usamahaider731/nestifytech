import { createSlice } from '@reduxjs/toolkit';

const loadFromLocalStorage = () => {
    try {
        const serializedState = localStorage.getItem('compareItems');
        if (serializedState === null) {
            return [];
        }
        return JSON.parse(serializedState);
    } catch (e) {
        console.warn("Could not load compare items", e);
        return [];
    }
};

const saveToLocalStorage = (items) => {
    try {
        localStorage.setItem('compareItems', JSON.stringify(items));
    } catch (e) {
        console.warn("Could not save compare items", e);
    }
};

const compareSlice = createSlice({
    name: 'compare',
    initialState: {
        items: loadFromLocalStorage(),
        isOpen: false,
    },
    reducers: {
        toggleCompare(state, { payload }) {
            state.isOpen = payload ?? !state.isOpen;
        },
        addToCompare(state, { payload }) {
            const existing = state.items.find(i => i.productId === payload.productId);
            if (!existing) {
                // limit compare to max 4 items
                if (state.items.length >= 4) {
                    state.items.shift(); // remove oldest
                }
                state.items.push({ ...payload });
                saveToLocalStorage(state.items);
            }
        },
        removeFromCompare(state, { payload: productId }) {
            state.items = state.items.filter(i => i.productId !== productId);
            saveToLocalStorage(state.items);
        },
        clearCompare(state) {
            state.items = [];
            saveToLocalStorage(state.items);
        },
    },
});

export const { addToCompare, removeFromCompare, clearCompare, toggleCompare } = compareSlice.actions;

export const selectCompareItems = state => state.compare.items;
export const selectCompareCount = state => state.compare.items.length;
export const selectIsInCompare = (productId) => state => state.compare.items.some(i => i.productId === productId);
export const selectIsCompareOpen = state => state.compare.isOpen;

export default compareSlice.reducer;
