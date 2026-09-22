export function applyDocumentLanguage(language) {
    if (!language || typeof document === 'undefined') {
        return;
    }

    const html = document.documentElement;
    html.lang = language.prefix || 'en';
    html.dir = language.direction === 'rtl' ? 'rtl' : 'ltr';
}

export function applyReplacements(text, replacements) {
    if (!replacements) {
        return text;
    }

    return Object.entries(replacements).reduce(
        (value, [key, replacement]) => value.replaceAll(`:${key}`, String(replacement)),
        text,
    );
}
