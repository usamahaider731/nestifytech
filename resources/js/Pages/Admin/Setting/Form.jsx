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
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

function Form({ Data = [], name = '', link = '', type = '', colorPalettes = {} }) {
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const [savingThemes, setSavingThemes] = useState(false);
    const [showPassword, setShowPassword] = useState({});
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

    // Group fields into tabs if sections exist (e.g. Payment gateways, WhatsApp, etc.)
    const sections = useMemo(() => {
        const list = [];
        let currentSection = null;

        dataEntries.forEach(([key, setting]) => {
            if (setting.type === 'color_type' || setting.type === 'color' || key === 'color_types') return;

            if (setting.type === 'section') {
                currentSection = {
                    key,
                    setting,
                    fields: [],
                };
                list.push(currentSection);
            } else if (currentSection) {
                currentSection.fields.push([key, setting]);
            }
        });

        return list;
    }, [dataEntries]);

    const hasSections = sections.length > 0;
    const [activeTab, setActiveTab] = useState(() => (sections[0]?.key || ''));

    useEffect(() => {
        if (hasSections && (!activeTab || !sections.some(s => s.key === activeTab))) {
            setActiveTab(sections[0]?.key || '');
        }
    }, [hasSections, sections]);

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

    // Evaluate if a field should be shown based on condition: { field: 'some_key', value: true }
    const isFieldVisible = (setting) => {
        if (!setting.condition) return true;
        const targetValue = data[setting.condition.field];
        if (setting.condition.value !== undefined) {
            return targetValue === setting.condition.value;
        }
        return !!targetValue;
    };

    const renderSettingField = (key, setting) => {
        if (!isFieldVisible(setting)) return null;

        // Render standalone section card (only when tabs aren't in use)
        if (setting.type === 'section') {
            const isEnabled = setting.toggle_field ? !!data[setting.toggle_field] : true;
            return (
                <div key={key} className="col-span-4 mt-2 border border-secondary/20 rounded-2xl p-5 bg-permanent/10 shadow-sm transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-secondary/20">
                        <div className="flex items-center gap-3">
                            {setting.icon && (
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <i className={`${setting.icon} text-xl`} />
                                </div>
                            )}
                            <div>
                                <h5 className="text-base font-semibold text-heading">{setting.label}</h5>
                                {setting.description && (
                                    <p className="text-xs text-res mt-0.5">{setting.description}</p>
                                )}
                            </div>
                        </div>

                        {setting.toggle_field && (
                            <div className="flex items-center gap-2.5 bg-bg/60 px-3 py-1.5 rounded-xl border border-secondary/20">
                                <span className={`text-xs font-semibold ${isEnabled ? 'text-primary' : 'text-res'}`}>
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <Togglebox
                                    id={setting.toggle_field}
                                    name={setting.toggle_field}
                                    checked={!!data[setting.toggle_field]}
                                    onChange={(e) => handleChange(e, setting.toggle_field)}
                                    className="h-4 w-4"
                                />
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
        <div
            className={`
                ${(setting.type === 'text' || setting.type === 'password' || setting.type === 'number' || setting.type === 'phone' || setting.type === 'dropdown' || setting.type === 'image') && ((setting.style && setting.style == 2) ? 'col-span-4' : 'col-span-2')} 
                ${setting.type === 'color' && 'col-span-1'} 
                ${setting.type === 'color_type' && 'col-span-4'}
                ${setting.type === 'textarea' && 'col-span-4'}
                ${setting.type === 'repeater' && 'col-span-4'}
                ${setting.type === 'checkbox' && 'col-span-4 flex-col gap-3'}
                flex flex-col gap-2 transition-all
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

            {setting.type === 'number' && (
                <TextInput
                    id={key}
                    name={key}
                    type="number"
                    value={data[key] ?? ''}
                    className='w-full'
                    placeholder={setting.placeholder ?? ''}
                    onChange={(e) => handleChange(e, key)}
                    error={errors[key]}
                />
            )}

            {setting.type === 'password' && (
                <div className="relative w-full">
                    <TextInput
                        id={key}
                        name={key}
                        type={showPassword[key] ? 'text' : 'password'}
                        value={data[key] || ''}
                        className='w-full pr-10'
                        placeholder={setting.placeholder ?? ''}
                        onChange={(e) => handleChange(e, key)}
                        error={errors[key]}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-res hover:text-heading transition-colors cursor-pointer"
                        tabIndex={-1}
                    >
                        {showPassword[key] ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                </div>
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
    };

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
                // Determine the correct API endpoint based on the model type
                let endpoint;
                const modelName = (optionsConfig.model || '').split('\\').pop().toLowerCase();
                if (modelName === 'menu') {
                    endpoint = `/api/menu-locations`;
                } else if (modelName === 'roles' || optionsConfig.type === 'role') {
                    endpoint = `/api/roles-options`;
                } else if (optionsConfig.type === 'attribute') {
                    endpoint = `/api/attribute-options`;
                } else {
                    endpoint = `/api/taxonomy-options/${optionsConfig.type}`;
                }
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

                {hasSections ? (
                    <div className="w-full flex flex-col gap-6 px-5">
                        {/* Gateway Tabs Header */}
                        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-bg/50 border border-secondary/20">
                            {sections.map(({ key, setting }) => {
                                const isEnabled = setting.toggle_field ? !!data[setting.toggle_field] : true;
                                const isActive = activeTab === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setActiveTab(key)}
                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                                            isActive
                                                ? 'bg-primary text-white shadow-md shadow-primary/25'
                                                : 'text-res hover:text-heading hover:bg-permanent/30'
                                        }`}
                                    >
                                        {setting.icon && <i className={`${setting.icon} text-lg`} />}
                                        <span>{setting.label?.replace(/ Payments| Gateway| Mass Payouts & Checkout/i, '') || setting.label}</span>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                                                isEnabled
                                                    ? isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                    : isActive
                                                    ? 'bg-black/20 text-white/70'
                                                    : 'bg-res/10 text-res/70 border border-res/20'
                                            }`}
                                        >
                                            {isEnabled ? 'Active' : 'Off'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Section Tab Card */}
                        {sections
                            .filter(({ key }) => key === activeTab)
                            .map(({ key, setting, fields }) => {
                                const isEnabled = setting.toggle_field ? !!data[setting.toggle_field] : true;
                                return (
                                    <div
                                        key={key}
                                        className="border border-secondary/20 rounded-2xl p-6 bg-permanent/10 shadow-sm flex flex-col gap-6"
                                    >
                                        {/* Gateway Banner / Header with Master Toggle */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-secondary/20">
                                            <div className="flex items-center gap-3.5">
                                                {setting.icon && (
                                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                                        <i className={`${setting.icon} text-2xl`} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h5 className="text-lg font-semibold text-heading">{setting.label}</h5>
                                                    {setting.description && (
                                                        <p className="text-xs text-res mt-0.5 max-w-xl">{setting.description}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {setting.toggle_field && (
                                                <div className="flex items-center gap-3 bg-bg/80 px-4 py-2 rounded-xl border border-secondary/20 shrink-0">
                                                    <span className={`text-xs font-semibold uppercase tracking-wider ${isEnabled ? 'text-primary' : 'text-res'}`}>
                                                        {isEnabled ? 'Gateway Enabled' : 'Gateway Disabled'}
                                                    </span>
                                                    <Togglebox
                                                        id={setting.toggle_field}
                                                        name={setting.toggle_field}
                                                        checked={!!data[setting.toggle_field]}
                                                        onChange={(e) => handleChange(e, setting.toggle_field)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Fields List */}
                                        {!isEnabled ? (
                                            <div className="py-10 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-secondary/20 rounded-xl bg-bg/20">
                                                <i className="ri-toggle-line text-3xl text-res/50" />
                                                <p className="text-sm font-medium text-heading">This gateway is currently disabled.</p>
                                                <p className="text-xs text-res">Toggle the switch above to enable and configure its credentials.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-4 gap-5">
                                                {fields.map(([fieldKey, fieldSetting]) => renderSettingField(fieldKey, fieldSetting))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                ) : (
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
                )}

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