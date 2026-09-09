import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RiAddLine, RiSubtractLine, RiImageAddLine, RiPriceTagLine, RiStackLine, RiHashtag, RiLoader4Line, RiPaletteLine, RiMenuAddLine } from 'react-icons/ri';
import axios from 'axios';

const parseIfString = (val) => {
    if (!Array.isArray(val) && typeof val === 'string') {
        try { val = JSON.parse(val); } catch (_) { val = []; }
    }
    // Handle double-encoded: parsed value is still a string
    if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch (_) { val = []; }
    }
    return Array.isArray(val) ? val : [];
};

const migrateValue = (val) => {
    if (!Array.isArray(val)) return [];
    return val.map(v => {
        // Always ensure combinations and shared_attributes are arrays
        const combinations = parseIfString(v.combinations);
        const shared_attributes = parseIfString(v.shared_attributes);

        if (combinations.length > 0) {
            return { ...v, combinations, shared_attributes };
        }

        if (v.sizes) {
            return {
                ...v,
                shared_attributes,
                combinations: v.sizes.map(s => ({
                    id: s.id || Date.now() + Math.random(),
                    price: s.price || '',
                    stock: s.stock || '',
                    attributes: [{ id: Date.now() + Math.random(), key: 'Size', value: s.size || '' }]
                }))
            };
        }

        return {
            ...v,
            shared_attributes,
            combinations: [{
                id: Date.now() + Math.random(),
                price: v.price || '',
                stock: v.stock || '',
                attributes: v.size?.length > 0
                    ? v.size.map(s => ({ id: Date.now() + Math.random(), key: s.key, value: s.value }))
                    : [{ id: Date.now() + Math.random(), key: '', value: '' }]
            }]
        };
    });
};

