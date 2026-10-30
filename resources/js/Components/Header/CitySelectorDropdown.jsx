import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { BiMapPin } from 'react-icons/bi';
import { RiArrowDownSLine, RiCheckLine, RiCompass3Line } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import axios from 'axios';

const STORAGE_CITY_KEY = 'nt_selected_city';

export default function CitySelectorDropdown() {
    const { props } = usePage();
    const { shopCities = [] } = props;
    const { __ } = useLang();

    const [selectedCity, setSelectedCity] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const dropdownRef = useRef(null);

    // Read active city from URL query if present, otherwise from localStorage
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCity = urlParams.get('city');

        if (urlCity && shopCities.length > 0) {
            const match = shopCities.find((c) => String(c.id) === String(urlCity) || c.slug === urlCity);
            if (match) {
                setSelectedCity(match);
                try {
                    localStorage.setItem(STORAGE_CITY_KEY, JSON.stringify(match));
                } catch (_) {}
                return;
            }
        }

        // Try reading stored selection from localStorage
        try {
            const stored = localStorage.getItem(STORAGE_CITY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.id) {
                    setSelectedCity(parsed);
                    return;
                }
            }
        } catch (_) {}

        // Auto-detect city via API or IP if not yet chosen
        autoDetectCity();
    }, [shopCities]);

    const autoDetectCity = async () => {
        if (shopCities.length === 0) return;
        setIsDetecting(true);
        try {
            const res = await axios.get('/api/detect-country');
            const detectedName = res.data?.city;
            if (detectedName) {
                const match = shopCities.find(
                    (c) => c.title.toLowerCase() === detectedName.toLowerCase() ||
                           c.slug.toLowerCase() === detectedName.toLowerCase()
                );
                if (match) {
                    setSelectedCity(match);
                    try {
                        localStorage.setItem(STORAGE_CITY_KEY, JSON.stringify(match));
                    } catch (_) {}
                }
            }
        } catch (_) {
            // Silently fallback if detection unavailable
        } finally {
            setIsDetecting(false);
        }
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCity = (city) => {
        setSelectedCity(city);
        setIsOpen(false);
        try {
            if (city) {
                localStorage.setItem(STORAGE_CITY_KEY, JSON.stringify(city));
            } else {
                localStorage.removeItem(STORAGE_CITY_KEY);
            }
        } catch (_) {}

        // Navigate to shop with the city filter
        if (city) {
            router.get(route('shop'), { city: city.id }, { preserveState: false });
        } else {
            router.get(route('shop'), {}, { preserveState: false });
        }
    };

    if (!shopCities || shopCities.length === 0) {
        return null;
    }

    return (
        <div ref={dropdownRef} className="relative inline-flex items-center">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-[11px] md:text-[13px] font-medium text-text hover:text-primary transition-colors cursor-pointer select-none py-1"
                title={__('Shop by City')}
            >
                <BiMapPin size={14} className="text-primary shrink-0" />
                <span className="text-res/80 hidden lg:inline">{__('City:')}</span>
                <span className="font-semibold text-heading max-w-[100px] truncate">
                    {selectedCity ? selectedCity.title : __('All Cities')}
                </span>
                <RiArrowDownSLine size={13} className={`text-res transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-border shadow-xl z-[9999] overflow-hidden py-1.5 animate-fadeIn">
                    <div className="px-3.5 py-2 border-b border-border/60 flex items-center justify-between bg-slate-50/70">
                        <span className="text-[11px] font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                            <RiCompass3Line size={13} className="text-primary" />
                            {__('Shop In Your City')}
                        </span>
                        {isDetecting && (
                            <span className="text-[10px] text-primary animate-pulse">{__('Detecting...')}</span>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                        <button
                            type="button"
                            onClick={() => handleSelectCity(null)}
                            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-primary/10 transition-colors ${
                                !selectedCity ? 'font-bold text-primary bg-primary/5' : 'text-heading'
                            }`}
                        >
                            <span>{__('All Cities (Nationwide)')}</span>
                            {!selectedCity && <RiCheckLine size={14} className="text-primary" />}
                        </button>

                        {shopCities.map((city) => {
                            const isSelected = selectedCity?.id === city.id;
                            return (
                                <button
                                    key={city.id}
                                    type="button"
                                    onClick={() => handleSelectCity(city)}
                                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-primary/10 transition-colors ${
                                        isSelected ? 'font-bold text-primary bg-primary/5' : 'text-heading'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="truncate">{city.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {city.product_count !== undefined && (
                                            <span className="text-[10px] text-res/80 px-1.5 py-0.2 bg-slate-100 rounded-full">
                                                {city.product_count}
                                            </span>
                                        )}
                                        {isSelected && <RiCheckLine size={14} className="text-primary shrink-0" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-3 py-1.5 border-t border-border/60 bg-slate-50/50 flex justify-between items-center text-[10px] text-res">
                        <span>{__('Find local stores & stock')}</span>
                        <button
                            type="button"
                            onClick={autoDetectCity}
                            className="text-primary hover:underline font-semibold"
                        >
                            {__('Re-detect')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
