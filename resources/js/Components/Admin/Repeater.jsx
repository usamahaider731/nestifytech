import React, { useEffect, useState } from 'react';
import TextInput from '../TextInput';
import Textarea from '../Textarea';
import ImageUploader from './ImageUploader';
import DropdownSelect from '../DropdownSelect';
import PhoneInput from './PhoneInput';
import InputLabel from '../InputLabel';
import Togglebox from '@/Components/Togglebox';
import {
    RiAddLine,
    RiDeleteBinLine,
    RiArrowUpLine,
    RiArrowDownLine,
    RiFileCopyLine,
    RiArrowDownSLine,
} from 'react-icons/ri';
import { ColorAppearanceMockup } from '@/Components/Admin/ColorAppearancePreview';

function Repeater({ value = [], onChange, label = "Item", fields = [], dropdownOptions = {}, loadingStates = {} }) {
    const items = Array.isArray(value) ? value : [];
    const [expandedItems, setExpandedItems] = useState(() => new Set());

    useEffect(() => {
        setExpandedItems((prev) => {
            const next = new Set();
            prev.forEach((index) => {
                if (index < items.length) {
                    next.add(index);
                }
            });
            return next;
        });
    }, [items.length]);

    const getItemTitle = (item, index) => {
        const titleField = fields.find((field) => field.name === 'label')
            || fields.find((field) => field.type === 'text');
        const title = item[titleField?.name];
        return title ? String(title) : `${label} #${index + 1}`;
    };

    const getItemSwatch = (item) => {
        const colorField = fields.find((field) => field.name === 'primary' && field.type === 'color')
            || fields.find((field) => field.type === 'color');
        const swatch = item[colorField?.name];
        return typeof swatch === 'string' && swatch.startsWith('#') ? swatch : null;
    };

    const getItemAppearanceColors = (item) => {
        const colors = {};
        fields.filter((field) => field.type === 'color').forEach((field) => {
            if (item[field.name]) {
                colors[field.name] = item[field.name];
            }
        });
        return colors;
    };

    const hasAppearancePreview = fields.some((field) => field.type === 'color');

    const toggleItem = (index) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const addItem = () => {
        const newItem = {};
        fields.forEach((field) => {
            newItem[field.name] = field.value !== undefined
                ? field.value
                : (field.type === 'image' || (field.type === 'dropdown' && field.multiple) ? [] : '');
        });

        onChange([...items, newItem]);
        setExpandedItems((prev) => new Set([...prev, items.length]));
    };

    const removeItem = (index) => {
        onChange(items.filter((_, i) => i !== index));
        setExpandedItems((prev) => {
            const next = new Set();
            prev.forEach((itemIndex) => {
                if (itemIndex < index) {
                    next.add(itemIndex);
                } else if (itemIndex > index) {
                    next.add(itemIndex - 1);
                }
            });
            return next;
        });
    };

    const handleFieldChange = (index, fieldName, newValue) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [fieldName]: newValue };
        onChange(newItems);
    };

    const duplicateItem = (index) => {
        const itemToCopy = { ...items[index] };
        const newItems = [...items];
        newItems.splice(index + 1, 0, itemToCopy);
        onChange(newItems);
        setExpandedItems((prev) => {
            const next = new Set();
            prev.forEach((itemIndex) => {
                next.add(itemIndex >= index + 1 ? itemIndex + 1 : itemIndex);
            });
            next.add(index + 1);
            return next;
        });
    };

    const moveItem = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === items.length - 1)) return;

        const newItems = [...items];
        const [moved] = newItems.splice(index, 1);
        const targetIndex = index + direction;
        newItems.splice(targetIndex, 0, moved);
        onChange(newItems);

        setExpandedItems((prev) => {
            const next = new Set();
            prev.forEach((itemIndex) => {
                if (itemIndex === index) {
                    next.add(targetIndex);
                } else if (direction === -1 && itemIndex === targetIndex) {
                    next.add(index);
                } else if (direction === 1 && itemIndex === targetIndex) {
                    next.add(index);
                } else {
                    next.add(itemIndex);
                }
            });
            return next;
        });
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

            case 'dropdown': {
                const options = Array.isArray(field.options)
                    ? field.options
                    : (dropdownOptions[field.name] || dropdownOptions[field.options?.type] || []);
                return (
                    <DropdownSelect
                        {...commonProps}
                        options={options}
                        isLoading={loadingStates[field.name]}
                        onChange={(val) => handleFieldChange(index, field.name, val)}
                    />
                );
            }

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

            case 'color':
                return (
                    <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-permanent/20 p-2">
                        <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(item[field.name] || '') ? item[field.name] : (field.value || '#000000')}
                            className="border-0 p-0 h-9 w-9 rounded cursor-pointer shrink-0"
                            onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
                        />
                        <TextInput
                            value={item[field.name] || ''}
                            className="flex-1 font-mono text-sm"
                            placeholder={field.value || '#000000'}
                            onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
                        />
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
                <div className="flex flex-col gap-4">
                    {items.map((item, index) => {
                        const isExpanded = expandedItems.has(index);
                        const swatch = getItemSwatch(item);

                        return (
                            <div
                                key={index}
                                className="relative group bg-accent/40 rounded-xl border border-secondary/20 hover:border-primary/30 transition-all overflow-hidden"
                            >
                                <div className="flex items-center gap-3 p-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleItem(index)}
                                        className="flex flex-1 items-center gap-3 text-left min-w-0"
                                    >
                                        {hasAppearancePreview ? (
                                            <ColorAppearanceMockup
                                                colors={getItemAppearanceColors(item)}
                                                compact
                                            />
                                        ) : swatch ? (
                                            <span
                                                className="block size-9 rounded-full border-2 border-white/20 shadow-sm shrink-0"
                                                style={{ backgroundColor: swatch }}
                                            />
                                        ) : null}
                                        <span className="font-medium text-heading capitalize truncate">
                                            {getItemTitle(item, index)}
                                        </span>
                                        <RiArrowDownSLine
                                            className={`text-xl text-res shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            title="Move Up"
                                            type="button"
                                            onClick={() => moveItem(index, -1)}
                                            disabled={index === 0}
                                            className="p-2 rounded bg-accent/20 text-res hover:text-primary transition-colors disabled:opacity-30"
                                        >
                                            <RiArrowUpLine size={18} />
                                        </button>
                                        <button
                                            title="Move Down"
                                            type="button"
                                            onClick={() => moveItem(index, 1)}
                                            disabled={index === items.length - 1}
                                            className="p-2 rounded bg-accent/20 text-res hover:text-primary transition-colors disabled:opacity-30"
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

                                {isExpanded && (
                                    <div className="px-4 pb-5 pt-0 border-t border-secondary/10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                                            {fields.map((field) => (
                                                <div
                                                    key={field.name}
                                                    className={`flex flex-col gap-2 ${field.type === 'textarea' || field.type === 'image' || field.type === 'repeater' || field.type === 'color' ? 'md:col-span-2' : ''}`}
                                                >
                                                    <InputLabel className="text-heading text-sm font-medium">{field.label}</InputLabel>
                                                    {renderField(item, field, index)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Repeater;
