import React, { useState } from 'react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router } from '@inertiajs/react';
import DropdownSelect from '@/Components/DropdownSelect';

function Translations({ translations, languages = [], currentLocale = 'en' }) {
    const [search, setSearch] = useState('');
    
    const { data, setData, post, processing, reset } = useForm({
        translations: translations,
        locale: currentLocale
    });

    // Reset form when props change (language switch)
    React.useEffect(() => {
        setData({
            translations: translations,
            locale: currentLocale
        });
    }, [translations, currentLocale]);

    const handleLanguageChange = (newLocale) => {
        router.get(route('admin.translations'), { locale: newLocale });
    };

    const handleChange = (key, value) => {
        setData('translations', {
            ...data.translations,
            [key]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.translations.update'));
    };

    const filteredKeys = Object.keys(translations).filter(key => 
        key.toLowerCase().includes(search.toLowerCase()) || 
        translations[key].toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full py-10 px-6">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-2xl font-bold text-heading font-oswald">Language Translations</h4>
                
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <InputLabel value="Switch Language:" />
                        <DropdownSelect 
                            value={currentLocale} 
                            onChange={handleLanguageChange}
                            options={languages.map(lang => ({ 
                                id: lang.prefix, 
                                title: lang.name 
                            }))}
                            className="w-48"
                            searchable={false}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-transparent shadow-xl rounded-2xl p-7">
                <div className="mb-6">
                    <TextInput 
                        placeholder="Search translation (key or value)..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredKeys.length > 0 ? (
                            filteredKeys.map((key) => (
                                <div className="space-y-1" key={key}>
                                    <label className="text-xs font-semibold text-gray-500 truncate block" title={key}>
                                        {key}
                                    </label>
                                    <TextInput
                                        className="w-full"
                                        value={data.translations[key] || ''}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-10 text-gray-400 italic">
                                No translations found matching "{search}"
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <PrimaryButton disabled={processing} className="bg-primary px-8">
                            {processing ? 'Saving...' : 'Save Translations'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

Translations.layout = (page) => <AdminLayout title="Translations">{page}</AdminLayout>;

export default Translations;
