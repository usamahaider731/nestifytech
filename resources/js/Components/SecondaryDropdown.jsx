import React, { useEffect, useState } from 'react';
import TextInput from './TextInput';
import { RiArrowRightSLine, RiExpandUpDownLine } from 'react-icons/ri';

function SecondaryDropdown({ className = '', onChange = '', none = false, placeholder = 'Select Category', options = [], value = '', valueInTitle = false }) {
    const [subOption, setSubOption] = useState(null);
    const [Open, setOpen] = useState(false);
    const [initialValue, setInitialValue] = useState(value);
    const [currentLabel, setCurrentLabel] = useState(null);
    const openChildren = (children) => {
        setSubOption(children);
    };
    const setValue = (option) => {
        setCurrentLabel(option.title ?? option.name);
        setInitialValue(valueInTitle ? (option.title ?? option.name) : option.id ?? option.value);
        setSubOption(null);
        setOpen(false);
    };
    useEffect(() => {
        let currntOption = null;
        if (valueInTitle) {
            currntOption = options.find(opt => (opt.title || opt.name) === value);
            if (!currntOption) {
                options.forEach((option) => {
                    const match = option.children?.find(child => (child.title || child.name) === value);
                    if (match) currntOption = match;
                });
            }
        } else {
            const stringValue = (value ?? "").toString();
            currntOption = options.find(opt => (opt.id ?? opt.value ?? "").toString() === stringValue);
            if (!currntOption) {
                options.forEach((option) => {
                    const match = option.children?.find(child => (child.id ?? child.value ?? "").toString() === stringValue);
                    if (match) currntOption = match;
                });
            }
        }
        if (currntOption) {
            setCurrentLabel(currntOption.title ?? currntOption.name);
        } else {
            setCurrentLabel(null);
        }
    }, [value, options]);

    return (
        <div className={`flex flex-col relative w-full ${className}`}>
            <div className='w-full h-fit relative text-white' onClick={() => setOpen(true)}>
                <TextInput className='w-full' placeholder={placeholder} value={currentLabel} />
                <RiExpandUpDownLine className={`absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-secondary`} />
            </div>
            <div className={`top-12 ${Open ? 'flex' : 'hidden'} absolute left-0 w-full bg-bg z-50`}>
                <div className={`duration-500 h-40 overflow-y-auto ease-in-out w-full ${subOption ? 'hidden' : ''}`}>
                    {none &&
                        <div
                            key={0}
                            className='h-10 cursor-pointer flex items-center font-medium text-base justify-between text-heading px-5 text-center w-full hover:bg-primary'
                        >
                            None
                        </div>
                    }
                    {options.map((option, index) => (
                        <div
                            key={option.id || index}
                            onClick={() => openChildren(option)}
                            className='h-10 cursor-pointer flex items-center font-medium text-base justify-between text-heading px-5 text-center w-full hover:bg-primary'
                        >
                            {option.title ?? option.label}
                            <RiArrowRightSLine className='size-4' />
                        </div>
                    ))}
                </div>

                {subOption && (
                    <div className={`h-40 overflow-y-auto duration-500 ease-in-out w-full pt-5`}>
                        <div
                            className='w-full px-5 py-2 text-sm text-primary cursor-pointer'
                            onClick={() => setSubOption(null)}
                        >
                            ← Back
                        </div>
                        {subOption.children?.map((SubOption, idx) => (
                            <div
                                key={SubOption.id || idx}
                                onClick={() => SubOption.children ? openChildren(SubOption) : setValue(SubOption)}
                                className='h-10 cursor-pointer flex items-center font-medium text-base justify-between text-heading px-5 text-center w-full hover:bg-primary'
                            >
                                {SubOption.title}
                                {SubOption.children && <RiArrowRightSLine className='size-4' />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SecondaryDropdown;