import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { toast } from 'react-toastify';
import { 
    TbCloudUpload, 
    TbCloudDownload, 
    TbFileZip, 
    TbDatabaseImport, 
    TbCheck, 
    TbAlertCircle, 
    TbFileText,
    TbRefresh
} from 'react-icons/tb';
import { 
    RiFileZipLine, 
    RiFolderZipLine,
    RiDatabase2Line, 
    RiCheckboxCircleLine, 
    RiErrorWarningLine,
    RiArrowRightLine
} from 'react-icons/ri';

export default function ImportExport({ tables = [], existingPackages = [] }) {
    const { flash = {}, errors: pageErrors = {} } = usePage().props;
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'packages' | 'export'
    const [dragOver, setDragOver] = useState(false);
    const [importingPackage, setImportingPackage] = useState(null);

    // Form for file upload
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        table: tables.length > 0 ? tables[0] : '',
        format: 'csv',
    });

    // Form for export
    const [exportTable, setExportTable] = useState(tables.length > 0 ? tables[0] : '');
    const [exportFormat, setExportFormat] = useState('csv');
    const [isFullPackage, setIsFullPackage] = useState(true);

    const isZipSelected = data.file && data.file.name.toLowerCase().endsWith('.zip');

    const handleFileChange = (file) => {
        if (!file) return;
        setData('file', file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const submitImport = (e) => {
        e.preventDefault();
        if (!data.file) {
            toast.error('Please select a file to import.');
            return;
        }

        post(route('admin.import'), {
            onSuccess: () => {
                toast.success('Import completed successfully!');
                reset('file');
            },
            onError: (err) => {
                toast.error(err.file || err.table || 'Import encountered an error.');
            }
        });
    };

    const triggerImportExistingPackage = (pkgName) => {
        if (!confirm(`Are you sure you want to import package "${pkgName}"? Existing records with matching IDs will be updated.`)) {
            return;
        }

        setImportingPackage(pkgName);
        router.post(route('admin.import-package'), { filename: pkgName }, {
            onSuccess: () => {
                toast.success(`Package "${pkgName}" imported successfully!`);
            },
            onError: (err) => {
                toast.error(err.file || 'Failed to import package.');
            },
            onFinish: () => {
                setImportingPackage(null);
            }
        });
    };

    const handleExport = (e) => {
        e.preventDefault();
        let exportUrl = route('admin.export') + '?table=' + exportTable + '&format=' + exportFormat;
        if (isFullPackage) {
            // infer type from table name
            let inferredType = exportTable.replace(/s$/, '');
            if (exportTable === 'taxonomies') inferredType = 'category';
            if (exportTable === 'posts') inferredType = 'product';
            exportUrl += '&type=' + inferredType;
        }
        window.location.href = exportUrl;
    };

    const getPackageBadge = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('category')) return { label: 'Categories', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (lower.includes('product')) return { label: 'Products', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
        if (lower.includes('user')) return { label: 'Users', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
        return { label: 'General', bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    };

    return (
        <AdminLayout>
            <Head title="Data Import & Export Management" />
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                                <TbDatabaseImport className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Import & Export Center</h1>
                                <p className="text-sm text-gray-500">
                                    Manage data migration, ZIP package imports with media, and database sync.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {existingPackages.length} Ready Packages Detected
                        </span>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800">
                        <RiCheckboxCircleLine className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm font-medium">{flash.success}</div>
                    </div>
                )}
                {(flash?.error || errors?.file || pageErrors?.file) && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
                        <RiErrorWarningLine className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm font-medium">{flash?.error || errors?.file || pageErrors?.file}</div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`${
                                activeTab === 'upload'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-2 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors`}
                        >
                            <TbCloudUpload className="w-5 h-5" />
                            Upload & Import File / ZIP
                        </button>

                        <button
                            onClick={() => setActiveTab('packages')}
                            className={`${
                                activeTab === 'packages'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-2 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors relative`}
                        >
                            <RiFolderZipLine className="w-5 h-5" />
                            Storage Export Packages
                            {existingPackages.length > 0 && (
                                <span className="ml-1.5 py-0.5 px-2 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                                    {existingPackages.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('export')}
                            className={`${
                                activeTab === 'export'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-2 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors`}
                        >
                            <TbCloudDownload className="w-5 h-5" />
                            Export Data
                        </button>
                    </nav>
                </div>

                {/* Tab 1: Upload & Import */}
                {activeTab === 'upload' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8">
                        <div className="max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Upload Data or Export Package</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Upload a full <strong className="text-indigo-600 font-semibold">ZIP export package</strong> (with multiple tables and images) or a standalone <strong className="font-semibold text-gray-700">CSV, XLSX, JSON</strong> file.
                            </p>

                            <form onSubmit={submitImport} className="space-y-6">
                                {/* Dropzone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                                        dragOver 
                                            ? 'border-indigo-500 bg-indigo-50/50' 
                                            : data.file 
                                                ? 'border-emerald-400 bg-emerald-50/30' 
                                                : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        id="import-file-input"
                                        accept=".zip,.csv,.json,.xlsx,.xml"
                                        onChange={(e) => handleFileChange(e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />

                                    <div className="flex flex-col items-center justify-center">
                                        {data.file ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-sm">
                                                    {isZipSelected ? (
                                                        <TbFileZip className="w-8 h-8" />
                                                    ) : (
                                                        <TbFileText className="w-8 h-8" />
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">{data.file.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {(data.file.size / 1024).toFixed(1)} KB • Click or drag to change file
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                                                    <TbCloudUpload className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    Click to select or drag and drop a file here
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Supported formats: .zip (full package), .csv, .json, .xlsx, .xml
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic notice when ZIP is selected */}
                                {isZipSelected && (
                                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs leading-relaxed flex items-start gap-3">
                                        <TbFileZip className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="font-semibold block text-sm text-indigo-950 mb-0.5">Full Package Mode Detected</strong>
                                            This ZIP package will automatically extract and link all related tables (e.g. posts, meta, attributes, variations, media) and safely restore all images to the system uploads folder.
                                        </div>
                                    </div>
                                )}

                                {/* Table selector (only if not a zip) */}
                                {!isZipSelected && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Target Database Table
                                        </label>
                                        <select
                                            value={data.table}
                                            onChange={(e) => setData('table', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            {tables.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        {errors.table && <p className="text-red-600 text-xs mt-1.5">{errors.table}</p>}
                                    </div>
                                )}

                                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing || !data.file}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                </svg>
                                                Importing Data...
                                            </>
                                        ) : (
                                            <>
                                                <TbDatabaseImport className="w-4 h-4" />
                                                Start Import
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Tab 2: Available Packages in Storage */}
                {activeTab === 'packages' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Pre-Exported Packages in Storage</h3>
                                    <p className="text-sm text-gray-500">
                                        These export packages were discovered in <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">storage/app/import/</code>. You can import any package with one click.
                                    </p>
                                </div>
                            </div>

                            {existingPackages.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                                    <RiFolderZipLine className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-gray-700">No ZIP packages found in storage/app/import/</p>
                                    <p className="text-xs text-gray-500 mt-1">Export a module or upload a ZIP file above.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {existingPackages.map((pkg) => {
                                        const badge = getPackageBadge(pkg.name);
                                        const isCurrent = importingPackage === pkg.name;

                                        return (
                                            <div 
                                                key={pkg.name} 
                                                className="bg-white border border-gray-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-3">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.bg}`}>
                                                            {badge.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">{pkg.size}</span>
                                                    </div>

                                                    <div className="flex items-start gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <RiFileZipLine className="w-5 h-5" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <h4 className="text-sm font-bold text-gray-900 truncate" title={pkg.name}>
                                                                {pkg.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Updated: {pkg.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                                    <span className="text-[11px] text-gray-400">Full package (with images)</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => triggerImportExistingPackage(pkg.name)}
                                                        disabled={importingPackage !== null}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-all"
                                                    >
                                                        {isCurrent ? (
                                                            <>
                                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                                </svg>
                                                                Importing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TbDatabaseImport className="w-3.5 h-3.5" />
                                                                Import Now
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 3: Export Data */}
                {activeTab === 'export' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8">
                        <div className="max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Export Data & Packages</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Export database records or create full ZIP packages containing metadata, attributes, variations, and physical images.
                            </p>

                            <form onSubmit={handleExport} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Select Table / Module
                                    </label>
                                    <select
                                        value={exportTable}
                                        onChange={(e) => setExportTable(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {tables.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Export Format
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {['csv', 'xlsx', 'json', 'xml'].map((fmt) => (
                                            <button
                                                key={fmt}
                                                type="button"
                                                onClick={() => setExportFormat(fmt)}
                                                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold uppercase tracking-wider transition-all ${
                                                    exportFormat === fmt
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isFullPackage}
                                            onChange={(e) => setIsFullPackage(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-gray-900 block">
                                                Bundle as Complete Export Package (.ZIP)
                                            </span>
                                            <span className="text-xs text-gray-500 block">
                                                Includes related meta, attributes, gallery, and packages physical media files into an <code className="font-mono">images/</code> folder.
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
                                    >
                                        <TbCloudDownload className="w-4 h-4" />
                                        Download Export
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
