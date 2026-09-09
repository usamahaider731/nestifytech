import AdminLayout from '@/Layouts/AdminLayout';
import React from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import { RiLayoutMasonryLine, RiDatabase2Line, RiWindowLine, RiAddLine, RiDeleteBinLine } from 'react-icons/ri';

export default function Modules({ modules }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: '',
        config_type: 'DB'
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.builder.store'), {
            onSuccess: () => reset()
        });
    };

    return (
        <AdminLayout title="Modules">
            <Head title="Admin Builder - Modules" />
            
            <div className="px-5 py-7 flex flex-col gap-7">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-primary text-heading">Admin Builder</h1>
                        <p className="text-sm text-secondary mt-1">Manage dynamic module configurations stored as JSON files.</p>
                    </div>
                    
                    <form onSubmit={submit} className="flex gap-2 bg-accent p-2 rounded-xl border border-white/5">
                        <input 
                            type="text" 
                            className="bg-permanent border-none rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary h-10 min-w-[180px] text-res"
                            placeholder="Module Name (slug)..."
                            value={data.type}
                            onChange={e => setData('type', e.target.value)}
                        />
                        <select 
                            className="bg-permanent border-none rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary h-10 text-res"
                            value={data.config_type}
                            onChange={e => setData('config_type', e.target.value)}
                        >
                            <option value="DB">DB</option>
                            <option value="Form">Form</option>
                            <option value="Table">Table</option>
                        </select>
                        <button 
                            disabled={processing}
                            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors h-10 text-sm font-medium"
                        >
                            <RiAddLine className="size-5" />
                            Create
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Object.entries(modules).map(([type, configs]) => (
                        <div key={type} className="bg-accent rounded-2xl p-6 shadow-sm border border-white/10 hover:border-primary/30 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-lg font-semibold capitalize text-heading flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <RiLayoutMasonryLine className="size-5" />
                                    </div>
                                    {type}
                                </h2>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {['DB', 'Form', 'Table'].map(ct => (
                                    <div key={ct} className="flex items-center justify-between p-3 bg-permanent rounded-xl hover:bg-white/5 transition-all border border-white/5">
                                        <div className="flex items-center gap-3 text-sm">
                                            {ct === 'DB' && <RiDatabase2Line className="text-blue-400 size-4" />}
                                            {ct === 'Form' && <RiWindowLine className="text-orange-400 size-4" />}
                                            {ct === 'Table' && <RiLayoutMasonryLine className="text-green-400 size-4" />}
                                            <span className="text-res font-medium">{ct}</span>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {configs[ct] ? (
                                                <Link 
                                                    href={route('admin.builder.edit', { type, config_type: ct })}
                                                    className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-[11px] font-bold hover:bg-primary hover:text-white transition-all uppercase tracking-wider"
                                                >
                                                    Edit File
                                                </Link>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        setData({ type, config_type: ct });
                                                        // Note: user would need to click "Create" again or I could auto-submit
                                                    }}
                                                    className="px-3 py-1 bg-white/5 text-secondary/50 rounded-lg text-[10px] italic hover:text-primary transition-colors"
                                                >
                                                    Missing
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
