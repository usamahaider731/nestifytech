import React, { useEffect, useMemo, useState } from 'react';
import { RiCheckLine, RiCloseLine, RiPaletteLine } from 'react-icons/ri';
import { usePage } from '@inertiajs/react';
import ColorAppearanceMockup from '@/Components/ColorAppearanceMockup';
import { buildPalettesFromTypes } from '@/Utils/colorPalettes';
import { applyThemeColors } from '@/Utils/applyThemeColors';

const STORAGE_KEY = 'nestify-site-color-theme';

function paletteToColors(palette) {
    const colors = { ...palette };
    delete colors.label;
    delete colors.swatch;
    return colors;
}

export default function ThemeSwitcher() {
    const { setting } = usePage().props;
    const themes = setting?.color?.color_types?.value ?? [];
    const defaultKey = setting?.color?.color_type?.value ?? '';

    const palettes = useMemo(() => buildPalettesFromTypes(themes), [themes]);
    const paletteKeys = Object.keys(palettes);

    const [open, setOpen] = useState(false);
    const [activeKey, setActiveKey] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && palettes[saved]) return saved;
        if (defaultKey && palettes[defaultKey]) return defaultKey;
        return paletteKeys[0] || '';
    });

    useEffect(() => {
        if (!activeKey || !palettes[activeKey]) return;
        applyThemeColors(paletteToColors(palettes[activeKey]));
    }, [activeKey, palettes]);

    if (paletteKeys.length === 0) {
        return null;
    }

    const selectTheme = (key) => {
        if (!palettes[key]) return;
        setActiveKey(key);
        localStorage.setItem(STORAGE_KEY, key);
        applyThemeColors(paletteToColors(palettes[key]));
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="fixed z-[130] bottom-[10%] left-5 size-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 transition-all"
                aria-label="Change color appearance"
            >
                <RiPaletteLine className="text-2xl" />
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-[129] bg-black/20"
                        aria-label="Close theme panel"
                        onClick={() => setOpen(false)}
                    />
                    <div className="fixed z-[130] bottom-[10%] left-20 w-[min(92vw,360px)]">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 capitalize">Color Appearance</h3>
                                    <p className="text-xs text-gray-500">Tap a theme to change site colors</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="size-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                                >
                                    <RiCloseLine className="text-lg" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3 max-h-[50vh] overflow-y-auto">
                                {Object.entries(palettes).map(([key, palette]) => {
                                    const isSelected = activeKey === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => selectTheme(key)}
                                            className={`relative flex flex-col gap-2 rounded-xl border-2 p-2.5 min-w-[108px] max-w-[120px] transition-all text-left
                                                ${isSelected
                                                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 scale-[1.02]'
                                                    : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5'
                                                }`}
                                        >
                                            <ColorAppearanceMockup colors={palette} />
                                            <span className={`text-xs font-semibold capitalize text-center ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                                                {palette.label}
                                            </span>
                                            {isSelected && (
                                                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                                                    <RiCheckLine className="text-sm" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
