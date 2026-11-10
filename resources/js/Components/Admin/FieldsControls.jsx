import React, { useEffect } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Togglebox from '@/Components/Togglebox';
import ImageUploader from '@/Components/Admin/ImageUploader';
import DescriptionEditor from '@/Components/Admin/DescriptionEditor';
import DropdownSelect from '@/Components/DropdownSelect';
import CustomFields from './CustomFields';
import SecondaryDropdown from './SecondaryDropdown';
import PrimaryDropdown from '../PrimaryDropdown';
import MultipleDropdown from './MultipleDropdown';
import DynamicOptions from './DynamicOptions';
import InputField from './InputField';
import Textarea from '../Textarea';
import Repeater from './Repeater';
import DateRangePicker from './Calendar';
import PhoneInput from './PhoneInput';
import AttributesSelector from './AttributesSelector';
import PermissionMatrix from './PermissionMatrix';
import VariationsSelector from './VariationsSelector';
import MapField from './MapField';

const FieldControls = ({
    field,
    data,
    updateField,
    rolesList,
    normalizeImageValue,
    onChange,
    dropdownOptions,
    loadingStates,
    id = null
}) => {
    const getNestedValue = (obj, path) => {
        if (!path.includes('.')) return obj[path];
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const colSpan =
        field.style === 2 ? (field.type === 'checkbox' ? 'col-span-1' : 'col-span-6') :
            field.type === 'checkbox' ? 'col-span-2' : 'col-span-3';

    const processOptions = (options, name) => {
        if (!options) return [];
        if (Array.isArray(options)) return options;
        if (options?.model) {
            return dropdownOptions[name] || [];
        }
        return [];
    };

    const resolveOptionTitle = (fieldName, raw) => {
        if (raw == null || raw === '') return '';
        const first = Array.isArray(raw) ? raw[0] : raw;
        if (first && typeof first === 'object') {
            return first.title || first.name || first.label || '';
        }
        const opts = dropdownOptions?.[fieldName] || [];
        const match = opts.find((opt) =>
            String(opt.id ?? opt.value ?? '') === String(first)
            || String(opt.title ?? opt.name ?? '') === String(first)
        );
        return match?.title || match?.name || match?.label || (typeof first === 'string' && !/^\d+$/.test(first) ? first : '');
    };

    const applyCoordinates = (coords, fieldOptions = {}) => {
        if (fieldOptions.location_field) {
            updateField(fieldOptions.location_field, coords || '');
        }
        if (Array.isArray(coords) && coords.length >= 2) {
            const [lng, lat] = coords;
            if (fieldOptions.lng_field) updateField(fieldOptions.lng_field, lng);
            if (fieldOptions.lat_field) updateField(fieldOptions.lat_field, lat);
        } else if (!coords) {
            if (fieldOptions.lng_field) updateField(fieldOptions.lng_field, '');
            if (fieldOptions.lat_field) updateField(fieldOptions.lat_field, '');
        }
    };
    let fieldClass = '';
    if (field.condition) {
        let isVisible = false;

        // Custom condition: check if user has a store-scoped role selected
        if (field.condition === 'has_store_role') {
            const selectedRoleIds = Array.isArray(data.roles) ? data.roles.map(String) : [];
            const selectedRoles = rolesList.filter(r => selectedRoleIds.includes(String(r.id)));
            isVisible = selectedRoles.some(r => (r.scope === 'store') || /store|delivery/i.test(r.title));
        } else if (typeof field.condition === 'object' && field.condition !== null) {
            const targetVal = data[field.condition.field];
            const expectedVal = field.condition.value;
            if (field.condition.operator === 'in' && Array.isArray(expectedVal)) {
                isVisible = expectedVal.includes(targetVal);
            } else if (field.condition.operator === 'includes') {
                isVisible = Array.isArray(targetVal) && targetVal.some(v => String(v) === String(expectedVal));
            } else if (field.condition.operator === '!=') {
                isVisible = targetVal != expectedVal;
            } else {
                isVisible = targetVal == expectedVal;
            }
        } else {
            if (field.condition_value !== undefined) {
                isVisible = data[field.condition] == field.condition_value;
            } else {
                isVisible = !!data[field.condition];
            }
        }

        fieldClass = isVisible ? 'flex' : 'hidden';
    }

    // isset condition


    // === TEXT FIELD ===
    if (field.type === 'text' || field.type === 'number' || field.type === 'date' || field.type === 'email' || field.type === 'password') {
        if (!field.show_on || data[field.show_on] === "text" || data[field.show_on] === 'color') {

            let value = getNestedValue(data, field.name)
            if (typeof value === 'undefined' && field.value) {
                value = field.value;
            }
            return (
                <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <TextInput
                        type={field.type}
                        name={field.name}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => updateField(field.name, e.target.value)}
                        required={field.attribute === 'required'}
                        className="border px-3 py-2 w-full rounded appearance-none"
                    />
                    {
                        field.desc &&

                        <p className="text-xs font-medium text-res italic">{field.desc}</p>
                    }
                </div>
            );
        }
    }

    // === TEXTAREA ===
    if (field.type === 'textarea') {
        if (!field.show_on || data[field.show_on] === "text" || data[field.show_on] === 'color') {
            let value = getNestedValue(data, field.name)
            if (typeof value === 'undefined' && field.value) {
                value = field.value;
            }
            return (
                <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <textarea
                        name={field.name}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => updateField(field.name, e.target.value)}
                        required={field.attribute === 'required'}
                        className="border px-3 py-2 w-full rounded appearance-none"
                    />
                    {
                        field.desc &&

                        <p className="text-xs font-medium text-res italic">{field.desc}</p>
                    }
                </div>
            );
        }
    }

    // === PHONE FIELD ===
    if (field.type === 'phone') {
        return (
            <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <PhoneInput
                    name={field.name}
                    value={data[field.name] || ''}
                    onChange={(val) => updateField(field.name, val)}
                    required={field.attribute === 'required'}
                    className="w-full"
                    error={data.errors?.[field.name]}
                />
            </div>
        );
    }

    // === DESCRIPTION ===
    if (field.type === 'desc') {
        return (
            <div className="flex flex-col gap-2 col-span-6" key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <DescriptionEditor
                    name={field.name}
                    translate={field.translate}
                    type={field.name}
                    field={field}
                    data={field.translate ? data : null}
                    value={data[field.name] || ''}
                    id={id}
                    onChange={(val) => updateField(field.name, val)}
                    placeholder={field.placeholder}
                />
                {
                    field.desc &&

                    <p className="text-xs font-medium text-res italic">{field.desc}</p>
                }
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
        const value = normalizeImageValue(field, data);

        return (
            <div className={`col-span-6 ${fieldClass} flex-col`} key={field.name}>
                <InputLabel className="text-heading">
                    {field.label}
                </InputLabel>

                <ImageUploader
                    key={field.name}
                    name={field.name}
                    multiple={!!field.multiple}
                    value={value}
                    contextTitle={data.title || data.name || data.site_name || field.label || ''}
                    fieldLabel={field.label || field.name || ''}
                    autoAvatar={field.auto_avatar ?? (field.name === 'image')}
                    avatarSeed={data.name || data.email || data.title || ''}
                    onChange={(files) => updateField(field.name, files)}
                />
            </div>
        );
    }

    // === MAP ===
    if (field.type === 'map') {
        return (
            <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <MapField
                    address={getNestedValue(data, field.source || 'address') || ''}
                    coordinates={getNestedValue(data, field.coordinates_field || field.name) || []}
                />
            </div>
        );
    }


    // === DROPDOWN ===
    if (field.type === 'dropdown') {
        
        if (field.multiple) {
            return (
                <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <MultipleDropdown
                        name={field.name}
                        placeholder={field.placeholder}
                        valueInTitle={field.options.use_value}
                        searchable={field.searchable}
                        value={getNestedValue(data, field.name) || field.value || ''}
                        options={processOptions(field.options, field.name)}
                        onChange={(val) => updateField(field.name, val)}
                        isLoading={loadingStates[field.name]}
                    />
                </div>
            );
        }
        if (field.children) {
            return (
                <div className={`flex flex-col gap-3 ${colSpan} ${fieldClass}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <SecondaryDropdown
                        name={field.name}
                        value={data[field.name] || ''}
                        none={field.none ? true : false}

                        valueInTitle={field.valueInTitle == 'true' ? true : false}
                        options={processOptions(field.options, field.name)}
                        onChange={(val) => updateField(field.name, val)}
                        isLoading={loadingStates[field.name]}
                    />
                </div>
            );
        }
        if (field.withChildren) {
            return (
                <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                    <InputLabel className='text-heading'>{field.label}</InputLabel>
                    <PrimaryDropdown
                        name={field.name}
                        value={data[field.name] || ''}
                        none={field.none ? true : false}
                        options={processOptions(field.options, field.name)}
                        onChange={(val) => updateField(field.name, val)}
                        isLoading={loadingStates[field.name]}
                    />
                </div>
            );
        }
        return (
            <div className={`flex flex-col gap-2 ${colSpan} ${fieldClass}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <DropdownSelect
                    name={field.name}
                    searchable={field.searchable}
                    value={data[field.name] || field.value || ''}
                    options={processOptions(field.options, field.name)}
                    apiConfig={field.options?.api ? {
                        api: field.options.api,
                        endpoint: field.options.endpoint,
                        proxy: field.options.proxy,
                        city: resolveOptionTitle(field.options.city_field || 'city', data[field.options.city_field || 'city']),
                        state: resolveOptionTitle('state', data.state),
                        country: resolveOptionTitle('country', data.country),
                    } : null}
                    onLocationChange={(coordinates) => applyCoordinates(coordinates, field.options || {})}
                    onChange={(val) => updateField(field.name, val)}
                    isLoading={loadingStates[field.name]}
                />
            </div>
        );
    }

    // === CHECKBOX (Roles) ===
    if (field.type === 'checkbox' && field.options?.model === 'Roles') {
        const platformRoles = rolesList.filter(r => (r.scope || 'platform') === 'platform');
        const storeRoles = rolesList.filter(r => r.scope === 'store' || /store|delivery/i.test(r.title));

        const renderRoleItem = (role) => (
            <div key={role.id} className="p-3 rounded-xl bg-bg border border-permanent/30 hover:border-primary/40 flex items-center justify-between gap-3 transition-colors">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-heading">{role.title}</span>
                    <span className="text-[10px] text-res capitalize">
                        {role.scope === 'store' || /store|delivery/i.test(role.title) ? '📍 Store / Branch Scope' : '🌐 Main Platform Scope'}
                    </span>
                </div>
                <Togglebox
                    checked={!!(data.roles?.some(r => String(r) === String(role.id)))}
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        const updated = isChecked
                            ? [...(data.roles || []), role.id]
                            : (data.roles || []).filter((id) => String(id) !== String(role.id));
                        updateField('roles', updated);
                    }}
                />
            </div>
        );

        return (
            <div className="col-span-6 flex flex-col gap-4">
                {/* Platform Roles Section */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            🌐 Main Platform Roles
                        </span>
                        <span className="text-[10px] text-res">(Admins, Global Managers, Content Editors)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {platformRoles.length > 0 ? (
                            platformRoles.map(renderRoleItem)
                        ) : (
                            <p className="text-xs text-res italic col-span-3">No platform roles configured.</p>
                        )}
                    </div>
                </div>

                {/* Store-Specific Roles Section */}
                <div className="flex flex-col gap-2 pt-2 border-t border-permanent/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                                📍 Store &amp; Branch Roles
                            </span>
                            <span className="text-[10px] text-res">(Store Admin, Store Manager, Delivery Boys)</span>
                        </div>
                        <span className="text-[10px] text-amber-500 font-medium">
                            * Requires selecting an Assigned Store below
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {storeRoles.length > 0 ? (
                            storeRoles.map(renderRoleItem)
                        ) : (
                            <p className="text-xs text-res italic col-span-3">No store-specific roles created yet.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    if (field.type === 'checkbox') {
        return (
            <div className={`flex flex-col gap-2 ${colSpan}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <Togglebox
                    checked={!!getNestedValue(data, field.name) || field.attribute == 'checked' || field.value == true}
                    onChange={(e) => updateField(field.name, field.value ? (field.value === true ? field.value = false : field.value = true) : e.target.checked)}
                />
                {
                    field.desc &&

                    <p className="text-xs font-medium text-res italic">{field.desc}</p>
                }
            </div>
        );
    }

    // === PERMISSION MATRIX ===
    if (field.type === 'matrix') {
        return (
            <div className="col-span-6" key={field.name}>
                <PermissionMatrix
                    label={field.label}
                    name={field.name}
                    rows={field.rows || []}
                    cols={field.cols || []}
                    value={getNestedValue(data, field.name) || []}
                    onChange={(val) => updateField(field.name, val)}
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

    if (field.type === 'repeater') {
        return (
            <div className={`col-span-6 ${fieldClass}`} key={field.name}>
                <Repeater
                    value={data[field.name] || []}
                    onChange={(val) => updateField(field.name, val)}
                    label={field.label}
                    fields={field.fields || []}
                    show_add_button={field.show_add_button}
                    
                    dropdownOptions={dropdownOptions}
                    loadingStates={loadingStates}
                />
            </div>
        )
    }

    // === ATTRIBUTES (Features / Specs key-value repeater) ===
    if (field.type === 'attributes') {
        return (
            <div className="col-span-6" key={field.name}>
                <AttributesSelector
                    value={getNestedValue(data, field.name) || []}
                    onChange={(val) => updateField(field.name, val)}
                />
            </div>
        );
    }

    // === VARIATIONS ===
    if (field.type === 'variations') {
        return (
            <div className="col-span-6" key={field.name}>
                <VariationsSelector
                    value={getNestedValue(data, field.name) || []}
                    onChange={(val) => updateField(field.name, val)}
                    productPrices={{
                        buy_price: data.buy_price ?? '',
                        first_price: data.first_price ?? '',
                        second_price: data.second_price ?? '',
                    }}
                />
            </div>
        );
    }

    return null;
};

export default FieldControls;
