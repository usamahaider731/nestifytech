import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Textarea from '@/Components/Textarea';
import PhoneInput from '@/Components/Admin/PhoneInput';
import Repeater from '@/Components/Admin/Repeater';
import { router, useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/Admin/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DropdownSelect from '@/Components/DropdownSelect';
import ImageUploader from '@/Components/Admin/ImageUploader';
import axios from 'axios';
import Checkbox from '@/Components/Admin/Checkbox';
import Togglebox from '@/Components/Admin/Togglebox';
import ColorTypeSelector from '@/Components/Admin/ColorTypeSelector';
import { ColorAppearanceMockup, normalizeAppearanceColors } from '@/Components/Admin/ColorAppearancePreview';
import { buildPalettesFromTypes } from '@/Utils/colorPalettes';
import { applyThemeColors, extractColorPayload } from '@/Utils/applyThemeColors';

function Form({ Data = [], name = '', link = '', type = '', colorPalettes = {} }) {
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const [savingThemes, setSavingThemes] = useState(false);
    const persistTimerRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm(() => {
        const initial = {};
        Object.entries(Data).forEach(([key, setting]) => {
            let val = setting.value;
            if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                try {
                    val = JSON.parse(val);
                } catch (e) { }
            }
            initial[key] = val;
        });
        return initial;
    });

    const hasColorTypeField = Object.values(Data).some((setting) => setting.type === 'color_type');
    const dataEntries = Object.entries(Data);
    const colorTypesEntries = dataEntries.filter(([key, setting]) => key === 'color_types' || (setting.type === 'repeater' && key === 'color_types'));
    const colorTypeEntries = dataEntries.filter(([, setting]) => setting.type === 'color_type');
    const colorEntries = dataEntries.filter(([, setting]) => setting.type === 'color');
    const colorKeys = useMemo(() => colorEntries.map(([key]) => key), [colorEntries]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (hasColorTypeField) {
            setSavingThemes(true);
            router.post(route('setting.update', { type: name }), {
                color_types: data.color_types,
            }, {
                preserveScroll: true,
                onFinish: () => setSavingThemes(false),
            });
            return;
        }

        post(route('setting.update', { type: name }), {
            preserveScroll: true,
        });
    };

    const handleChange = (e, key) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setData(key, value);
    };

    const handleDropdownChange = (value, key) => {
        setData(key, value);
    };

    const applyAndPersistColors = useCallback((nextData) => {
        const payload = extractColorPayload(nextData, colorKeys);
        applyThemeColors(payload);

        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = setTimeout(async () => {
            try {
                await axios.post(route('setting.update.colors', { type: name }), payload);
            } catch (error) {
                console.error('Failed to save active colors:', error);
            }
        }, 350);
    }, [colorKeys, name]);

    const handleColorTypeChange = (typeKey, paletteColors) => {
        const next = { ...data, color_type: typeKey };
        Object.entries(paletteColors).forEach(([colorKey, colorValue]) => {
            if (Object.prototype.hasOwnProperty.call(data, colorKey)) {
                next[colorKey] = colorValue;
            }
        });
        setData(next);
        applyAndPersistColors(next);
    };

    const handleColorValueChange = (key, value) => {
        const next = { ...data, [key]: value };
        setData(next);
        applyAndPersistColors(next);
    };

    const dynamicColorPalettes = useMemo(
        () => buildPalettesFromTypes(data.color_types || []),
        [data.color_types]
    );
    const activeColorPalettes = Object.keys(dynamicColorPalettes).length > 0
        ? dynamicColorPalettes
        : colorPalettes;

    const activeAppearanceColors = useMemo(() => {
        const colors = {};
        colorEntries.forEach(([key]) => {
            if (data[key]) {
                colors[key] = data[key];
            }
        });
        return normalizeAppearanceColors(colors);
    }, [colorEntries, data]);

    const otherEntries = dataEntries.filter(([key, setting]) => {
        if (setting.type === 'color_type' || setting.type === 'color') return false;
        if (key === 'color_types') return false;
        return true;
    });

    const renderSettingField = (key, setting) => (
        <div
            className={`
                ${(setting.type === 'text' || setting.type === 'phone' || setting.type === 'dropdown' || setting.type === 'image') && ((setting.style && setting.style == 2) ? 'col-span-4' : 'col-span-2')} 
                ${setting.type === 'color' && 'col-span-1'} 
                ${setting.type === 'color_type' && 'col-span-4'}
                ${setting.type === 'textarea' && 'col-span-4'}
                ${setting.type === 'repeater' && 'col-span-4'}
                ${setting.type === 'checkbox' && 'col-span-4 flex-col gap-3'}
                flex flex-col gap-2
            `}
            key={key}
        >
            <InputLabel
                value={setting.label}
                className='text-base capitalize text-res'
                htmlFor={key}
            />

            {(setting.type === 'text' && !setting.depend_on) && (
                <TextInput
                    id={key}
                    name={key}
                    value={data[key] || ''}
                    className='w-full'
                    placeholder={setting.placeholder ?? ''}
                    onChange={(e) => handleChange(e, key)}
                    error={errors[key]}
                />
            )}

            {setting.type === 'phone' && (
                <PhoneInput
                    id={key}
                    name={key}
                    value={data[key] || ''}
                    className='w-full'
                    onChange={(phone) => setData(key, phone)}
                    error={errors[key]}
                />
            )}

            {setting.type === 'repeater' && (
                <Repeater
                    id={key}
                    name={key}
                    value={data[key] || []}
                    onChange={(val) => setData(key, val)}
                    label={setting.label}
                    fields={setting.fields || []}
                    dropdownOptions={dropdownOptions}
                    loadingStates={loadingStates}
                />
            )}

            {(setting.type === 'text' && setting.depend_on) && (
                <TextInput
                    id={key}
                    name={key}
                    readOnly={true}
                    placeholder={setting.placeholder ?? ''}
                    value={data[key] || ''}
                    className='w-full'
                    onChange={(e) => handleChange(e, key)}
                    error={errors[key]}
                />
            )}

            {setting.type === 'textarea' && (
                <Textarea
                    id={key}
                    name={key}
                    placeholder={setting.placeholder ?? ''}
                    className='bg-transparent rounded outline-0 ring-0 border-secondary text-heading focus:ring-0 focus:outline-0 focus:border-secondary'
                    value={data[key] || ''}
                    onChange={(e) => handleChange(e, key)}
                    error={errors[key]}
                />
            )}

            {setting.type === 'color_type' && (
                <ColorTypeSelector
                    value={data[key] || ''}
                    palettes={activeColorPalettes}
                    onChange={handleColorTypeChange}
                />
            )}

            {setting.type === 'color' && (
                <div className='flex items-center gap-3 rounded-xl border border-secondary/30 bg-permanent/20 p-2'>
                    <input
                        id={key}
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(data[key] || '') ? data[key] : '#000000'}
                        className='border-0 p-0 h-10 w-10 rounded-lg cursor-pointer shrink-0'
                        onChange={(e) => handleColorValueChange(key, e.target.value)}
                    />
                    <TextInput
                        value={data[key] || ''}
                        className='flex-1 font-mono text-sm'
                        placeholder="#000000"
                        onChange={(e) => handleColorValueChange(key, e.target.value)}
                    />
                    <span
                        className='size-10 rounded-lg border border-white/10 shadow-sm shrink-0'
                        style={{ backgroundColor: data[key] || 'transparent' }}
                    />
                </div>
            )}

            {setting.type === 'dropdown' && (
                <DropdownSelect
                    id={key}
                    name={key}
                    value={data[key]}
                    className='w-full'
                    options={processOptions(setting.options)}
                    onChange={(value) => handleDropdownChange(value, key)}
                    error={errors[key]}
                    searchable={setting.searchable ?? true}
                    
                    isLoading={loadingStates[key]}
                    disabled={processing}
                />
            )}

            {setting.type === 'checkbox' && (
                <div className='flex gap-2'>
                    <Togglebox
                        id={key}
                        name={key}
                        checked={data[key] || false}
                        onChange={(e) => handleChange(e, key)}
                        className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                    />
                    <InputLabel htmlFor={key} className='text-base capitalize text-res'>
                        {setting.value_label ?? setting.label}
                    </InputLabel>
                </div>
            )}

            {setting.type === 'image' && (
                <div key={key} className=''>
                    <ImageUploader
                        name={key}
                        value={setting.value}
                        onChange={(value) => handleChange({ target: { value } }, key)}
                    />
                </div>
            )}

            {errors[key] && (
                <p className='text-sm text-red-600'>{errors[key]}</p>
            )}
        </div>
    );

    const processOptions = (options) => {
        if (!options) return [];

        // Case 1: Static options provided as array
        if (Array.isArray(options)) {
            return options;
        }
        // Case 2: Static options provided as object (like font example)
        if (typeof options === 'object' && !options.model) {
            return Object.values(options).map(option => ({
                id: option.id ?? option.value,
                title: option.title ?? option.label
            }));
        }

        // Case 3: Dynamic options from API
        if (options?.model && options?.type) {
            return dropdownOptions[options.type] || [];
        }

        return [];
    };

    const fetchDynamicOptions = async () => {
        const optionsToFetch = {};

        // Identify dropdown fields that need dynamic options
        Object.entries(Data).forEach(([key, setting]) => {
            if (setting.type === 'dropdown' && setting.options?.model) {
                optionsToFetch[key] = setting.options;
                setLoadingStates(prev => ({ ...prev, [key]: true }));
            }
            // Check for repeaters
            if (setting.type === 'repeater' && setting.fields) {
                setting.fields.forEach(f => {
                    if (f.type === 'dropdown' && f.options?.model) {
                        optionsToFetch[f.name] = f.options;
                        setLoadingStates(prev => ({ ...prev, [f.name]: true }));
                    }
                });
            }
        });

        // Fetch each dynamic option
        for (const [key, optionsConfig] of Object.entries(optionsToFetch)) {
            try {
                const endpoint = optionsConfig.model === 'Menu' ? `/api/menu-locations` : `/api/taxonomy-options/${optionsConfig.type}`;
                const response = await axios.get(
                    endpoint,
                    {
                        params: {
                            use_value: optionsConfig.use_value || false,
                            meta: optionsConfig.meta || null
                        }
                    }
                );

                setDropdownOptions(prev => ({
                    ...prev,
                    [key]: (response.data).map((value => ({
                        id: value.id,
                        title: value.title
                    })))
                }));
                // Also set by config's own name if inside a repeater
                const optionKey = optionsConfig.type || key;
                setDropdownOptions(prev => ({
                    ...prev,
                    [optionKey]: (response.data).map((value => ({
                        id: value.id,
                        title: value.title
                    })))
                }));
            } catch (error) {
                console.error(`Failed to fetch options for ${key}:`, error);
                setDropdownOptions(prev => ({
                    ...prev,
                    [optionsConfig.type]: []
                }));
            } finally {
                setLoadingStates(prev => ({ ...prev, [key]: false }));
            }
        }
    };
    useEffect(() => {
        fetchDynamicOptions();
    }, [Data]);

    useEffect(() => {
        if (!hasColorTypeField) {
            return undefined;
        }

        applyThemeColors(extractColorPayload(data, colorKeys));

        return () => clearTimeout(persistTimerRef.current);
    }, [hasColorTypeField, colorKeys]);

    return (
        <div className='flex items-center px-6 py-10 w-full'>
            <form
                onSubmit={handleSubmit}
                className='w-full shadow-xl mx-auto bg-accent rounded-2xl px-5 py-5 gap-y-5 flex flex-col'

            >
                <div className='h-11 w-full flex items-center pb-3 px-5'>
                    <h4 className='text-2xl font-medium text-heading font-oswald capitalize'>
                        {name} Settings
                    </h4>
                </div>

                <div className='grid grid-cols-4 w-full gap-5 p-5'>
                    {otherEntries.map(([key, setting]) => renderSettingField(key, setting))}

                    {colorTypesEntries.length > 0 && (
                        <div className='col-span-4 space-y-4'>
                            {colorTypesEntries.map(([key, setting]) => renderSettingField(key, setting))}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-secondary/20">
                                <p className="text-sm text-res">Save to store theme definitions in the repeater list.</p>
                                <PrimaryButton
                                    type="submit"
                                    className='min-w-32 flex items-center bg-primary justify-center h-9'
                                    disabled={savingThemes || processing}
                                >
                                    {savingThemes || processing ? 'Saving...' : 'Save Themes'}
                                </PrimaryButton>
                            </div>
                        </div>
                    )}

                    {colorTypeEntries.map(([key, setting]) => (
                        <div key={key} className="col-span-4 space-y-2">
                            {renderSettingField(key, setting)}
                            <p className="text-xs text-res italic px-1">Appearance applies instantly — no save needed.</p>
                        </div>
                    ))}

                    {hasColorTypeField && (
                        <div className="col-span-4 rounded-2xl border border-secondary/30 bg-permanent/20 p-5">
                            <h5 className="text-lg font-medium text-heading capitalize mb-1">Live Color Appearance</h5>
                            <p className="text-sm text-res mb-4">Preview updates as you select a theme or change color variations.</p>
                            <div className="max-w-md mx-auto">
                                <ColorAppearanceMockup colors={activeAppearanceColors} />
                            </div>
                        </div>
                    )}

                    {hasColorTypeField && colorEntries.length > 0 && (
                        <div className='col-span-4 pt-2 border-t border-secondary/30'>
                            <h5 className='text-lg font-medium text-heading capitalize mb-1'>Customize Color Variations</h5>
                            <p className='text-sm text-res mb-4'>Fine-tune each color — changes apply instantly across the app.</p>
                            <div className='grid grid-cols-4 gap-5'>
                                {colorEntries.map(([key, setting]) => renderSettingField(key, setting))}
                            </div>
                        </div>
                    )}

                    {!hasColorTypeField && colorEntries.map(([key, setting]) => renderSettingField(key, setting))}
                </div>

                {!hasColorTypeField && (
                    <div className="flex justify-end px-5 pb-5">
                        <PrimaryButton
                            type="submit"
                            className='max-w-28 flex items-center bg-primary justify-center h-9'
                            disabled={processing}
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </PrimaryButton>
                    </div>
                )}
            </form>
        </div>
    );
}

export default Form;