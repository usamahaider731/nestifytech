import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { applyDocumentLanguage, applyReplacements } from '@/Utils/lang';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const { languages = [], currentLanguage = null, translations = {} } = usePage().props;

    useEffect(() => {
        applyDocumentLanguage(currentLanguage);
    }, [currentLanguage]);

    const __ = useCallback(
        (key, replacements) => {
            if (!key) {
                return '';
            }

            return applyReplacements(translations?.[key] || key, replacements);
        },
        [translations],
    );

    const setLanguage = useCallback(
        (language) => {
            if (!language?.prefix || language.prefix === currentLanguage?.prefix) {
                return;
            }

            router.visit(route('language.set', language.prefix), {
                preserveScroll: true,
            });
        },
        [currentLanguage?.prefix],
    );

    const value = useMemo(
        () => ({
            languages,
            currentLanguage,
            translations,
            setLanguage,
            __,
        }),
        [languages, currentLanguage, translations, setLanguage, __],
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
    const context = useContext(LanguageContext);

    if (!context) {
        return {
            languages: [],
            currentLanguage: null,
            translations: {},
            setLanguage: () => {},
            __: (key, replacements) => applyReplacements(key ?? '', replacements),
        };
    }

    return context;
}
