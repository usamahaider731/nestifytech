import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { applyDocumentLanguage, applyReplacements } from '@/Utils/lang';
import axios from 'axios';

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

            if (translations && typeof translations[key] === 'undefined' && key.trim() !== '') {
                // If key is missing, batch it and send to backend
                if (!window.missingTranslationKeys) {
                    window.missingTranslationKeys = new Set();
                }
                
                if (!window.missingTranslationKeys.has(key)) {
                    window.missingTranslationKeys.add(key);
                    
                    if (window.translationTimeout) {
                        clearTimeout(window.translationTimeout);
                    }
                    
                    window.translationTimeout = setTimeout(() => {
                        const keysToSave = Array.from(window.missingTranslationKeys);
                        window.missingTranslationKeys.clear();
                        
                        // Ignore standard validation or internal keys if needed
                        axios.post('/api/add-lang-key', { keys: keysToSave })
                            .catch(err => console.error("Error saving lang keys:", err));
                    }, 2000);
                }
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
