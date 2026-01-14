import React, { useEffect, useState } from 'react';
import TextInput from '../TextInput';
import PartButton from './PartButton';
import { RiSubtractLine, RiAddLine } from 'react-icons/ri';

function DynamicOptions({ fieldName, initialOptions = [], onChange }) {
    const [fieldOptions, setFieldOptions] = useState(
        initialOptions
    );
    
    useEffect(() => {
        onChange(fieldOptions);
    }, []);

    const addOption = () => {
        const updated = [...fieldOptions, ''];
        setFieldOptions(updated);
        onChange(updated);
    };

    const removeOption = (index) => {
        const updated = fieldOptions.filter((_, i) => i !== index);
        setFieldOptions(updated);
        onChange(updated);
    };

    const updateOptionValue = (index, newValue) => {
        const updated = [...fieldOptions];
        updated[index] = newValue;
        setFieldOptions(updated);
        onChange(updated);
    };

    return (
        <div className="flex flex-col gap-3 mt-3">
            {fieldOptions.map((value, index) => (
                <div key={index} className="flex gap-3 items-center">
                    <TextInput
                        value={value.value}
                        onChange={(e) => updateOptionValue(index, e.target.value)}
                        className="w-full"
                        placeholder="Option"
                        required
                    />
                    <PartButton
                        type="button"
                        onClick={() => removeOption(index)}
                        className="w-10 pl-0 pr-0"
                    >
                        <RiSubtractLine className="h-4 w-4" />
                    </PartButton>
                </div>
            ))}
            <PartButton type="button" onClick={addOption} className="w-10 pl-0 pr-0">
                <RiAddLine className="h-4 w-4 px-0" />
            </PartButton>
        </div>
    );
}

export default DynamicOptions;