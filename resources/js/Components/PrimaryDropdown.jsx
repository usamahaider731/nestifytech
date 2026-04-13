import React, { useEffect, useState } from 'react';
import TextInput from './TextInput';
import { RiArrowRightSLine, RiCheckLine, RiExpandUpDownLine } from 'react-icons/ri';

function PrimaryDropdown({ className = '', onChange='', placeholder = 'Select Category', options = [], value = '', valueInTitle = false, none = false }) {
    const [subOption, setSubOption] = useState(null);
    const [Open, setOpen] = useState(false);
    const [initialValue, setInitialValue] = useState(value || '');
    const [currentLabel, setCurrentLabel] = useState('');
    const openChildren = (children) => {
        setSubOption(children);
    };
    const setValue = (option) => {
        setCurrentLabel(option.title);
        setInitialValue(valueInTitle ? option.title : option.id);
        setSubOption(null);
        if (typeof onChange === 'function') {
            onChange(valueInTitle ? option.title : option.id);
        }
        setOpen(false);
    };
    useEffect(() => {
        let currntOption = null;
        if (valueInTitle) {
            currntOption = options.find(opt => opt.title === value);
            if (!currntOption) {
                options.forEach((option) => {
                    const match = option.children?.find(child => child.title === value);
                    if (match) currntOption = match;
                });
            }
        } else {
            currntOption = options.find(opt => opt.id === value);
            if (!currntOption) {
                options.forEach((option) => {
                    const match = option.children?.find(child => child.id === value);
                    if (match) currntOption = match;
                });
            }
        }
        if (currntOption) {
            setCurrentLabel(currntOption.title);
        }
    }, [value, options]);

    return (
        <>
        {Open &&
        <div className="size-full fixed inset-0 z-40" onClick={()=>{setOpen(false)}}></div>
        }
        <div className={`flex flex-col relative w-full ${className}`}>
            <div className='w-full h-fit relative' onClick={() => setOpen(true)}>
                <TextInput className='w-full' placeholder={placeholder} value={currentLabel} />
                <input type="hidden" name="" value={initialValue} />
                <RiExpandUpDownLine className={`absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-secondary`} />
            </div>
            <div className={`top-12 ${Open ? 'flex' : 'hidden'} absolute left-0 w-full bg-bg z-50`}>
                <div className={`duration-500 h-40 overflow-y-auto ease-in-out w-full ${subOption ? 'hidden' : ''}`}>
                    {none &&
                        <div
                            key={0}
                            onClick={()=>setValue({id:0,title:'None'})}
                            className='h-10 cursor-pointer flex items-center font-medium text-base justify-between text-heading px-5 text-center w-full hover:bg-primary'
                        >
                            None
                        </div>
                    }
                    {
                        Array.isArray(options) && options.map((option, ctx) => (
                            <React.Fragment key={option.id ?? `opt-${ctx}`}>
                                <div onClick={()=>setValue(option)} className={`h-10 cursor-pointer flex items-center font-normal text-base justify-between text-heading px-5 text-center w-full hover:bg-primary ${(value == option.id || value == option.title) ?? 'bg-primary'}`}>
                                    <span className=''>{option.title ?? option.label}</span>
                                    {(value == option.id || value == option.title) ?? <RiCheckLine className='h-4 w-4' />}
                                </div>
                                {
                                    Array.isArray(option.children) && option.children.map((suboption, idex) => {
                                        return (
                                            <React.Fragment key={suboption.id ?? `sub-${ctx}-${idex}`}>
                                                <div onClick={()=>setValue(suboption)} className={`h-10 cursor-pointer flex items-center font-normal text-base justify-between text-heading pr-5 pl-10 text-center w-full hover:bg-primary ${(value == suboption.id || value == suboption.title) ?? 'bg-primary'}`}>
                                                    <span className=''>{suboption.title}</span>
                                                    {(value == suboption.id || value == suboption.title) ?? <RiCheckLine className='h-4 w-4' />}
                                                </div>
                                                {
                                                    Array.isArray(suboption.children) && suboption.children.map((childoption, c_idx) =>
                                                        <div key={childoption.id ?? `child-${ctx}-${idex}-${c_idx}`} onClick={()=>setValue(childoption)} className={`h-10 cursor-pointer flex items-center font-normal text-base justify-between text-heading pr-5 pl-12 text-center w-full hover:bg-primary ${(value == childoption.id || value == childoption.title) ?? 'bg-primary'}`}>
                                                            <span className=''>{childoption.title}</span>
                                                            {(value == childoption.id || value == childoption.title) ?? <RiCheckLine className='h-4 w-4' />}
                                                        </div>
                                                    )
                                                }
                                            </React.Fragment>
                                        )
                                    })
                                }

                            </React.Fragment>
                        ))
                    }
                </div>
            </div>
        </div>
        </>
    );
}

export default PrimaryDropdown;