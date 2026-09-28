import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout'; // Assuming there is an AdminLayout

export default function ImportExport({ tables }) {
    const [action, setAction] = useState('import');
    
    const { data, setData, post, processing, errors } = useForm({
        table: tables.length > 0 ? tables[0] : '',
        format: 'csv',
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        if (action === 'import') {
            post(route('admin.import'));
        } else {
            // For export, we might want to do a standard form submission or an inertia post that downloads
            window.location.href = route('admin.export') + '?table=' + data.table + '&format=' + data.format;
        }
    };

    return (
        <AdminLayout>
            <Head title="Import/Export Data" />
            <div className="max-w-4xl mx-auto py-10 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Import & Export Data</h2>
                    
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setAction('import')}
                                className={`${
                                    action === 'import'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Import Data
                            </button>
                            <button
                                onClick={() => setAction('export')}
                                className={`${
                                    action === 'export'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Export Data
                            </button>
                        </nav>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Table/Module</label>
                            <select
                                value={data.table}
                                onChange={(e) => setData('table', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                {tables.map((table) => (
                                    <option key={table} value={table}>
                                        {table}
                                    </option>
                                ))}
                            </select>
                            {errors.table && <div className="text-red-600 mt-2 text-sm">{errors.table}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Format</label>
                            <select
                                value={data.format}
                                onChange={(e) => setData('format', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="csv">CSV</option>
                                <option value="xlsx">Excel (XLSX)</option>
                                <option value="json">JSON</option>
                                <option value="xml">XML</option>
                            </select>
                            {errors.format && <div className="text-red-600 mt-2 text-sm">{errors.format}</div>}
                        </div>

                        {action === 'import' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Upload File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('file', e.target.files[0])}
                                    className="mt-1 block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100"
                                />
                                {errors.file && <div className="text-red-600 mt-2 text-sm">{errors.file}</div>}
                            </div>
                        )}

                        <div className="flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {action === 'import' ? 'Run Import' : 'Download Export'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
