export function applyThemeColors(colors = {}) {
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
        if (!value || typeof value !== 'string' || key === 'color_type') {
            return;
        }

        root.style.setProperty(`--${key}`, value);
    });
}

export function extractColorPayload(data = {}, colorKeys = []) {
    const payload = {};

    colorKeys.forEach((key) => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
            payload[key] = data[key];
        }
    });

    if (data.color_type !== undefined && data.color_type !== null && data.color_type !== '') {
        payload.color_type = data.color_type;
    }

    return payload;
}
