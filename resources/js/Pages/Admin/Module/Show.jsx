import React, { useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import ImageViwer from '@/Components/Admin/ImageViwer';
import {
    RiArrowLeftLine, RiEditLine, RiFileCopyLine,
    RiImage2Line, RiInformationLine, RiLayoutGridLine,
    RiPriceTag3Line, RiSettings4Line, RiFolderLine,
    RiListCheck2, RiExternalLinkLine,
} from 'react-icons/ri';

/* ─────────────────────────── helpers ─────────────────────────────────── */
const humanLabel = (key) =>
    String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const isImageValue = (val) => {
    if (typeof val !== 'string') return false;
    return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(val)
        || val.startsWith('/storage/')
        || val.startsWith('http');
};

const SKIP_KEYS = new Set(['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes']);

/* ─────────────────────────── value renderer ──────────────────────────── */
const ValueCell = ({ val }) => {
    const [copied, setCopied] = useState(false);

    if (val === null || val === undefined || val === '') {
        return <span className="text-res/40 italic text-xs">—</span>;
    }

    // Array (taxonomies / badges / collections / variations / gallery / attributes)
    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-res/40 italic text-xs">—</span>;

        // Check if items are image urls
        if (val.every((item) => typeof item === 'string' && isImageValue(item))) {
            return (
                <div className="flex flex-wrap gap-2.5">
                    {val.map((img, i) => (
                        <div key={i} className="group relative">
                            <ImageViwer
                                image={img}
                                className="h-16 w-16 object-cover rounded-lg border border-border/50 bg-bg p-1 shadow-2xs hover:scale-105 transition-transform"
                            />
                        </div>
                    ))}
                </div>
            );
        }

        // Check if array of attributes [{group, key, value}]
        if (val.every((item) => item && typeof item === 'object' && ('key' in item || 'group' in item))) {
            return (
                <div className="flex flex-col gap-1.5 w-full">
                    {val.map((attr, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-bg/80 px-3 py-1.5 rounded-md border border-border/40">
                            <span className="font-semibold text-heading">
                                {attr.group ? `${attr.group} › ` : ''}{attr.key || attr.name}
                            </span>
                            <span className="text-res font-medium">{attr.value}</span>
                        </div>
                    ))}
                </div>
            );
        }

        // Regular badges / entity pills (category, collection, tags, etc.)
        return (
            <div className="flex flex-wrap gap-1.5">
                {val.map((item, i) => {
                    const label = item?.title ?? item?.name ?? item?.label
                        ?? (typeof item === 'string' ? item : (typeof item === 'number' ? `#${item}` : JSON.stringify(item)));
                    const img = item?.image ?? null;
                    return (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold border border-primary/15"
                        >
                            {img && <ImageViwer image={img} className="size-4 rounded-full object-cover" />}
                            {label}
                        </span>
                    );
                })}
            </div>
        );
    }

    // Single Object (resolved relation entity e.g. brand, store, category)
    if (typeof val === 'object' && val !== null) {
        if ('title' in val || 'name' in val || 'label' in val) {
            const label = val.title || val.name || val.label;
            const img = val.image || null;
            return (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold border border-primary/15">
                    {img && <ImageViwer image={img} className="size-4 rounded-full object-cover" />}
                    {label}
                </span>
            );
        }
        // Pretty JSON for raw objects
        return (
            <pre className="text-xs bg-bg rounded p-2 overflow-x-auto max-h-40 text-res font-mono whitespace-pre-wrap">
                {JSON.stringify(val, null, 2)}
            </pre>
        );
    }

    // Image file
    if (isImageValue(val)) {
        return (
            <div className="flex items-center gap-3">
                <ImageViwer image={val} className="h-14 w-auto max-w-[120px] object-contain rounded border border-border/40 bg-bg p-1" />
                <span className="text-xs text-res truncate max-w-[200px]">{val}</span>
            </div>
        );
    }

    const strVal = String(val);

    // HTML prose
    if (/<[a-z][\s\S]*>/i.test(strVal)) {
        return (
            <div
                className="prose prose-xs max-w-none text-text [&_*]:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: strVal }}
            />
        );
    }

    // Status badge
    const statusMap = {
        publish: { label: 'Published', cls: 'bg-emerald-100 text-emerald-700' },
        published: { label: 'Published', cls: 'bg-emerald-100 text-emerald-700' },
        active: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' },
        draft: { label: 'Draft', cls: 'bg-amber-100 text-amber-700' },
        pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
        inactive: { label: 'Inactive', cls: 'bg-red-100 text-red-600' },
        rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-600' },
        '1': { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' },
        '0': { label: 'Inactive', cls: 'bg-red-100 text-red-600' },
    };
    if (statusMap[strVal.toLowerCase()]) {
        const { label, cls } = statusMap[strVal.toLowerCase()];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
                <span className="size-1.5 rounded-full bg-current" />
                {label}
            </span>
        );
    }

    // Boolean-like
    if (strVal === 'true' || strVal === 'false') {
        const ok = strVal === 'true';
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {ok ? 'Yes' : 'No'}
            </span>
        );
    }

    // Copyable
    const handleCopy = () => {
        navigator.clipboard.writeText(strVal).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    return (
        <span className="group inline-flex items-start gap-2 max-w-full">
            <span className="break-all text-sm font-medium text-text">{strVal}</span>
            {strVal.length > 20 && (
                <button
                    onClick={handleCopy}
                    title="Copy"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded text-res hover:text-primary mt-0.5"
                >
                    {copied ? '✓' : <RiFileCopyLine className="text-sm" />}
                </button>
            )}
        </span>
    );
};

