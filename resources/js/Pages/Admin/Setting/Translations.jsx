import React from 'react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';

function Translations({ translations }) {
    const { data, setData, post, processing } = useForm(() => {
        const initial = {};
        Object.entries(translations).forEach(([key, value]) => {
            initial[key] = value;
        });
        return initial;
    });

    const handleChange = (e, key) => {
        setData(key, e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.translations.update'));
    };

    return (
        <div className="w-full py-15 px-6">
            <form onSubmit={handleSubmit} className="w-full shadow-xl mx-auto bg-accent rounded-2xl p-7 gap-y-5 flex flex-col">
                <div className="h-11 w-full flex items-center pb-3">
                    <h4 className="text-2xl font-medium text-heading font-oswald">Translations</h4>
                </div>

                <div className="grid grid-cols-2 w-full gap-5 py-5">
                    {Object.entries(translations).map(([key, value]) => (
                        <div className="col-span-1 flex flex-col gap-2" key={key}>
                            <InputLabel value={key} className="text-base capitalize text-heading" />
                            <TextInput
                                value={data[key] || ''}
                                onChange={(e) => handleChange(e, key)}
                            />
                        </div>
                    ))}
                </div>

                <PrimaryButton disabled={processing} className="w-fit bg-primary">
                    Submit
                </PrimaryButton>
            </form>
        </div>
    );
}

Translations.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Translations;
