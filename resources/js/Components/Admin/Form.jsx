import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FieldControls from './FieldsControls';
import { RiListOrdered2 } from 'react-icons/ri';
import { router } from '@inertiajs/react';

const Form = ({ initialData = {}, rows = [], onSubmit, mode = 'create', type = 'product', routes, redirectUrl }) => {
    // Build actual state, parsing strings where necessary
    const buildInitialState = () => {
        const initialState = {};
        Object.entries(initialData).forEach(([key, val]) => {
            if (typeof val === 'string' && val.length > 0 && (val.startsWith('[') || val.startsWith('{'))) {
                try {
                    initialState[key] = JSON.parse(val);
                } catch (e) {
                    initialState[key] = val;
                }
            } else {
                initialState[key] = val;
            }
        });
        return initialState;
    };

    const [data, setData] = useState(buildInitialState);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const [rolesList, setRolesList] = useState([]);

    // Re-sync form data when Inertia delivers fresh server props after a save
    // (happens when there's no redirectUrl and the server re-renders the same edit page)
    const prevInitialDataRef = React.useRef(null);
    useEffect(() => {
        const serialized = JSON.stringify(initialData);
        if (prevInitialDataRef.current !== null && prevInitialDataRef.current !== serialized) {
            setData(buildInitialState());
        }
        prevInitialDataRef.current = serialized;
    }, [initialData]);

    const id = data.id ?? null;
    const [isSaving, setIsSaving] = useState(false);

    // Collect unique tab names from sections that have a "tab" property
    const tabNames = [...new Set(rows.filter(r => r.tab).map(r => r.tab))];
    const [activeTab, setActiveTab] = useState(tabNames[0] ?? null);

    const handleSubmit = async (e = null, isDraft = false, isSilent = false) => {
        if (e) e.preventDefault();

        let r;
        if (!isSilent) {
            r = toast.loading("Please Wait Form is Submiting");
        }
        setIsSaving(true);
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'variations') {
                formData.append(key, JSON.stringify(value));
                return;
            }

            if (value instanceof File) {
                formData.append(key, value);
            }
            else if (value instanceof Date) {
                formData.append(key, value.toISOString());
            }
            else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (item instanceof File) {
                        formData.append(`${key}[${index}]`, item);
                    } else if (item instanceof Date) {
                        formData.append(`${key}[${index}]`, item.toISOString());
                    } else if (typeof item === 'object' && item !== null) {
                        // For non-plain objects (like Date, Moment, etc.), fallback to JSON stringify
                        if (Object.prototype.toString.call(item) !== '[object Object]') {
                            formData.append(`${key}[${index}]`, JSON.stringify(item));
                            return;
                        }
                        Object.entries(item).forEach(([subKey, subValue]) => {
                            if (subValue instanceof File) {
                                formData.append(`${key}[${index}][${subKey}]`, subValue);
                            } else {
                                // Only stringify if it's an object/array, otherwise send as-is
                                const formattedValue = (typeof subValue === 'object' && subValue !== null)
                                    ? JSON.stringify(subValue)
                                    : (subValue === null ? '' : subValue);
                                formData.append(`${key}[${index}][${subKey}]`, formattedValue);
                            }
                        });
                    } else {
                        formData.append(`${key}[${index}]`, item);
                    }
                });
            }
            else if (typeof value === 'object' && value !== null) {
                // Handles Date and other non-plain objects safely
                if (value instanceof Date) {
                    formData.append(key, value.toISOString());
                } else {
                    formData.append(key, JSON.stringify(value));
                }
            }
            else {
                formData.append(key, value);
            }
        });

        formData.append('status', isDraft ? 'draft' : 'publish');

        const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            formData.append('_token', csrfToken);
        }
        try {
            // Safely convert to relative path — handles both absolute URLs and already-relative paths
            let relativeRoute = routes;
            try {
                const parsed = new URL(routes);
                relativeRoute = parsed.pathname + parsed.search;
            } catch (_) {
                // routes is already a relative path, use as-is
            }

            router.post(relativeRoute, formData, {
                forceFormData: true,
                onSuccess: (page) => {
                    if (!isSilent) {
                        toast.dismiss(r);
                        toast.success(`${type} Saved successfully`);
                        if (redirectUrl) {
                            router.visit(redirectUrl);
                        }
                    }
                },
                onError: (errors) => {
                    if (!isSilent) {
                        toast.dismiss(r);
                        toast.error(`${type} failed to submit`);
                    }
                },
                onFinish: () => {
                    setIsSaving(false);
                }
            });
        } catch (error) {
            if (!isSilent) {
                toast.dismiss(r);
                toast.error(`${type} failed to submit `);
                setIsSaving(false);
            }
        }
    };

    const updateField = (key, value) => {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            setData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent] || {}),
                    [child]: value
                }
            }));
        } else {
            setData(prev => ({ ...prev, [key]: value }));
        }
    };
    const fetchDropdownOptions = async (override = {}) => {
        const fetchFields = {};

        rows.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'dropdown' && field.options?.model) {
                    const hasDependency = field.depends_on;
                    const canFetch = !hasDependency || (hasDependency && data[hasDependency]);

                    const shouldFetch =
                        override[field.name] || (canFetch && !dropdownOptions[field.name]);

                    if (shouldFetch) {
                        fetchFields[field.name] = field.options;
                        setLoadingStates(prev => ({ ...prev, [field.name]: true }));
                    }
                }
                // Also check repeaters
                if (field.type === 'repeater' && field.fields) {
                    field.fields.forEach(f => {
                        if (f.type === 'dropdown' && f.options?.model) {
                            const hasDependency = f.depends_on;
                            const canFetch = !hasDependency || (hasDependency && data[hasDependency]);

                            const shouldFetch =
                                override[f.name] || (canFetch && !dropdownOptions[f.name]);

                            if (shouldFetch) {
                                fetchFields[f.name] = f.options;
                                setLoadingStates(prev => ({ ...prev, [f.name]: true }));
                            }
                        }
                    });
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

                let endpoint;
                if (config.model === 'Menu') {
                    endpoint = `/api/menu-locations`;
                } else if (config.model === 'Attribute') {
                    endpoint = `/api/attribute-options`;
                } else {
                    endpoint = `/api/${config.model.toLowerCase()}-options/${config.type ?? ''}`;
                }
                const response = await axios.get(endpoint, { params });

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
    const normalizeImageValue = (field, data) => {
        if (field.value) return field.multiple ? [].concat(field.value) : field.value;

        if (!data[field.name]) return field.multiple ? [] : null;

        if (data[field.name]?.filename) {
            return field.multiple
                ? [data[field.name].filename]
                : data[field.name].filename;
        }

        return data[field.name];
    };
    // Watch for dependency changes (e.g. State change triggers City refresh)
    const prevDataRef = React.useRef(data);
    useEffect(() => {
        // Find which field actually changed
        const changedKeys = Object.keys(data).filter(k =>
            JSON.stringify(data[k]) !== JSON.stringify(prevDataRef.current[k])
        );

        if (changedKeys.length > 0) {
            const fieldsToRefetch = {};
            let hasDependencyChanges = false;

            rows.forEach(section => {
                section.fields.forEach(field => {
                    // If this field depends on something that just changed
                    if (field.depends_on && changedKeys.includes(field.depends_on)) {
                        fieldsToRefetch[field.name] = true;
                        hasDependencyChanges = true;

                        // 1. Clear the current value (City becomes empty when State changes)
                        const currentVal = data[field.name];
                        if (currentVal && (Array.isArray(currentVal) ? currentVal.length > 0 : true)) {
                            updateField(field.name, field.multiple ? [] : '');
                        }
                    }
                });
            });

            if (hasDependencyChanges) {
                fetchDropdownOptions(fieldsToRefetch);
            }
        }
        prevDataRef.current = data;
    }, [data, rows]);

    // Initial fetch
    useEffect(() => {
        fetchDropdownOptions();

        if (rows.some(s => s.fields.some(f => f.options?.model === 'Roles'))) {
            axios.get('/api/roles-options').then(res => setRolesList(res.data)).catch(() => { });
        }
    }, [rows]);

    const groupedSections = {
        main: rows.filter(r => r.style !== 'sidebar' && !r.tab),
        sidebar: rows.filter(r => r.style === 'sidebar'),
        tabbed: rows.filter(r => r.tab),
    };

    const tabIcons = {
        'Attributes': (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 1h12a1 1 0 0 1 1 1v1H1V4a1 1 0 0 1 1-1M1 7h14v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" />
            </svg>
        ),
        'Variations': (
            <RiListOrdered2 />
        ),
        'SEO': (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
            </svg>
        ),
        'Gallery': (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2zM14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1zM2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1h-10z"/>
            </svg>
        ),
        'Address': (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            </svg>
        ),
    };

    const sharedFieldProps = { data, normalizeImageValue, updateField, rolesList, dropdownOptions, loadingStates, id };

    return (
        <form autoComplete="off" onSubmit={(e) => handleSubmit(e, false)} className="py-7 w-full flex-wrap px-6 flex">
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

            <div className="w-full mt-7 flex-wrap flex gap-y-5">
                <div className={`${groupedSections.sidebar.length > 0 ? 'w-7/10' : 'w-full'} flex flex-col gap-5`}>
                    {/* Regular (non-tabbed) main sections */}
                    {groupedSections.main.map((section, idx) => (
                        <div key={idx} className="bg-accent rounded p-6">
                            <h2 className="text-lg font-medium font-roboto text-heading mb-4">{section.title}</h2>
                            <div className="grid grid-cols-6 gap-5">
                                {section.fields.map(field => (
                                    <FieldControls
                                        key={field.name}
                                        field={field}
                                        {...sharedFieldProps}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Tabbed sections (Attributes / Variations / SEO) */}

                </div>

                {groupedSections.sidebar.length > 0 && (
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
                                            normalizeImageValue={normalizeImageValue}
                                            rolesList={rolesList}
                                            dropdownOptions={dropdownOptions}
                                            loadingStates={loadingStates}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
            {tabNames.length > 0 && (
                <div className="bg-accent rounded mt-5 max-h-80 w-full flex overflow-hidden">
                    {/* Tab Header */}
                    <div className="flex border-r w-1/4 h-full overflow-y-auto flex-col border-secondary/20">
                        {tabNames.map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`
                                            flex items-center gap-2 px-6 py-3.5 text-sm font-medium font-roboto
                                            transition-all duration-200 border-b-2 -mb-px
                                            ${activeTab === tab
                                        ? 'border-primary text-primary bg-[color-mix(in_sRGB,var(--color-primary)_6%,transparent)]'
                                        : 'border-transparent text-res hover:text-heading hover:border-secondary/40'
                                    }
                                        `}
                            >
                                {tabIcons[tab] ?? null}
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className='w-3/4  h-full overflow-y-auto'>
                        {/* Tab Panels */}
                        {groupedSections.tabbed
                            .filter(section => section.tab === activeTab)
                            .map((section, idx) => (
                                <div key={idx} className="p-6">
                                    <div className="grid grid-cols-6 gap-5">
                                        {section.fields.map(field => (
                                            <FieldControls
                                                key={field.name}
                                                field={field}
                                                {...sharedFieldProps}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </form>
    );
};
export default Form;