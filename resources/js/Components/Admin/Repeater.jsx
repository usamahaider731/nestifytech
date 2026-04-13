import React from 'react';
import TextInput from '../TextInput';
import Textarea from '../Textarea';
import ImageUploader from './ImageUploader';
import DropdownSelect from '../DropdownSelect';
import PhoneInput from '../PhoneInput';
import InputLabel from '../InputLabel';
import Togglebox from '@/Components/Togglebox';
import { RiAddLine, RiDeleteBinLine, RiArrowUpLine, RiArrowDownLine, RiFileCopyLine } from 'react-icons/ri';

/**
 * Repeater component that renders multiple fields per row based on a JSON config.
 * 
 * @param {Array} value - Current array of objects (rows).
 * @param {Function} onChange - Callback function to update the array.
 * @param {String} label - Section label.
 * @param {Array} fields - JSON config for the fields in each row.
 * @param {Object} dropdownOptions - Map of dynamic options fetched by the parent.
 * @param {Object} loadingStates - Map of loading states for dynamic fields.
 * @param {Function} normalizeImageValue - Function to normalize image values for ImageUploader.
 */
function Repeater({ value = [], onChange, label = "Item", fields = [], dropdownOptions = {}, loadingStates = {} }) {
    // Ensure value is an array
    const items = Array.isArray(value) ? value : [];

    const addItem = () => {
        const newItem = {};
        fields.forEach(f => {
            newItem[f.name] = f.value !== undefined ? f.value : (f.type === 'image' || f.type === 'dropdown' && f.multiple ? [] : '');
        });
        onChange([...items, newItem]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    const handleFieldChange = (index, fieldName, newValue) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [fieldName]: newValue };
        onChange(newItems);
    };

    const duplicateItem = (index) => {
        const itemToCopy = { ...items[index] };
        // If image field exists, we should decide if we want to copy the image too.
        // Usually, copying the current state is the goal.
        const newItems = [...items];
        newItems.splice(index + 1, 0, itemToCopy);
        onChange(newItems);
    };

    const moveItem = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === items.length - 1)) return;
        const newItems = [...items];
        const [moved] = newItems.splice(index, 1);
        newItems.splice(index + direction, 0, moved);
        onChange(newItems);
    };

    const renderField = (item, field, index) => {
        const commonProps = {
            id: `${field.name}-${index}`,
            name: field.name,
            value: item[field.name] || '',
            onChange: (e) => handleFieldChange(index, field.name, e.target.value),
            placeholder: field.placeholder || field.label,
        };

        switch (field.type) {
            case 'text':
            case 'number':
                return <TextInput {...commonProps} />;
            
            case 'textarea':
                return <Textarea {...commonProps} className="bg-transparent border-secondary w-full rounded" />;
            
            case 'phone':
                return (
                    <PhoneInput
                        value={item[field.name] || ''}
                        onChange={(val) => handleFieldChange(index, field.name, val)}
                        className="w-full"
                    />
                );

            case 'image':
                return (
                    <ImageUploader
                        name={`${field.name}-${index}`}
                        value={item[field.name]}
                        multiple={!!field.multiple}
                        onChange={(val) => handleFieldChange(index, field.name, val)}
                    />
                );
            
            case 'dropdown':
                const options = Array.isArray(field.options) ? field.options : (dropdownOptions[field.name] || dropdownOptions[field.options?.type] || []);
                return (
                    <DropdownSelect
                        {...commonProps}
                        options={options}
                        isLoading={loadingStates[field.name]}
                        onChange={(val) => handleFieldChange(index, field.name, val)}
                    />
                );

            case 'checkbox':
                return (
                    <div className="flex items-center gap-2">
                        <Togglebox
                            checked={!!item[field.name]}
                            onChange={(e) => handleFieldChange(index, field.name, e.target.checked)}
                        />
                        <span className="text-res text-xs">{field.value_label || field.label}</span>
                    </div>
                );

            case 'repeater':
                return (
                    <div className="w-full">
                        <Repeater
                            value={item[field.name] || []}
                            onChange={(val) => handleFieldChange(index, field.name, val)}
                            label={field.label}
                            fields={field.fields || []}
                            dropdownOptions={dropdownOptions}
                            loadingStates={loadingStates}
                        />
                    </div>
                );

            default:
                return <TextInput {...commonProps} />;
        }
    };

    return (
        <div className="flex flex-col gap-5 w-full bg-dynamic/10 p-5 rounded-xl border border-secondary/20 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-secondary/10">
                <span className="text-lg font-medium text-heading font-oswald">{label} List</span>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 bg-primary text-heading px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                    <RiAddLine size={20} /> Add New {label}
                </button>
            </div>

            {items.length === 0 ? (
                <div className="py-8 text-center bg-white/5 rounded-lg border border-dashed border-secondary/30">
                    <p className="text-res text-base italic">No {label.toLowerCase()} items added yet. Click "Add New" to get started.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {items.map((item, index) => (
                        <div key={index} className="relative group bg-accent/40 p-6 rounded-xl border border-secondary/20 hover:border-primary/30 transition-all">
                            <div className="absolute -top-3 -right-3">
                                <div className="flex gap-2">
                                    <button
                                        title="Move Up"
                                        type="button"
                                        onClick={() => moveItem(index, -1)}
                                        disabled={index === 0}
                                        className={`p-2 rounded bg-accent/20 text-res hover:text-primary transition-colors disabled:opacity-30`}
                                    >
                                        <RiArrowUpLine size={18} />
                                    </button>
                                    <button
                                        title="Move Down"
                                        type="button"
                                        onClick={() => moveItem(index, 1)}
                                        disabled={index === items.length - 1}
                                        className={`p-2 rounded bg-accent/20 text-res hover:text-primary transition-colors disabled:opacity-30`}
                                    >
                                        <RiArrowDownLine size={18} />
                                    </button>
                                    <button
                                        title="Duplicate"
                                        type="button"
                                        onClick={() => duplicateItem(index)}
                                        className="p-2 rounded bg-accent/20 text-res hover:text-blue-500 transition-colors"
                                    >
                                        <RiFileCopyLine size={18} />
                                    </button>
                                    <button
                                        title="Remove"
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="p-2 rounded bg-accent/20 text-res hover:text-red-500 transition-colors"
                                    >
                                        <RiDeleteBinLine size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {fields.map((field) => (
                                    <div key={field.name} className={`flex flex-col gap-2 ${field.type === 'textarea' || field.type === 'image' || field.type === 'repeater' ? 'md:col-span-2' : ''}`}>
                                        <InputLabel className="text-heading text-sm font-medium">{field.label}</InputLabel>
                                        {renderField(item, field, index)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Repeater;