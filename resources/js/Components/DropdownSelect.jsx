import React, { useEffect, useRef, useState } from 'react';
import TextInput from './TextInput';
import { RiExpandUpDownLine } from 'react-icons/ri';
import { label } from '@/Utils/classes';

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
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const currentLabel =
        options.find((opt) => opt.id == value)?.title || 
        options.find((opt) => opt.value == value)?.title || value || '';
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };
console.log(currentLabel)
    const handleKeyDown = (e) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'Escape':
                setIsOpen(false);
                break;
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Enter':
                e.preventDefault();
                break;
        }
    };

    const handleSelect = (selectedValue) => {
        setIsOpen(false);
        if (typeof onChange === 'function') {
            onChange(selectedValue);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div
            className={`relative ${className}`}
            ref={dropdownRef}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={`${id}-label`}
        >
            <div
                className={`relative h-10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
                aria-disabled={disabled || isLoading}
            >
                <TextInput
                    id={id}
                    name={name}
                    readOnly
                    value={currentLabel}
                    className={`h-10 w-full px-5 ${disabled || isLoading ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'} ${error ? 'border-red-500' : ''}`}
                    aria-invalid={!!error}
                    disabled={disabled || isLoading}
                />
                {isLoading ? (
                    <div
                        className="absolute top-1/2 right-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent -translate-y-1/2"
                        aria-label="Loading options"
                    />
                ) : (
                    <RiExpandUpDownLine className={`absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 ${disabled ? 'text-gray-400' : 'text-secondary'}`} />
                )}
            </div>

            <ul
                className={`
                    absolute 
                    top-[calc(100%+8px)]
                    z-40
                    shadow-lg
                    left-0 
                    w-full 
                    bg-bg
                    max-h-40
                    overflow-y-auto
                    transition-all 
                    duration-200
                    ease-in-out 
                    dropdown 
                    ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}
                `}
                role="listbox"
                aria-labelledby={`${id}-label`}
            >
                {options.length === 0 ? (
                    <li className="h-10 w-full text-res flex items-center px-5" role="option">
                        {isLoading ? 'Loading options...' : 'No options available'}
                    </li>
                ) : (
                    options.map((option) => (
                        <li
                            key={option.id}
                            onClick={() => handleSelect(option.id)}
                            className={`h-10 w-full text-res flex items-center px-5 hover:bg-[color-mix(in_sRGB,_#e1def5_6%,_#2f3349)] cursor-pointer ${value === option.id ? 'bg-primary text-white' : ''
                                }`}
                            role="option"
                            aria-selected={value === option.id}
                        >
                            {option.title}
                        </li>
                    ))
                )}
            </ul>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default DropdownSelect;