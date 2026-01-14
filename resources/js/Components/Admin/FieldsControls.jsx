// FieldRenderer.js
import React from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Togglebox from '@/Components/Togglebox';
import ImageUploader from '@/Components/Admin/ImageUploader';
import DescriptionEditor from '@/Components/Admin/DescriptionEditor';
import DropdownSelect from '@/Components/DropdownSelect';
import CustomFields from './CustomFields';
import SecondaryDropdown from '../SecondaryDropdown';
import PrimaryDropdown from '../PrimaryDropdown';
import MultipleDropdown from '../MultipleDropdown';
import DynamicOptions from './DynamicOptions';
import InputField from './InputField';
import Textarea from '../Textarea';
import Repeater from './Repeater';
import DateRangePicker from './Calendar';

const FieldControls = ({
    field,
    data,
    updateField,
    rolesList,
    onChange,
    dropdownOptions,
    loadingStates,
}) => {
    const colSpan =
        field.style === 2 ? 'col-span-6' :
            field.type === 'checkbox' ? 'col-span-2' : 'col-span-3';

    const processOptions = (options, name) => {
        if (!options) return [];
        if (Array.isArray(options)) return options;
        if (options?.model && options?.type) {
            return dropdownOptions[name] || [];
        }
        return [];
    };
    let fieldClass = '';
    // isset condition
    if (field.condition) {
          fieldClass = 'hidden';
          console.log(data[field.condition])

      if (data[field.condition] == field.condition_value || data[field.condition]) {
          fieldClass = 'flex';
      }
      
    }
    
    // === TEXT FIELD ===
    if (field.type === 'text' || field.type === 'number') {
        if (!field.show_on || data[field.show_on] === "text" || data[field.show_on] === 'color') {


            return (
                <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <TextInput
                        type={field.type}
                        name={field.name}
                        value={data[field.name] || field.value || ''}
                        placeholder={field.placeholder}
                        onChange={(e) => updateField(field.name, e.target.value)}
                        required={field.attribute === 'required'}
                        className="border px-3 py-2 w-full rounded appearance-none"
                    />
                </div>
            );
        }
    }

    // === DESCRIPTION ===
    if (field.type === 'desc') {
        return (
            <div className="flex flex-col gap-2 col-span-6" key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <DescriptionEditor
                    name={field.name}
                    value={data[field.name] || ''}
                    onChange={(val) => updateField(field.name, val)}
                    placeholder={field.placeholder}
                />
            </div>
        );
    }
    // === DESCRIPTION ===
    if (field.type === 'calendar') {

        return (
            <div className={`flex flex-col gap-2 col-span-6 ${fieldClass}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <DateRangePicker onChange={(val) => updateField(field.name, val)} value={data[field.name]} />
            </div>
        );
    }

    // === IMAGE ===
    if (field.type === 'image') {
        let value = null;
        let multiple = !!field.multiple;
        if (field.value) {
            value = field.value;
        }
        else if (data[field.name]?.filename) {
            value = data[field.name].filename;
        } else if (data[field.name]) {
            value = data[field.name];
        }
        return (
            <div className="col-span-6" key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <ImageUploader
                    value={value}
                    multiple={multiple}
                    name={field.name}
                    onChange={(file) => updateField(field.name, file)}
                />
            </div>
        );
    }

    // === DROPDOWN ===
    if (field.type === 'dropdown') {
        if (field.multiple) {
            return (
                <div className={`flex flex-col gap-2 ${colSpan}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <MultipleDropdown
                        name={field.name}
                        placeholder={field.placeholder}
                        valueInTitle={field.options.use_value}
                        value={data[field.name] || field.value || ''}
                        options={processOptions(field.options, field.name)}
                        onChange={(val) => updateField(field.name, val)}
                        isLoading={loadingStates[field.name]}
                    />
                </div>
            );
        }
        if (field.children) {
            return (
                <div className={`flex flex-col gap-3 ${colSpan}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <SecondaryDropdown
                        name={field.name}
                        value={data[field.name] || ''}
                        options={processOptions(field.options, field.name)}
                        onChange={(val) => updateField(field.name, val)}
                        isLoading={loadingStates[field.name]}
                    />
                </div>
            );
        }
        if (field.withChildren) {
            return (
                <div className={`flex flex-col gap-2 ${colSpan}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <PrimaryDropdown
                        name={field.name}
                        value={data[field.name] || ''}
                        options={processOptions(field.options, field.name)}
                        onChange={(val) => updateField(field.name, val)}
                        isLoading={loadingStates[field.name]}
                    />
                </div>
            );
        }
        return (
            <div className={`flex flex-col gap-2 ${colSpan}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <DropdownSelect
                    name={field.name}
                    value={data[field.name] || field.value || ''}
                    options={processOptions(field.options, field.name)}
                    onChange={(val) => updateField(field.name, val)}
                    isLoading={loadingStates[field.name]}
                />
            </div>
        );
    }

    // === CHECKBOX (Roles) ===
    if (field.type === 'checkbox' && field.options?.model === 'Roles') {
        return rolesList.map(role => (
            <div key={role.id} className={`flex flex-col gap-2 ${colSpan}`}>
                <InputLabel className='text-heading'>{role.title}</InputLabel>
                <Togglebox
                    checked={data.roles?.includes(role.id)}
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        const updated = isChecked
                            ? [...(data.roles || []), role.id]
                            : data.roles.filter((id) => id !== role.id);
                        updateField('roles', updated);
                    }}
                />
            </div>
        ));
    }

    // === CHECKBOX ===
    if (field.type === 'checkbox') {
        return (
            <div className={`flex flex-col gap-2 ${colSpan}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <Togglebox
                    checked={!!data[field.name] || field.attribute == 'checked' || field.value == true}
                    onChange={(e) => updateField(field.name, field.value ? (field.value === true ? field.value = false : field.value = true) : e.target.checked)}
                />
            </div>
        );
    }


    // === ATTRIBUTES ===
    if (field.type === 'attributes') {
        return (
            <div className="w-full col-span-6" key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <CustomFields
                    onChange={(val) => updateField(field.name, val)}
                    value={data[field.name] || []}
                />
            </div>
        );
    }

    // === DYNAMIC OPTIONS ===
    if (field.type === 'dynamic_options') {
        const parent = data[field.show_on];
        if (['dropdown', 'checkbox', 'radio'].includes(parent)) {
            return (
                <div className="col-span-6" key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <DynamicOptions
                        fieldName={field.name}
                        initialOptions={data[field.name]}
                        onChange={(val) => updateField(field.name, val)}
                    />
                </div>
            );
        }
    }
    if (field.type === 'variations') {
        const variations = data[field.name] || [];
        return (
            <div key={field.name} className="space-y-4 col-span-6">
                <InputLabel className='text-heading'>{field.label}</InputLabel>

                {variations.map((variation, index) => (
                    <div key={index} className="flex justify-between gap-2 grid-flow-col p-3 rounded-lg shadow-md">
                        <div className='flex flex-col gap-5 w-2/5'>
                            {/* Size */}
                            <Textarea

                                placeholder="Enter the product size and write it as Key | Value. Use a new & for each entry."
                                value={variation.size || ""}
                                onChange={(e) => {
                                    const updated = [...variations];
                                    updated[index].size = e.target.value;
                                    updateField(field.name, updated);
                                }}
                                className="border p-2 bg-transparent h-fit rounded w-full"
                            />

                            {/* Color */}
                            <InputField
                                type="text"
                                placeholder="Color"
                                value={variation.color || ""}
                                onChange={(e) => {
                                    const updated = [...variations];
                                    updated[index].color = e.target.value;
                                    updateField(field.name, updated);
                                }}
                                className="border p-2 h-fit rounded w-full"
                            />

                            {/* Price */}
                            <InputField
                                type="number"
                                placeholder="Price"
                                value={variation.price || ""}
                                onChange={(e) => {
                                    const updated = [...variations];
                                    updated[index].price = e.target.value;
                                    updateField(field.name, updated);
                                }}
                                className="border p-2 rounded w-full"
                            />
                            <InputField
                                type="number"
                                placeholder="Stock"
                                value={variation.stock || ""}
                                onChange={(e) => {
                                    const updated = [...variations];
                                    updated[index].stock = e.target.value;
                                    updateField(field.name, updated);
                                }}
                                className="border p-2 rounded w-full appearance-none"
                            />
                        </div>
                        {/* Image */}
                        <div className='w-11/20 flex justify-between'>
                            <div className='w-17/20'>
                                <ImageUploader
                                    value={variation.image}
                                    name="image"
                                    onChange={(file) => {
                                        if (file) {
                                            const newfile = file;
                                            const updated = [...variations];
                                            updated[index].image = newfile;       // Store actual File for backend
                                            // updated[index].preview = file.url; // ImageUploader already builds url
                                            updateField(field.name, updated);
                                            console.log(file, variation);

                                        }
                                    }}
                                    className="border rounded h-60 !max-h-60 min-h-auto"
                                />


                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const updated = variations.filter((_, i) => i !== index);
                                    updateField(field.name, updated);
                                }}
                                className="bg-red-500 size-8 text-white rounded"
                            >
                                ✕
                            </button>
                        </div>

                    </div>
                ))}

                <span
                    type="button"
                    onClick={() =>
                        updateField(field.name, [
                            ...variations,
                            { size: "", color: "", price: "", image: "" },
                        ])
                    }
                    className="bg-primary text-white px-4 py-2 rounded mt-2"
                >
                    + Add Variation
                </span>
            </div>
        );
    }
    if (field.type === 'repeater') {
        return (
            <Repeater />
        )
    }
    return null;
};

export default FieldControls;
