import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const addItem = useCallback((product, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item,
                );
            }
            return [...prev, { ...product, quantity }];
        });
        setIsOpen(true);
    }, []);

    const removeItem = useCallback((id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateQuantity = useCallback(
        (id, quantity) => {
            if (quantity <= 0) {
                removeItem(id);
                return;
            }
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
            );
        },
        [removeItem],
    );

    const clearCart = useCallback(() => setItems([]), []);

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [items],
    );

    const itemCount = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items],
    );

    const value = useMemo(
        () => ({
            items,
            isOpen,
            setIsOpen,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            subtotal,
            itemCount,
        }),
        [items, isOpen, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
