import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FieldControls from './FieldsControls';
const Form = ({ initialData = {}, rows = [], onSubmit, mode = 'create', type = 'product', routes }) => {
    const [data, setData] = useState(initialData);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const [rolesList, setRolesList] = useState([]);
    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        const r = toast.loading("Please Wait Form is Submiting");
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
                // console.log(key,  value);

            if (value instanceof File) {
                formData.append(key, value);
            }
            else if (Array.isArray(value) && value[0] instanceof File) {
                value.forEach(file => {
                    formData.append(`${key}[]`, file);
                });
            }
            else if (typeof value === 'object') {
                if(key === 'variations'){
                    value.forEach((variation, index) => {
                        Object.entries(variation).forEach(([varKey, varValue]) => {
                            if (varValue instanceof File) {
                                formData.append(`variations[${index}][${varKey}]`, varValue);
                            } else {
                                formData.append(`variations[${index}][${varKey}]`, JSON.stringify(varValue));
                            }
                        });
                    });
                }
                else{
                formData.append(key, JSON.stringify(value));
                }
                // console.log(key, JSON.stringify(value));

            }

            else {
                formData.append(key, value);
            }

        });

        formData.append('status', isDraft ? 'draft' : 'publish');
        try {
            const response = await axios.post(
                routes,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            toast.dismiss(r);
            toast.success(`${type} Saved successfully`);
        } catch (error) {
            toast.dismiss(r);
            toast.error(`${type} failed to submit`, error);
        }
    };
    const updateField = (key, value) => {
        // if (typeof value === 'object' && value !== null && !(value instanceof File)) {
        //     value = JSON.stringify(value);
        //     // console.log(key, typeof value);

        // }

        setData(prev => ({ ...prev, [key]: value }));
    };
    const fetchDropdownOptions = async (override = {}) => {
        const fetchFields = {};

        rows.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'dropdown' && field.options?.model) {
                    const shouldFetch =
                        override[field.name] || (!field.depends_on && !dropdownOptions[field.name]);

                    if (shouldFetch) {
                        fetchFields[field.name] = field.options;
                        setLoadingStates(prev => ({ ...prev, [field.name]: true }));
                    }
                }
            });
        });

        for (const [fieldName, config] of Object.entries(fetchFields)) {
            try {
                const field = rows.flatMap(section => section.fields).find(f => f.name === fieldName);
                const params = {
                    use_value: config.use_value || false,
                    as_options: true,
                    parent_id: config.parent_id || null,
                    not_id: config.not_id ? data.id : null,
                };
                if (field?.depends_on && data[field.depends_on]) {
                    params.parent = data[field.depends_on];
                }

                const response = await axios.get(`/${config.model.toLowerCase()}-options/${config.type ?? ''}`, { params });

                const mapped = response.data;

                setDropdownOptions(prev => ({ ...prev, [fieldName]: mapped }));
            } catch (err) {
                console.error(`Dropdown fetch failed for ${fieldName}`, err);
                setDropdownOptions(prev => ({ ...prev, [fieldName]: [] }));
            } finally {
                setLoadingStates(prev => ({ ...prev, [fieldName]: false }));
            }
        }
    };
    useEffect(() => {
        fetchDropdownOptions();

        if (rows.some(s => s.fields.some(f => f.options?.model === 'Roles'))) {
            axios.get('/roles-options').then(res => setRolesList(res.data)).catch(() => { });
        }
    }, []);
    useEffect(() => {
        if (data.state) {
            updateField('city', '');
            setDropdownOptions(prev => ({ ...prev, city: [] }));
            fetchDropdownOptions({ city: true });
        }
    }, [data.state]);
    const groupedSections = {
        main: rows.filter(r => r.style !== 'sidebar'),
        sidebar: rows.filter(r => r.style === 'sidebar'),
    };
    return (
        <form autocomplete="off" onSubmit={(e) => onSubmit(e, data)} className="py-7 w-full flex-wrap px-6 flex">
            <div className="w-full flex justify-between items-start">
                <div>
                    <h4 className="text-2xl font-roboto text-heading font-medium">
                        {mode === 'edit' ? 'Edit Record' : 'Create Record'}
                    </h4>
                    <p className="text-base font-medium text-res font-roboto">Fill the details below</p>
                </div>
                <div className="flex gap-5">
                    <button type="reset" className="rounded-md h-10 bg-accent px-6 text-secondary text-[15px] font-medium">
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="rounded-md h-10 flex items-center bg-[color-mix(in_sRGB,var(--color-primary)_10%,_#2f3349)] px-6 text-primary text-[15px] cursor-pointer font-medium"
                    >
                        Save Draft
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        className="rounded-md h-10 bg-primary px-6 text-heading text-[15px] font-medium"
                    >
                        {mode === 'edit' ? 'Update' : 'Publish'} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                </div>
            </div>
            <div className="w-full mt-7 flex-wrap flex">
                <div className="w-7/10 flex flex-col gap-5">
                    {groupedSections.main.map((section, idx) => (
                        <div key={idx} className="bg-accent rounded p-6">
                            <h2 className="text-lg font-medium font-roboto text-heading mb-4">{section.title}</h2>
                            <div className="grid grid-cols-6 gap-5">
                                {section.fields.map(field => (
                                    <FieldControls
                                        key={field.name}
                                        field={field}
                                        data={data}
                                        updateField={updateField}
                                        rolesList={rolesList}
                                        dropdownOptions={dropdownOptions}
                                        loadingStates={loadingStates}
                                    />

                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="w-3/10 sticky top-0 right-0 h-fit flex flex-col gap-5 pl-5">
                    {groupedSections.sidebar.map((section, idx) => (
                        <div key={idx} className="bg-accent rounded p-6">
                            <h2 className="text-lg font-medium font-roboto text-heading mb-4">{section.title}</h2>
                            <div className="grid-cols-2 grid gap-4">
                                {section.fields.map(field => (
                                    <FieldControls
                                        key={field.name}
                                        field={field}
                                        data={data}
                                        updateField={updateField}
                                        rolesList={rolesList}
                                        dropdownOptions={dropdownOptions}
                                        loadingStates={loadingStates}
                                    />

                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </form>
    );
};
export default Form;