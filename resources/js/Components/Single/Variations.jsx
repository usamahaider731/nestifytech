import React, { useState, useEffect, useMemo } from 'react';
import ImageViwer from '../Admin/ImageViwer';
import { usePage } from '@inertiajs/react';
import QuantitySelector from './QuantitySelector';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import { useLang } from '@/contexts/LanguageContext';
import { calculateAdjustedPrice, parseNumericPrice } from '@/Utils/helper';
import { RiPercentLine, RiShieldCheckLine } from 'react-icons/ri';

const Variations = ({ product }) => {
    const { setting, auth } = usePage().props;
    const { __ } = useLang();
    const variations = product?.variations || [];
    
    const [selectedColor, setSelectedColor] = useState(variations.length > 0 ? variations[0] : null);
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [qty, setQty] = useState(1);
    const dispatch = useDispatch();

    const first_price = parseNumericPrice(product.meta?.first_price?.value);
    const second_price = parseNumericPrice(product.meta?.second_price?.value);

    // Reset combination and qty when color changes
    useEffect(() => {
        if (selectedColor && selectedColor.combinations?.length > 0) {
            setSelectedCombo(selectedColor.combinations[0]);
        } else {
            setSelectedCombo(null);
        }
        setQty(1);
    }, [selectedColor]);

    // Compute active base and regular price for current selection
    const activeBasePrice = useMemo(() => {
        if (variations.length > 0 && selectedCombo) {
            return parseNumericPrice(selectedCombo.price);
        }
        return (first_price > second_price && second_price > 0 ? second_price : first_price) || parseNumericPrice(product?.price);
    }, [variations, selectedCombo, first_price, second_price, product]);

    const activeRegularPrice = useMemo(() => {
        if (variations.length > 0 && selectedCombo) {
            return parseNumericPrice(selectedCombo.price);
        }
        return first_price || activeBasePrice;
    }, [variations, selectedCombo, first_price, activeBasePrice]);

    // User discount: if user has a custom discount or vip discount attached
    const userDiscountPercent = parseNumericPrice(auth?.user?.discount || 0);

    // Calculate fully adjusted price with category discount, user discount, and tax
    const priceCalculation = useMemo(() => {
        return calculateAdjustedPrice({
            basePrice: activeBasePrice,
            regularPrice: activeRegularPrice,
            category: product?.category,
            userDiscount: userDiscountPercent,
            userDiscountType: 'percentage',
        });
    }, [activeBasePrice, activeRegularPrice, product?.category, userDiscountPercent]);

    const handleAddToCart = () => {
        if (variations.length > 0 && (!selectedColor || !selectedCombo)) return;
        
        let addQty = qty;
        let maxStock = product.meta?.stock?.value || 0;
        let pId = product.id;
        let pTitle = product.title;
        let pImage = product.thumbnail || product.image || '';
        let cId = null;
        let cColor = null;
        let pAttr = [];
        let pPrice = priceCalculation.finalPrice;
        let combo_id = null;

        if (variations.length > 0) {
             if (addQty < 1 || selectedCombo.stock < 1) return;
             maxStock = selectedCombo.stock;
             pImage = selectedColor.image || pImage;
             cId = selectedColor.id;
             cColor = selectedColor.color;
             pAttr = selectedCombo.attributes ?? [];
             combo_id = selectedCombo.id;
        } else {
             const pStock = product.meta?.stock?.value ?? 100;
             if (addQty < 1 || pStock < 1) return;
             maxStock = pStock;
             combo_id = product.id; 
        }

        dispatch(
            addToCart({
                comboId: combo_id,
                productId: pId,
                title: pTitle,
                image: pImage,
                colorId: cId,
                color: cColor,
                attributes: pAttr,
                price: pPrice,
                qty: addQty,
                maxStock: maxStock,
            })
        );
    };

    const currencySymbol = setting?.site?.currency?.value ?? 'PKR';

    const priceDisplay = (
        <div className='flex flex-col gap-1.5'>
            <div className='text-lg font-semibold font-primary text-text flex items-center flex-wrap gap-3'>
                <span className='text-primary'>{__('Price:')}</span>
                <span className='text-2xl font-bold text-heading font-oswald'>
                    {currencySymbol} {priceCalculation.finalPrice.toLocaleString()}
                </span>
                {(priceCalculation.totalSavings > 0 || (priceCalculation.hasSalePrice && activeRegularPrice > priceCalculation.finalPrice)) && (
                    <span className="text-sm text-slate-400 line-through font-normal">
                        {currencySymbol} {activeRegularPrice?.toLocaleString()}
                    </span>
                )}
                {priceCalculation.totalDiscountPercentage > 0 && (
                    <span className='bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1'>
                        <RiPercentLine className='size-3' />
                        {priceCalculation.totalDiscountPercentage}% {__('OFF')}
                    </span>
                )}
            </div>

            {/* Micro badges showing category tax / discount breakdown */}
            {(priceCalculation.categoryTaxPercent > 0 || priceCalculation.categoryDiscountPercent > 0 || priceCalculation.userDiscountPercent > 0) && (
                <div className='flex items-center gap-2 flex-wrap text-[11px] text-res font-medium mt-0.5'>
                    {priceCalculation.categoryDiscountPercent > 0 && (
                        <span className='bg-primary/10 text-primary px-2 py-0.5 rounded'>
                            {__('Category Discount:')} -{priceCalculation.categoryDiscountPercent}%
                        </span>
                    )}
                    {priceCalculation.userDiscountPercent > 0 && (
                        <span className='bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded'>
                            {__('User Discount:')} -{priceCalculation.userDiscountPercent}%
                        </span>
                    )}
                    {priceCalculation.categoryTaxPercent > 0 && (
                        <span className='bg-slate-100 text-slate-600 px-2 py-0.5 rounded'>
                            {__('Incl. Tax:')} +{priceCalculation.categoryTaxPercent}% ({currencySymbol} {priceCalculation.taxAmount.toLocaleString()})
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    const availableStock = variations.length > 0 
        ? (selectedCombo ? selectedCombo.stock : 0) 
        : (product.meta?.stock?.value ?? 0);

    return (
        <div className='flex flex-col gap-6 mt-6'>
            {priceDisplay}
            
            {/* Color Family */}
            {variations.length > 0 && (
                <div className='flex gap-4'>
                    <div className='w-24 text-dynamic text-sm mt-1 shrink-0'>{__('Color Family')}</div>
                    <div className='flex flex-col gap-2 flex-1'>
                        {/* <span className='text-heading text-sm font-medium'>{selectedColor?.color || 'Default'}</span> */}
                        <div className='flex gap-2 flex-wrap'>
                            {variations.map((variation) => {
                                const isHex = variation.color?.startsWith('#');
                                const isSelected = selectedColor?.id === variation.id;
                                
                                return (
                                    <button
                                        key={variation.id}
                                        onClick={() => setSelectedColor(variation)}
                                        title={variation.color}
                                        className={`relative flex items-center justify-center p-0.5 rounded-sm transition-all duration-200 border ${
                                            isSelected 
                                            ? 'border-primary' 
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        {variation.image ? (
                                            <ImageViwer image={variation.image} className='w-10 h-10 object-cover rounded-sm' />
                                        ) : isHex ? (
                                            <div className='w-10 h-10 rounded-sm' style={{ backgroundColor: variation.color }}></div>
                                        ) : (
                                            <div className='px-4 py-2 rounded-sm text-sm bg-bg text-heading'>
                                                {variation.color || __('Default')}
                                            </div>
                                        )}
                                        {isSelected && (
                                            <span className="absolute -bottom-0 -right-0 w-3.5 h-3.5 bg-primary text-white text-[8px] flex items-center justify-center rounded-tl-sm z-10">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Size / Combinations */}
            {variations.length > 0 && selectedColor?.combinations?.length > 0 && (
                <div className='flex gap-4'>
                    <div className='w-24 text-dynamic text-sm mt-2 shrink-0'>{__('Size')}</div>
                    <div className='flex flex-col gap-2 flex-1'>
                        <div className='flex justify-between items-center'>
                            {/* <span className='text-heading text-sm font-medium'>
                                {selectedCombo?.attributes?.map(a => a.value).join(', ')}
                            </span> */}
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {selectedColor.combinations.map((combo) => {
                                const isSelected = selectedCombo?.id === combo.id;
                                const isOutOfStock = combo.stock <= 0;
                                return (
                                    <button
                                        key={combo.id}
                                        onClick={() => setSelectedCombo(combo)}
                                        disabled={isOutOfStock}
                                        className={`px-4 py-1.5 min-w-[3.5rem] border text-center text-sm rounded-sm transition-all duration-200 ${
                                            isSelected
                                            ? 'border-primary text-primary font-medium'
                                            : isOutOfStock
                                            ? 'border-border text-dynamic bg-gray-50 opacity-50 cursor-not-allowed'
                                            : 'border-border text-heading hover:border-primary/50'
                                        }`}
                                    >
                                        {combo.attributes?.[0]?.value || __('Default')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Quantity */}
            <div className='flex gap-4 items-center'>
                <div className='w-24 text-dynamic text-sm shrink-0'>{__('Quantity')}</div>
                <div className='flex items-center gap-4 flex-1'>
                    <QuantitySelector
                        maxStock={availableStock}
                        selectedStock={qty}
                        onChange={setQty}
                    />
                    <span className="text-xs text-dynamic font-medium">
                        {availableStock > 0 ? __(':count pieces available', { count: availableStock }) : __('Out of stock')}
                    </span>
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className='flex gap-3 mt-4'>
                <button className='flex-1 max-w-44 bg-secondary hover:bg-secondary/80 text-white py-3 rounded-sm font-semibold text-lg transition-colors shadow-sm'>
                    {__('Buy Now')}
                </button>
                <button 
                    onClick={handleAddToCart}
                    disabled={availableStock < 1 || (variations.length > 0 && !selectedCombo)}
                    className='flex-1 max-w-44 bg-primary hover:bg-primary/80 text-white py-3 rounded-sm font-semibold text-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {__('Add to Cart')}
                </button>
            </div>
        </div>
    );
}

export default Variations;
