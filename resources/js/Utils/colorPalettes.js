export function resolveThemeKey(item = {}) {
    const key = String(item.key || '').trim();
    if (key) {
        return key.toLowerCase().replace(/\s+/g, '-');
    }

    return String(item.label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function buildPalettesFromTypes(colorTypes = []) {
    const palettes = {};

    (Array.isArray(colorTypes) ? colorTypes : []).forEach((item) => {
        const key = resolveThemeKey(item);
        if (!key) return;

        palettes[key] = {
            label: item.label || key,
            swatch: item.primary || '#000000',
            ...Object.fromEntries(
                Object.entries(item).filter(([colorKey, colorValue]) => (
                    !['key', 'label'].includes(colorKey)
                    && typeof colorValue === 'string'
                    && colorValue.trim() !== ''
                ))
            ),
        };
    });

    return palettes;
}