const VariationsSelector = ({ value = [], onChange = () => { } }) => {
    const [variations, setVariations] = useState(migrateValue(value));
    const [uploadState, setUploadState] = useState({});
    const userEdited = useRef(false);
    const prevValueRef = useRef(null);

    useEffect(() => {
        if (!Array.isArray(value) || value.length === 0) return;
        const serialized = JSON.stringify(value);
        const isFirstLoad = !userEdited.current;
        const isServerRefresh = prevValueRef.current !== null && prevValueRef.current !== serialized;
        if (isFirstLoad || isServerRefresh) {
            setVariations(migrateValue(value));
            if (isServerRefresh) {
                userEdited.current = false;
            }
        }
        prevValueRef.current = serialized;
    }, [value]);

    const resolveImageUrl = (image) => {
        if (!image) return null;
        if (typeof image === 'string' && image.startsWith('blob:')) return image;
        if (typeof image === 'string' && image.startsWith('http')) return image;
        if (typeof image === 'string') return `/storage/uploads/image/${image}`;
        return null;
    };

    const addVariation = () => {
        const newVariation = {
            id: Date.now(),
            color: '',
            image: null,
            imagePreview: null,
            shared_attributes: [],
            combinations: [{
                id: Date.now() + Math.random(),
                price: '',
                stock: '',
                attributes: [{ id: Date.now() + Math.random(), key: '', value: '' }]
            }],
        };
        const updated = [...variations, newVariation];
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const removeVariation = (id) => {
        const updated = variations.filter(v => v.id !== id);
        const removed = variations.find(v => v.id === id);
        if (removed?.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(removed.imagePreview);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const updateVariation = (id, field, val) => {
        const updated = variations.map(v => v.id === id ? { ...v, [field]: val } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const handleImageClick = (vId) => {
        document.getElementById(`image-input-${vId}`)?.click();
    };

    const handleImageChange = useCallback(async (vId, file) => {
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        setVariations(prev => {
            const updated = prev.map(v =>
                v.id === vId ? { ...v, imagePreview: previewUrl, image: null } : v
            );
            onChange(updated);
            return updated;
        });

        setUploadState(prev => ({ ...prev, [vId]: 'uploading' }));

        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await axios.post('/admin/upload-image-temp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const filename = response.data?.filename;
            if (!filename) throw new Error('No filename in response');
            setVariations(prev => {
                const updated = prev.map(v =>
                    v.id === vId ? { ...v, image: filename, imagePreview: null } : v
                );
                onChange(updated);
                return updated;
            });

            setUploadState(prev => ({ ...prev, [vId]: 'idle' }));
        } catch (err) {
            console.error('Variation image upload failed:', err);
            setVariations(prev => {
                const updated = prev.map(v =>
                    v.id === vId ? { ...v, image: null, imagePreview: null } : v
                );
                onChange(updated);
                return updated;
            });
            URL.revokeObjectURL(previewUrl);
            setUploadState(prev => ({ ...prev, [vId]: 'error' }));
        }
    }, [onChange]);

    const addCombination = (vId) => {
        

        const updated = variations.map(v => v.id === vId ? {

            ...v,

            combinations: [...parseIfString(v.combinations), {
                id: Date.now() + Math.random(),
                price: '',
                stock: '',
                attributes: [{ id: Date.now() + Math.random(), key: '', value: '' }]
            }]
        } : v);
        userEdited.current = true;
 
        setVariations(updated);
        onChange(updated);
    };

    const removeCombination = (vId, comboId) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            combinations: (v.combinations || []).filter(c => c.id !== comboId)
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const updateCombination = (vId, comboId, field, val) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            combinations: (v.combinations || []).map(c => c.id === comboId ? { ...c, [field]: val } : c)
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const addAttribute = (vId, comboId) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            combinations: (v.combinations || []).map(c => c.id === comboId ? {
                ...c,
                attributes: [...(c.attributes || []), { id: Date.now() + Math.random(), key: '', value: '' }]
            } : c)
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const removeAttribute = (vId, comboId, attrId) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            combinations: (v.combinations || []).map(c => c.id === comboId ? {
                ...c,
                attributes: (c.attributes || []).filter(a => a.id !== attrId)
            } : c)
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const updateAttribute = (vId, comboId, attrId, field, val) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            combinations: (v.combinations || []).map(c => c.id === comboId ? {
                ...c,
                attributes: (c.attributes || []).map(a => a.id === attrId ? { ...a, [field]: val } : a)
            } : c)
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const addSharedAttribute = (vId) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            shared_attributes: [...(v.shared_attributes || []), { id: Date.now() + Math.random(), key: '', value: '' }]
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const removeSharedAttribute = (vId, attrId) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            shared_attributes: (v.shared_attributes || []).filter(a => a.id !== attrId)
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };

    const updateSharedAttribute = (vId, attrId, field, val) => {
        const updated = variations.map(v => v.id === vId ? {
            ...v,
            shared_attributes: (v.shared_attributes || []).map(a => a.id === attrId ? { ...a, [field]: val } : a)
        } : v);
        userEdited.current = true;
        setVariations(updated);
        onChange(updated);
    };
    console.log(variations)
    return (
        <div className="space-y-6">
            {variations.map((v) => {
                const isUploading = uploadState[v.id] === 'uploading';
                const hasError = uploadState[v.id] === 'error';
                const displayUrl = v.imagePreview || resolveImageUrl(v.image);
               const combinations = parseIfString(v.combinations);
                return (
                    <div key={v.id} className="p-5 rounded-2xl border border-secondary bg-accent/40 shadow-md relative group transition-all hover:bg-accent/60">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-2xl opacity-40 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex flex-wrap gap-6">
                            <div className="w-full md:w-32 shrink-0">
                                <div
                                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-res transition-all cursor-pointer bg-black/20 group/img overflow-hidden relative
                                        ${hasError ? 'border-red-500 text-red-500' : 'border-secondary hover:border-primary hover:text-primary'}`}
                                    onClick={() => !isUploading && handleImageClick(v.id)}
                                >
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2 text-primary">
                                            <RiLoader4Line className="text-3xl animate-spin" />
                                            <span className="text-[9px] uppercase font-black opacity-70">Uploading…</span>
                                        </div>
                                    ) : displayUrl ? (
                                        <img
                                            src={displayUrl}
                                            className="w-full h-full object-cover"
                                            alt="variation"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <>
                                            <RiImageAddLine className="text-3xl group-hover/img:scale-110 transition-transform mb-1" />
                                            <span className="text-[10px] uppercase font-black opacity-60">
                                                {hasError ? 'Upload Failed' : 'Variation Photo'}
                                            </span>
                                        </>
                                    )}

                                    {displayUrl && !isUploading && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <RiImageAddLine className="text-white text-2xl" />
                                        </div>
                                    )}
                                </div>

                                {hasError && (
                                    <p className="text-[9px] text-red-400 text-center mt-1 font-semibold">Tap to retry</p>
                                )}
                            </div>

                            <input
                                type="file"
                                id={`image-input-${v.id}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageChange(v.id, e.target.files[0])}
                            />

                            <div className="flex-1 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase font-black text-res opacity-80 flex items-center gap-1.5 ml-1">
                                            <RiPaletteLine className="text-primary" /> Color
                                        </label>
                                        <div className="flex items-center gap-2 w-full border border-secondary rounded-lg px-2 py-1.5 text-sm transition-all bg-permanent focus-within:ring-2 focus-within:ring-primary/20">
                                            <label className="relative cursor-pointer shrink-0 ml-1">
                                                <span
                                                    className="block size-6 rounded-full border-2 border-secondary shadow-sm"
                                                    style={{ backgroundColor: /^#[0-9a-fA-F]{3,6}$/.test(v.color) ? v.color : '#transparent' }}
                                                />
                                                <input
                                                    type="color"
                                                    value={/^#[0-9a-fA-F]{3,6}$/.test(v.color) ? v.color : '#000000'}
                                                    onChange={(e) => updateVariation(v.id, 'color', e.target.value)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                />
                                            </label>
                                            <input
                                                type="text"
                                                value={v.color || ''}
                                                placeholder="#hex or name"
                                                onChange={(e) => updateVariation(v.id, 'color', e.target.value)}
                                                className="w-full bg-transparent border-none px-2 py-1 text-heading text-sm outline-none focus:ring-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Shared Attributes */}
                                <div className="space-y-3 bg-black/5 p-4 rounded-xl border border-white/5">
                                    <label className="text-[11px] uppercase font-black text-primary flex items-center gap-1.5 ml-1">
                                        <RiHashtag /> Shared Attributes (All Combinations)
                                    </label>
                                    {typeof v.shared_attributes == "object" && v.shared_attributes.length > 0 && (v.shared_attributes || []).map((attr) => (
                                        <div key={attr.id} className="flex items-center gap-2 group/sattr">
                                            <input
                                                type="text"
                                                placeholder="Key (e.g. RAM)"
                                                value={attr.key}
                                                onChange={(e) => updateSharedAttribute(v.id, attr.id, 'key', e.target.value)}
                                                className="flex-1 bg-transparent border-b border-secondary px-2 py-1.5 text-xs text-heading placeholder:opacity-30 focus:border-primary transition-all outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Value (e.g. 16GB)"
                                                value={attr.value}
                                                onChange={(e) => updateSharedAttribute(v.id, attr.id, 'value', e.target.value)}
                                                className="flex-1 bg-transparent border-b border-secondary px-2 py-1.5 text-xs text-heading placeholder:opacity-30 focus:border-primary transition-all outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSharedAttribute(v.id, attr.id)}
                                                className="p-1.5 rounded-md hover:bg-red-500/10 text-res hover:text-red-500 opacity-20 group-hover/sattr:opacity-100 transition-all translate-y-1"
                                            >
                                                <RiSubtractLine />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addSharedAttribute(v.id)}
                                        className="mt-2 w-fit text-[10px] uppercase font-black text-primary hover:text-primary-light flex items-center gap-1.5 transition-colors px-2 py-1 bg-primary/5 rounded border border-primary/20"
                                    >
                                        <RiAddLine /> Add Shared Attribute
                                    </button>
                                </div>

                                {/* Combinations Repeater */}
                                <div className="space-y-4">
                                    {(combinations || []).map((combo, idx) => (
                                        <div key={combo.id} className="bg-black/5 p-4 rounded-xl border border-white/5 relative group/combo">
                                            <div className="flex flex-wrap flex-col-reverse md:flex-nowrap gap-4 items-start">

                                                <div className="flex-1 space-y-3 min-w-[200px]">
                                                    <label className="text-[11px] uppercase font-black text-primary flex items-center gap-1.5 ml-1">
                                                        <RiHashtag /> Attributes (Combo {idx + 1})
                                                    </label>

                                                    {(combo.attributes || []).map((attr) => (
                                                        <div key={attr.id} className="flex items-center gap-2 group/attr">
                                                            <input
                                                                type="text"
                                                                placeholder="Key (e.g. RAM)"
                                                                value={attr.key}
                                                                onChange={(e) => updateAttribute(v.id, combo.id, attr.id, 'key', e.target.value)}
                                                                className="flex-1 bg-transparent border-b border-secondary px-2 py-1.5 text-xs text-heading placeholder:opacity-30 focus:border-primary transition-all outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Value (e.g. 16GB)"
                                                                value={attr.value}
                                                                onChange={(e) => updateAttribute(v.id, combo.id, attr.id, 'value', e.target.value)}
                                                                className="flex-1 bg-transparent border-b border-secondary px-2 py-1.5 text-xs text-heading placeholder:opacity-30 focus:border-primary transition-all outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttribute(v.id, combo.id, attr.id)}
                                                                className="p-1.5 rounded-md hover:bg-red-500/10 text-res hover:text-red-500 opacity-20 group-hover/attr:opacity-100 transition-all translate-y-1"
                                                            >
                                                                <RiSubtractLine />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addAttribute(v.id, combo.id)}
                                                        className="mt-2 w-fit text-[10px] uppercase font-black text-primary hover:text-primary-light flex items-center gap-1.5 transition-colors px-2 py-1 bg-primary/5 rounded border border-primary/20"
                                                    >
                                                        <RiAddLine /> Add Attribute
                                                    </button>
                                                </div>

                                                <div className="w-full md:w-auto flex gap-4 border-t border-white/5 md:border-none pt-4 md:pt-0">
                                                    <div className="space-y-1.5 flex-1">
                                                        <label className="text-[10px] uppercase font-black text-res opacity-80 flex items-center gap-1.5 ml-1">
                                                            <RiPriceTagLine className="text-primary" /> Price Mod
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={combo.price}
                                                            placeholder="0.00"
                                                            onChange={(e) => updateCombination(v.id, combo.id, 'price', e.target.value)}
                                                            className="w-full min-w-[80px] bg-transparent border-b border-secondary px-2 py-1 text-sm text-heading focus:border-primary transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 flex-1">
                                                        <label className="text-[10px] uppercase font-black text-res opacity-80 flex items-center gap-1.5 ml-1">
                                                            <RiStackLine className="text-primary" /> Stock
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={combo.stock}
                                                            placeholder="0"
                                                            onChange={(e) => updateCombination(v.id, combo.id, 'stock', e.target.value)}
                                                            className="w-full min-w-[80px] bg-transparent border-b border-secondary px-2 py-1 text-sm text-heading focus:border-primary transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Delete Combo button inside the combo box */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeCombination(v.id, combo.id)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/combo:opacity-100"
                                                    title="Remove Combination"
                                                >
                                                    <RiSubtractLine className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => addCombination(v.id)}
                                        className="text-[11px] uppercase font-black text-primary hover:text-primary-light flex items-center gap-1.5 transition-colors px-3 py-2 bg-primary/10 rounded-lg border border-primary/20 w-fit"
                                    >
                                        <RiMenuAddLine /> Add Combination
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
                );
            })}

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