import React from 'react';
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

        if (data[field.condition] == field.condition_value || data[field.condition]) {
            fieldClass = 'flex';
        }

    }

    // === TEXT FIELD ===
    if (field.type === 'text' || field.type === 'number') {
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
            <div className="col-span-6" key={field.name}>
                <InputLabel className="text-heading">
                    {field.label}
                </InputLabel>

                <ImageUploader
                    key={field.name}
                    name={field.name}
                    multiple={!!field.multiple}
                    value={value}
                    onChange={(files) => updateField(field.name, files)}
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
                <div className={`flex flex-col gap-3 ${colSpan}`} key={field.name}>
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
                <div className={`flex flex-col gap-2 ${colSpan}`} key={field.name}>
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
            <div className={`flex flex-col gap-2 ${colSpan}`} key={field.name}>
                <InputLabel className='text-heading'>{field.label}</InputLabel>
                <DropdownSelect
                    name={field.name}
                    searchable={field.searchable}
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
                {
                    field.desc &&

                    <p className="text-xs font-medium text-res italic">{field.desc}</p>
                }
            </div>
        ));
    }

    // === CHECKBOX ===
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
                />
            </div>
        );
    }

    return null;
};

export default FieldControls;
