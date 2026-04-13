import React, { useState } from 'react';
import { RiAddLine, RiSubtractLine, RiImageAddLine, RiPriceTagLine, RiStackLine, RiHashtag } from 'react-icons/ri';

/**
 * VariationsSelector
 * Handles product variations. Each variation has Price, Stock, Image, 
 * and a dynamic set of attributes (Key/Value pairs like Size, Color).
 */
const VariationsSelector = ({ value = [], onChange = () => {} }) => {
    const [variations, setVariations] = useState(Array.isArray(value) ? value : []);

    const addVariation = () => {
        const newVariation = {
            id: Date.now(),
            price: '',
            stock: '',
            image: null,
            size: [{ key: '', value: '' }] // The dynamic attributes loop
        };
        const updated = [...variations, newVariation];
        setVariations(updated);
        onChange(updated);
    };

    const removeVariation = (id) => {
        const updated = variations.filter(v => v.id !== id);
        setVariations(updated);
        onChange(updated);
    };

    const updateVariation = (id, field, val) => {
        const updated = variations.map(v => v.id === id ? { ...v, [field]: val } : v);
        setVariations(updated);
        onChange(updated);
    };

    const addAttribute = (vId) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            size: [...(v.size || []), { key: '', value: '' }]
        } : v);
        setVariations(updated);
        onChange(updated);
    };

    const removeAttribute = (vId, attrIdx) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            size: (v.size || []).filter((_, i) => i !== attrIdx)
        } : v);
        setVariations(updated);
        onChange(updated);
    };

    const updateAttribute = (vId, attrIdx, field, val) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            size: (v.size || []).map((a, i) => i === attrIdx ? { ...a, [field]: val } : a)
        } : v);
        setVariations(updated);
        onChange(updated);
    };

    return (
        <div className="space-y-6">
            {variations.map((v) => (
                <div key={v.id} className="p-5 rounded-2xl border border-secondary bg-accent/40 shadow-md relative group transition-all hover:bg-accent/60">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-2xl opacity-40 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-wrap gap-6">
                        {/* 1. Image Upload Section */}
                        <div className="w-full md:w-32 shrink-0">
                           <div className="aspect-square rounded-xl border-2 border-dashed border-secondary flex flex-col items-center justify-center text-res hover:border-primary hover:text-primary transition-all cursor-pointer bg-black/20 group/img overflow-hidden">
                                {v.image ? (
                                    <img src={v.image.startsWith('http') ? v.image : '/storage/uploads/image/' + v.image} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <RiImageAddLine className="text-3xl group-hover/img:scale-110 transition-transform mb-1" />
                                        <span className="text-[10px] uppercase font-black opacity-60">Variation Photo</span>
                                    </>
                                )}
                           </div>
                        </div>

                        {/* 2. Core Details & Attributes Repeater */}
                        <div className="flex-1 space-y-5">
                            {/* Price and Stock row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] uppercase font-black text-res opacity-80 flex items-center gap-1.5 ml-1">
                                        <RiPriceTagLine className="text-primary" /> Price Modifier
                                    </label>
                                    <input 
                                        type="number" 
                                        value={v.price}
                                        placeholder="0.00"
                                        onChange={(e) => updateVariation(v.id, 'price', e.target.value)}
                                        className="w-full bg-permanent border border-secondary rounded-lg px-4 py-2.5 text-sm text-heading focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] uppercase font-black text-res opacity-80 flex items-center gap-1.5 ml-1">
                                        <RiStackLine className="text-primary" /> Stock Inventory
                                    </label>
                                    <input 
                                        type="number" 
                                        value={v.stock}
                                        placeholder="0"
                                        onChange={(e) => updateVariation(v.id, 'stock', e.target.value)}
                                        className="w-full bg-permanent border border-secondary rounded-lg px-4 py-2.5 text-sm text-heading focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Attributes Repeater (Dynamic loop for Size, Color, etc.) */}
                            <div className="space-y-3 bg-black/10 p-4 rounded-xl border border-white/5">
                                <label className="text-[11px] uppercase font-black text-primary flex items-center gap-1.5 ml-1 mb-2">
                                    <RiHashtag /> Specification Attributes
                                </label>
                                
                                {(v.size || []).map((attr, aIdx) => (
                                    <div key={aIdx} className="flex items-center gap-2 group/attr">
                                        <input 
                                            type="text" 
                                            placeholder="Key (e.g. Size)"
                                            value={attr.key}
                                            onChange={(e) => updateAttribute(v.id, aIdx, 'key', e.target.value)}
                                            className="flex-1 bg-transparent border-b border-secondary px-2 py-1.5 text-xs text-heading placeholder:opacity-30 focus:border-primary transition-all outline-none"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Value (e.g. XXL)"
                                            value={attr.value}
                                            onChange={(e) => updateAttribute(v.id, aIdx, 'value', e.target.value)}
                                            className="flex-1 bg-transparent border-b border-secondary px-2 py-1.5 text-xs text-heading placeholder:opacity-30 focus:border-primary transition-all outline-none"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => removeAttribute(v.id, aIdx)}
                                            className="p-1.5 rounded-md hover:bg-red-500/10 text-res hover:text-red-500 opacity-20 group-hover/attr:opacity-100 transition-all translate-y-1"
                                        >
                                            <RiSubtractLine />
                                        </button>
                                    </div>
                                ))}

                                <button 
                                    type="button"
                                    onClick={() => addAttribute(v.id)}
                                    className="mt-2 text-[10px] uppercase font-black text-primary hover:text-primary-light flex items-center gap-1.5 transition-colors px-2 py-1 bg-primary/5 rounded border border-primary/20"
                                >
                                    <RiAddLine /> Add Attribute Row
                                </button>
                            </div>
                        </div>

                        {/* 3. Global Actions */}
                        <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 w-full md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                            <button
                                type="button"
                                onClick={() => removeVariation(v.id)}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 w-fit hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                            >
                                <RiSubtractLine className="text-base" />
                                <span className="md:hidden lg:inline">Delete Variation</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Global Add Variation Button */}
            <button
                type="button"
                onClick={addVariation}
                className="w-full py-5 rounded-2xl border-2 border-dashed border-secondary text-res hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
            >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    <RiAddLine className="text-2xl group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="font-black text-lg tracking-wider uppercase">Create Product Variation</span>
            </button>
        </div>
    );
};

export default VariationsSelector;
