import AdminLayout from '@/Layouts/AdminLayout';
import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { RiSaveLine, RiArrowLeftLine, RiInformationLine, RiCodeLine, RiFocus2Line } from 'react-icons/ri';

export default function EditModule({ module }) {
    const [jsonStr, setJsonStr] = useState(JSON.stringify(module.content, null, 4));
    const [error, setError] = useState(null);

    const { data, setData, post, processing } = useForm({
        content: module.content
    });

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(jsonStr);
            setJsonStr(JSON.stringify(parsed, null, 4));
            setError(null);
            setData('content', parsed);
        } catch (e) {
            setError('Invalid JSON format: ' + e.message);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        try {
            const parsed = JSON.parse(jsonStr);
            setError(null);
            post(route('admin.builder.update', { id: module.type + '_' + module.config_type }), {
                data: { 
                    content: parsed,
                    type: module.type,
                    config_type: module.config_type
                }
            });
        } catch (e) {
            setError('Cannot save: Invalid JSON format.');
        }
    };

    return (
        <AdminLayout>
            <Head title={`Editing Module: ${module.type} (${module.config_type})`} />
            
            <div className="px-5 py-7 flex flex-col gap-6">
                <div className="flex justify-between items-center bg-accent p-6 rounded-2xl border border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link 
                            href={route('admin.builder.index')}
                            className="size-10 rounded-xl bg-permanent flex items-center justify-center text-res hover:text-primary transition-all border border-white/5 shadow-sm"
                        >
                            <RiArrowLeftLine className="size-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                    {module.config_type}
                                </span>
                                <h1 className="text-xl font-bold font-primary text-heading capitalize">
                                    {module.type} Configuration
                                </h1>
                            </div>
                            <p className="text-sm text-secondary">
                                Modify the dynamic behavior of this module via JSON.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={handleFormat}
                            className="bg-accent border border-primary/30 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary hover:text-white transition-all flex items-center gap-2 shadow-sm"
                        >
                            <RiCodeLine className="size-4" />
                            Format JSON
                        </button>
                        <button 
                            onClick={submit}
                            disabled={processing}
                            className="bg-primary text-white border border-primary/20 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md hover:shadow-primary/20"
                        >
                            <RiSaveLine className="size-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar / Instructions */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                         <div className="bg-accent rounded-2xl p-6 border border-white/5 shadow-sm">
                            <h3 className="text-sm font-bold text-heading flex items-center gap-2 mb-4 uppercase tracking-wider">
                                <RiInformationLine className="text-secondary size-5" />
                                Instructions
                            </h3>
                            <ul className="text-xs text-secondary space-y-4 leading-relaxed font-primary">
                                <li className="flex gap-2">
                                    <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                    <span>Define the module logic in <code className="text-primary bg-primary/5 px-1 rounded">DB.json</code> like models, validation, and relations.</span>
                                </li>
                                <li className="flex gap-2">
                                    <div className="size-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                    <span>Configure form fields in <code className="text-orange-400 bg-orange-400/5 px-1 rounded">Form.json</code> with specific field types.</span>
                                </li>
                                <li className="flex gap-2">
                                    <div className="size-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                                    <span>Define table columns and pagination details in <code className="text-green-400 bg-green-400/5 px-1 rounded">Table.json</code>.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Code Editor Area */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-center gap-3 animate-pulse font-medium">
                                <RiFocus2Line className="shrink-0" />
                                {error}
                            </div>
                        )}
                        
                        <div className="relative group">
                            <div className="absolute top-4 right-4 bg-permanent border border-white/5 px-3 py-1 rounded text-[10px] text-secondary/50 font-mono select-none group-hover:text-primary group-hover:border-primary transition-all">
                                JSON EDITOR
                            </div>
                            <textarea 
                                className="w-full h-[600px] bg-accent border-none rounded-2xl p-8 font-mono text-[14px] text-res focus:ring-1 focus:ring-primary shadow-inner resize-none leading-relaxed transition-all scroll-hidden"
                                spellCheck={false}
                                value={jsonStr}
                                onChange={e => setJsonStr(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
