import { Colors } from 'chart.js';
import { color } from 'chart.js/helpers';
import React from 'react';
import { RiCheckLine } from 'react-icons/ri';

export function normalizeAppearanceColors(colors = {}) {
    // 1. Define default values for known keys
    const defaults = {
        primary: '#7367f0',
        secondary: '#7983a7',
        accent: '#2f3349',
        res: colors.text || '#b6bee3',
        text: colors.res || '#7c7c7c',
        bg: '#25293c',
        dynamic: '#3a3d53',
        heading: '#d0d4f1',
        permanent: '#434968',
        common: '#434968',
    };
    // Start with the default fallbacks
    const result = { ...defaults };
    // 2. Loop dynamically through all incoming keys
    for (const [key, value] of Object.entries(colors)) {
        // Skip metadata keys
        if (key === 'label' || key === 'swatch') continue;

        // Dynamically assign whatever key/value is passed in
        if (value) {
            result[key] = value;
        }
    }
    return result;
}

export function ColorAppearanceMockup({ colors = {}, compact = false, className = '' }) {
    const theme = normalizeAppearanceColors(colors);

    if (compact) {
        return (
            <div
                className={`w-16 h-11 rounded-lg overflow-hidden border border-white/10 shadow-sm shrink-0 ${className}`}
                style={{ backgroundColor: theme.bg }}
            >
                <div className="h-2.5 px-1 flex items-center" style={{ backgroundColor: theme.primary }}>
                    <span className="size-1 rounded-full bg-white/50" />
                </div>
                <div className="p-1 flex gap-1 h-[calc(100%-10px)]">
                    <div className="w-1/3 rounded-sm" style={{ backgroundColor: theme.accent }} />
                    <div className="flex-1 flex flex-col gap-0.5 justify-center">
                        <div className="h-1 w-full rounded-sm opacity-80" style={{ backgroundColor: theme.heading }} />
                        <div className="h-1 w-2/3 rounded-sm opacity-60" style={{ backgroundColor: theme.res }} />
                        <div className="h-1.5 w-1/2 rounded-sm mt-0.5" style={{ backgroundColor: theme.primary }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl overflow-hidden border border-white/10 shadow-md ${className}`}
            style={{ backgroundColor: theme.bg }}
        >
            <div
                className="h-8 px-3 flex items-center justify-between"
                style={{ backgroundColor: theme.primary }}
            >
                <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-white/30" />
                    <span className="size-2 rounded-full bg-white/30" />
                    <span className="size-2 rounded-full bg-white/30" />
                </div>
                <div className="h-2 w-12 rounded-full bg-white/25" />
            </div>

            <div className="p-3 flex gap-3 min-h-[88px]">
                <div
                    className="w-[28%] rounded-lg p-2 space-y-1.5 shrink-0"
                    style={{ backgroundColor: theme.accent }}
                >
                    <div className="h-1.5 w-full rounded" style={{ backgroundColor: theme.permanent }} />
                    <div className="h-1.5 w-4/5 rounded opacity-70" style={{ backgroundColor: theme.dynamic }} />
                    <div className="h-1.5 w-full rounded opacity-70" style={{ backgroundColor: theme.dynamic }} />
                </div>

                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="h-2 w-3/4 rounded" style={{ backgroundColor: theme.heading }} />
                    <div className="h-1.5 w-full rounded opacity-70" style={{ backgroundColor: theme.res }} />
                    <div className="h-1.5 w-5/6 rounded opacity-50" style={{ backgroundColor: theme.text }} />
                    <div className="flex gap-2 mt-auto pt-1">
                        <div
                            className="h-5 px-3 rounded-md flex items-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: theme.primary }}
                        >
                            Button
                        </div>
                        <div
                            className="h-5 px-3 rounded-md border text-[8px] font-medium flex items-center"
                            style={{ borderColor: theme.secondary, color: theme.heading }}
                        >
                            Link
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorAppearancePreview({ colors = {}, label = '', selected = false, onClick, compact = false }) {
    const content = (
        <>
            <ColorAppearanceMockup colors={colors} compact={compact} className={compact ? '' : 'w-full'} />
            {label && (
                <span className={`text-xs font-semibold capitalize text-center ${selected ? 'text-primary' : 'text-res'}`}>
                    {label}
                </span>
            )}
        </>
    );

    if (!onClick) {
        return (
            <div className={`flex flex-col gap-2 ${compact ? 'items-center' : ''}`}>
                {content}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex flex-col gap-2 rounded-xl border-2 p-3 transition-all text-left
                ${compact ? 'min-w-[100px] items-center' : 'min-w-[140px] flex-1 max-w-[200px]'}
                ${selected
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                    : 'border-secondary/40 bg-permanent/30 hover:border-primary/50 hover:bg-primary/5'
                }`}
        >
            {content}
            {selected && (
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                    <RiCheckLine className="text-sm" />
                </span>
            )}
        </button>
    );
}

export default ColorAppearancePreview;
