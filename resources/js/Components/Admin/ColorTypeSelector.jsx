import React from 'react';
import ColorAppearancePreview from '@/Components/Admin/ColorAppearancePreview';

function ColorTypeSelector({ value, palettes = {}, onChange }) {
    const entries = Object.entries(palettes);

    const handleSelect = (typeKey) => {
        const palette = palettes[typeKey];
        if (!palette || !onChange) return;

        const colors = { ...palette };
        delete colors.label;
        delete colors.swatch;

        onChange(typeKey, colors);
    };

    if (entries.length === 0) {
        return (
            <p className="text-sm text-res italic rounded-xl border border-dashed border-secondary/40 p-6 text-center">
                Add color themes in the list above, then pick an appearance here.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-res">Choose how your site should look. Each card shows a live appearance preview.</p>
            <div className="flex flex-wrap gap-4">
                {entries.map(([key, palette]) => (
                    <ColorAppearancePreview
                        key={key}
                        colors={palette}
                        label={palette.label}
                        selected={value === key}
                        onClick={() => handleSelect(key)}
                    />
                ))}
            </div>
        </div>
    );
}

export default ColorTypeSelector;
