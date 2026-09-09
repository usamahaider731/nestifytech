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
            primary: item.primary || '#000000',
            secondary: item.secondary || '#7983a7',
            accent: item.accent || '#2f3349',
            res: item.res || '#b6bee3',
            bg: item.bg || '#25293c',
            dynamic: item.dynamic || '#3a3d53',
            heading: item.heading || '#d0d4f1',
            permanent: item.permanent || '#434968',
            ...(item.text ? { text: item.text } : {}),
        };
    });

    return palettes;
}
