import React, { useEffect, useRef, useState } from 'react';
import TextInput from './TextInput';
import { RiArrowDownSLine, RiArrowUpDownLine, RiArrowUpSLine, RiExpandUpDownLine } from 'react-icons/ri';

function DropdownSelect({
    id,
    name,
    value = '',
    onChange,
    className = '',
    options = [],
    error,
    isLoading = false,
    disabled = false,
    searchable = true,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [localValue, setLocalValue] = useState('');
    const dropdownRef = useRef(null);
    const prevValueRef = useRef(value);
    const safeOptions = Array.isArray(options) ? options : [];

    // Sync local value with incoming value ONLY when the prop value changes
    useEffect(() => {
        if (prevValueRef.current !== value) {
            const stringValue = (value ?? "").toString();
            const option = safeOptions.find((opt) => (opt.id ?? opt.value ?? "").toString() === stringValue);
            const displayValue = option ? (option.title ?? option.name) : value;
            const isNumericId = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value));

            if (option || !isNumericId || value === '') {
                setLocalValue(displayValue || '');
                prevValueRef.current = value;
            }
        }
    }, [value, safeOptions]);

    // Initial sync - handle the case where we load with an existing ID
    useEffect(() => {
        if (value) {
            const stringValue = (value ?? "").toString();
            const option = safeOptions.find((opt) => (opt.id ?? opt.value ?? "").toString() === stringValue);
            if (option) {
                setLocalValue(option.title ?? option.name ?? option.label);
            } else {
                setLocalValue(value || '');
            }
        }
    }, [safeOptions]); // Re-run when options arrive

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    const handleSelect = (option) => {
        setIsOpen(false);
        setLocalValue(option.title || option.label || option.name || '');
        if (typeof onChange === 'function') {
            onChange(option.id || option.value || option.name || '');
        }
    };

    const handleInput = (e) => {
        const val = e.target.value;
        setLocalValue(val);
        if (typeof onChange === 'function') {
            onChange(val);
        }
        if (!isOpen && val.length > 0 && !disabled && !isLoading && searchable) setIsOpen(true);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions = searchable
        ? safeOptions.filter(opt => {
            const title = (opt?.title || opt.label || '').toString().toLowerCase();
            const search = (localValue || '').toString().toLowerCase();
            return title.includes(search);
        })
        : safeOptions;
    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative h-10 w-full text-white">
                {searchable ? (
                    <TextInput
                        id={id}
                        name={name}
                        value={localValue}
                        onChange={handleInput}
                        onFocus={() => !disabled && searchable && setIsOpen(true)}
                        className={`h-10 w-full px-5 pr-10 ${disabled ? ' cursor-not-allowed' : 'cursor-text'} ${error ? 'border-red-500 hover:border-red-600' : 'border-secondary/20 hover:border-primary'} transition-all`}
                        disabled={disabled}
                        placeholder="Type or select..."
                    />
                ) : (
                    <div
                        id={id}
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        className={`h-10 w-full px-5 pr-10 flex items-center border border-secondary rounded-lg select-none ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary transition-all'} ${error ? 'border-red-500' : ''}`}
                    >
                        <span className={`text-sm truncate ${!localValue ? 'text-gray-400' : 'text-heading font-medium'}`}>
                            {localValue || "Select..."}
                        </span>
                        <input type="hidden" name={name} value={value} />
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-secondary hover:text-primary transition-all p-1"
                    disabled={disabled || isLoading}
                >
                    <RiExpandUpDownLine size={16} className={`${isOpen ? 'rotate-180' : ''} transition-transform`} />
                </button>
            </div>

            {isOpen && !disabled && (
                <ul className="absolute top-[calc(100%+4px)] left-0 w-full bg-accent dark:bg-gray-800 border border-secondary shadow-xl z-50 max-h-48 overflow-y-auto">
                    {isLoading ? (
                        <li className="p-3 text-sm text-res italic">Loading...</li>
                    ) : (
                        <>
                            {localValue?.length > 0 && (
                                <li
                                    onClick={() => handleSelect({ id: '', title: '' })}
                                    className="p-3 text-sm cursor-pointer text-red-500 hover:bg-accent/40 italic flex justify-between"
                                >
                                    Clear this field
                                </li>
                            )}
                            {filteredOptions.length === 0 ? (
                                <li className="p-3 text-sm text-res italic text-center">
                                    {searchable ? `No matches found. Use "${localValue}"` : "No options available."}
                                </li>
                            ) : (
                                filteredOptions.map((opt) => (
                                    <li
                                        key={opt.id || opt.value || opt.name}
                                        onClick={() => handleSelect(opt)}
                                        className={`p-3 text-sm cursor-pointer transition-colors ${value === opt.id ? 'bg-primary text-white' : 'hover:bg-accent/40 text-res'}`}
                                    >
                                        {opt.title || opt.label || opt.name}
                                    </li>
                                ))
                            )}
                        </>
                    )}
                </ul>
            )}
            {error && <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}

export default DropdownSelect;