/* ─────────────────────────── schema builder ──────────────────────────── */
function buildSchemaSections(showSchema, formSchema, tableSchema, record) {
    const fieldLabelMap = {};
    const fieldStyleMap = {};
    const schemaSections = [];
    const assignedKeys = new Set();

    // Determine the source sections: prefer showSchema if present, otherwise fall back to formSchema
    let sourceSections = [];
    if (showSchema) {
        if (Array.isArray(showSchema)) {
            sourceSections = showSchema;
        } else if (Array.isArray(showSchema.sections)) {
            sourceSections = showSchema.sections;
        }
    } else if (Array.isArray(formSchema) && formSchema.length > 0) {
        sourceSections = formSchema;
    }

    // 1. Map sections & field labels from schema
    if (Array.isArray(sourceSections) && sourceSections.length > 0) {
        sourceSections.forEach((sec, idx) => {
            const secTitle = sec.title || (sec.tab ? `${sec.tab}` : `Section ${idx + 1}`);
            const secRows = [];

            (sec.fields || []).forEach((f) => {
                const name = f.name;
                if (!name) return;
                fieldLabelMap[name] = f.label || humanLabel(name);
                fieldStyleMap[name] = f.type;

                if (name in (record || {})) {
                    secRows.push({
                        key: name,
                        label: f.label || humanLabel(name),
                        val: record[name],
                        type: f.type,
                    });
                    assignedKeys.add(name);
                }
            });

            if (secRows.length > 0) {
                schemaSections.push({
                    id: `sec-${idx}`,
                    label: secTitle,
                    style: sec.style || 'main',
                    tab: sec.tab || null,
                    rows: secRows,
                });
            }
        });
    }

    // 2. Also read table schema columns for labels
    if (tableSchema?.columns && Array.isArray(tableSchema.columns)) {
        tableSchema.columns.forEach((col) => {
            const k = col.column || col.id;
            if (k && !fieldLabelMap[k] && col.label) {
                fieldLabelMap[k] = col.label;
            }
        });
    }

    // 3. Catch-all for remaining record keys (e.g. id, timestamps, unmapped meta)
    const remainingRows = [];
    Object.entries(record || {}).forEach(([key, val]) => {
        if (SKIP_KEYS.has(key)) return;
        if (assignedKeys.has(key)) return;
        remainingRows.push({
            key,
            label: fieldLabelMap[key] || humanLabel(key),
            val,
        });
    });

    if (remainingRows.length > 0) {
        schemaSections.push({
            id: 'sec-extra',
            label: 'System & Additional Info',
            style: 'main',
            rows: remainingRows,
        });
    }

    return { sections: schemaSections, fieldLabelMap };
}

