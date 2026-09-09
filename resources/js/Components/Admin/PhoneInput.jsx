import React from 'react';
import { PhoneInput as InternationalPhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { input } from '@/Utils/classes';

const PhoneInput = ({ value, onChange, className = '', error, ...props }) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            <InternationalPhoneInput
                defaultCountry="pk"
                value={value}
                onChange={(phone) => onChange(phone)}
                className={className}
                inputClassName={`!w-full !bg-transparent !border-secondary !text-heading !rounded-r-md !h-[42px] focus:!ring-0 focus:!outline-none ${error ? '!border-red-500' : ''}`}
                countrySelectorStyleProps={{
                    buttonClassName: '!bg-transparent !border-secondary !rounded-l-md !h-[42px] !flex !items-center !justify-center !px-2',
                    dropdownClassName: '!bg-accent !border-secondary !text-heading',
                }}
                {...props}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
};

export default PhoneInput;
