import React, { useState } from 'react';
import { RiAddLine, RiSubtractLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

const QuantitySelector = ({ maxStock = 0, onChange, selectedStock = 1, minStock = 1 }) => {
    const [qty, setQty] = useState(selectedStock);
    const { __ } = useLang();

    const update = (next) => {
        const clamped = Math.min(Math.max(minStock, next), maxStock);
        setQty(clamped);
        if (onChange) onChange(clamped);
    };

    if (maxStock <= 0) {
        return (
            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded">
                {__('Out of stock')}
            </span>
        );
    }

    return (
        <div className="flex items-center gap-1 h-10 border border-border rounded overflow-hidden select-none">
            <button
                type="button"
                onClick={() => update(qty - 1)}
                disabled={qty <= minStock}
                className="px-2.5 h-full text-dynamic hover:bg-bg hover:text-primary disabled:opacity-30 transition-colors"
            >
                <RiSubtractLine className="size-3.5" />
            </button>

            <span className="w-8 h-full flex items-center justify-center text-sm font-semibold text-heading tabular-nums">
                {qty}
            </span>

            <button
                type="button"
                onClick={() => update(qty + 1)}
                disabled={qty >= maxStock}
                className="px-2.5 h-full text-dynamic hover:bg-bg hover:text-primary disabled:opacity-30 transition-colors"
            >
                <RiAddLine className="size-3.5" />
            </button>
        </div>
    );
};

export default QuantitySelector;