/* ─────────────────────────── section card component ─────────────────── */
const SectionCard = ({ section }) => {
    const { label, rows, tab } = section;
    if (!rows || rows.length === 0) return null;

    return (
        <div className="bg-accent rounded-lg border border-border/50 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-5 py-3.5 bg-bg/70 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <RiFolderLine className="text-primary text-base shrink-0" />
                    <h2 className="text-xs font-bold text-heading uppercase tracking-wider">{label}</h2>
                    {tab && (
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {tab}
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-res bg-border/40 px-2 py-0.5 rounded-full font-medium">
                    {rows.length} {rows.length === 1 ? 'item' : 'items'}
                </span>
            </div>
            <table className="w-full text-left border-collapse">
                <tbody>
                    {rows.map(({ key, label: fieldLabel, val }, idx) => (
                        <tr
                            key={key}
                            className={`border-b border-border/30 last:border-0 transition-colors hover:bg-primary/[0.02]
                                ${idx % 2 === 0 ? 'bg-accent' : 'bg-bg/30'}`}
                        >
                            <td className="w-[32%] sm:w-[28%] px-5 py-3.5 align-top">
                                <span className="text-[11px] font-semibold text-res uppercase tracking-wide">
                                    {fieldLabel}
                                </span>
                            </td>
                            <td className="px-5 py-3.5 align-top">
                                <ValueCell val={val} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/* ─────────────────────────── main page ──────────────────────────────── */
const ModuleShow = ({ record, type, id, showSchema, formSchema, tableSchema }) => {
    const { sections } = useMemo(
        () => buildSchemaSections(showSchema, formSchema, tableSchema, record),
        [showSchema, formSchema, tableSchema, record]
    );

    const title = record?.title ?? record?.name ?? `#${id}`;
    const image = record?.image ?? null;
    const typePretty = String(type).charAt(0).toUpperCase() + String(type).slice(1);

    // Sidebar sections vs Main sections
    const sidebarSections = sections.filter((s) => s.style === 'sidebar');
    const mainSections = sections.filter((s) => s.style !== 'sidebar');

    return (
        <div className="min-h-screen bg-bg p-5 flex flex-col gap-5">
            {/* ── Top Header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('module.index', { type })}
                        className="p-2 rounded-lg bg-accent border border-border/50 text-res hover:text-primary hover:border-primary/40 transition-colors shadow-2xs"
                    >
                        <RiArrowLeftLine className="text-lg" />
                    </Link>
                    <div>
                        <p className="text-[11px] uppercase tracking-widest font-semibold text-res/60">
                            {typePretty} &rsaquo; View Details
                        </p>
                        <h1 className="text-xl font-bold text-heading leading-tight">{title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Link
                        href={route('module.edit', { type, id })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                    >
                        <RiEditLine />
                        Edit Record
                    </Link>
                </div>
            </div>

            {/* ── Layout Grid ────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row gap-5 items-start">
                {/* LEFT / SIDEBAR: Identity & Sidebar schema sections */}
                <div className="lg:w-80 w-full shrink-0 flex flex-col gap-4">
                    {/* Identity Card */}
                    <div className="bg-accent rounded-lg border border-border/50 p-4 flex flex-col items-center gap-3 shadow-2xs">
                        {image ? (
                            <ImageViwer image={image} className="w-full max-h-52 object-contain rounded-lg border border-border/30 bg-bg p-1" />
                        ) : (
                            <div className="w-full h-36 rounded-lg bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center justify-center">
                                <span className="text-6xl font-extrabold text-primary/20 select-none">
                                    {String(title).charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="w-full text-center border-t border-border/40 pt-3">
                            <p className="text-sm font-bold text-heading leading-snug">{title}</p>
                            <p className="text-[11px] text-res mt-0.5">{typePretty} · ID #{id}</p>
                            {record?.status && (
                                <div className="mt-2">
                                    <ValueCell val={record.status} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Metadata summary - dynamic from first few key fields */}
                    {(() => {
                        // Pick informative preview keys from table schema or record
                        const candidateKeys = tableSchema?.columns
                            ? tableSchema.columns
                                .map(c => c.column || c.id)
                                .filter(k => !['id', 'image', 'action', 'status', 'title', 'name'].includes(k))
                            : ['email', 'phone', 'role', 'roles', 'parent_id', 'parent', 'sku', 'category', 'brand'];

                        const previewRows = candidateKeys
                            .filter(k => k in (record || {}) && record[k] !== null && record[k] !== '' && (!Array.isArray(record[k]) || record[k].length > 0))
                            .slice(0, 5);

                        if (previewRows.length === 0 && !record?.created_at) return null;

                        return (
                            <div className="bg-accent rounded-lg border border-border/50 p-4 shadow-2xs">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-res/60 pb-2 border-b border-border/30 mb-2">
                                    Quick Summary
                                </p>
                                <div className="flex flex-col gap-2 text-xs">
                                    {previewRows.map((key) => {
                                        const colMeta = tableSchema?.columns?.find(c => (c.column || c.id) === key);
                                        const label = colMeta?.label || humanLabel(key);
                                        return (
                                            <div key={key} className="flex justify-between items-center py-1 border-b border-border/20 last:border-0 gap-2">
                                                <span className="text-res font-medium shrink-0">{label}</span>
                                                <div className="text-right">
                                                    <ValueCell val={record[key]} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {record?.created_at && (
                                        <div className="flex justify-between items-center py-1 border-b border-border/20 last:border-0">
                                            <span className="text-res font-medium">Created</span>
                                            <span className="text-res">{new Date(record.created_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Render sidebar sections from schema */}
                    {sidebarSections.map((sec) => (
                        <SectionCard key={sec.id} section={sec} />
                    ))}
                </div>

                {/* RIGHT / MAIN: Schema-driven sections */}
                <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">
                    {mainSections.map((sec) => (
                        <SectionCard key={sec.id} section={sec} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModuleShow;
ModuleShow.layout = (page) => <AdminLayout title="View Details">{page}</AdminLayout>;
