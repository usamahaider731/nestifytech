import React, { useEffect, useState } from 'react';
import Textarea from '@/Components/Textarea';
import { useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DropdownSelect from '@/Components/DropdownSelect';
import ImageUploader from '@/Components/Admin/ImageUploader';
import axios from 'axios';

function Form({ Data = [], name = '', link = '', type = '' }) {
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loadingStates, setLoadingStates] = useState({});

    const { data, setData, post, processing, errors } = useForm(() => {
        const initial = {};
        Object.entries(Data).forEach(([key, setting]) => {
            initial[key] = setting.value;
        });
        return initial;
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('setting.update', { 'type': name }), {
            preserveScroll: true,
            onError: () => {
                // Handle errors if needed
            },
            onSuccess: () => {
                // Handle success if needed
            }
        });
    };

    const handleChange = (e, key) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setData(key, value);
    };

    const handleDropdownChange = (value, key) => {
        setData(key, value);
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
                id: option.id,
                title: option.title
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
        });

        // Fetch each dynamic option
        for (const [key, optionsConfig] of Object.entries(optionsToFetch)) {
            try {
                const response = await axios.get(
                    `/taxonomy-options/${optionsConfig.type}`,
                    {
                        params: {
                            use_value: optionsConfig.use_value || false,
                            meta: optionsConfig.meta || null
                        }
                    }
                );

                setDropdownOptions(prev => ({
                    ...prev,
                    [optionsConfig.type]: (response.data).map((value => ({
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
                    {Data && Object.entries(Data).map(([key, setting]) => {
                        return (
                            <div
                                className={`
                                ${(setting.type === 'text' || setting.type === 'dropdown' || setting.type === 'image') && 'col-span-2'} 
                                ${setting.type === 'color' && 'col-span-1'} 
                                ${setting.type === 'textarea' && 'col-span-4'}
                                ${setting.type === 'checkbox' && 'col-span-4 flex-row items-center gap-3'}
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
                                        onChange={(e) => handleChange(e, key)}
                                        error={errors[key]}
                                    />
                                )}
                                {(setting.type === 'text' && setting.depend_on) && (

                                    <TextInput
                                        id={key}
                                        name={key}
                                        readOnly={true}
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
                                        className='bg-transparent rounded outline-0 ring-0 border-secondary text-heading focus:ring-0 focus:outline-0 focus:border-secondary'
                                        value={data[key] || ''}
                                        onChange={(e) => handleChange(e, key)}
                                        error={errors[key]}
                                    />
                                )}

                                {setting.type === 'color' && (
                                    <div className='flex items-center gap-3'>
                                        <input
                                            id={key}
                                            type="color"
                                            value={data[key] || '#000000'}
                                            className='border p-1 h-10 w-16 rounded'
                                            onChange={(e) => handleChange(e, key)}
                                        />
                                        <TextInput
                                            value={data[key] || '#000000'}
                                            className=' w-24'
                                            onChange={(e) => handleChange(e, key)}
                                        />
                                    </div>
                                )}

                                {setting.type === 'dropdown' && (
                                    // In your form component, update the DropdownSelect usage:
                                    <DropdownSelect
                                        id={key}
                                        name={key}
                                        value={setting.value ?? data[key]}
                                        className='w-full'
                                        options={processOptions(setting.options)}
                                        onChange={(value) => handleDropdownChange(value, key)}
                                        error={errors[key]}
                                        isLoading={loadingStates[key]}
                                        disabled={processing}
                                    />
                                )
                                }

                                {setting.type === 'checkbox' && (
                                    <div className='flex items-center'>
                                        <input
                                            id={key}
                                            type="checkbox"
                                            checked={data[key] || false}
                                            onChange={(e) => handleChange(e, key)}
                                            className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                                        />
                                        <label htmlFor={key} className='ml-2 block text-sm text-gray-700'>
                                            {setting.label}
                                        </label>
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
                        )

                    })

                    }
                </div>

                <div className="flex justify-end">
                    <PrimaryButton
                        type="submit"
                        className='max-w-28 flex items-center bg-primary justify-center h-9'
                        disabled={processing}
                    >
                        {processing ? 'Saving...' : 'Save'}
                    </PrimaryButton>
                </div>
            </form>
        </div>
    );
}

export default Form;