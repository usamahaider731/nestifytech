import AdminLayout from '@/Layouts/AdminLayout';
import React, { useState, useCallback } from 'react';
import { router, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    RiMailUnreadLine, RiMailCheckLine, RiSearchLine, RiDeleteBinLine,
    RiCloseLine, RiLoader4Line, RiSettings3Line, RiUserLine,
    RiMailLine, RiPhoneLine, RiCalendarLine, RiReplyLine, RiArchiveLine,
    RiShieldKeyholeLine, RiStarLine, RiStarFill, RiAlertLine,
    RiDownloadLine, RiCheckboxLine, RiCheckboxBlankLine, RiFilterLine,
    RiWhatsappLine, RiSendPlaneLine, RiTimeLine, RiUserReceivedLine,
    RiMailSendLine, RiEyeLine, RiArrowUpLine, RiSparkling2Line,
} from 'react-icons/ri';
import { toast } from 'react-toastify';

const PRIORITY_BADGE = {
    urgent: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    normal: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    low:    'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};
const PRIORITY_LABEL = { urgent: '🔴 Urgent', normal: '🟡 Normal', low: '⚪ Low' };

const STATUS_BADGES = {
    new:      'text-blue-500 bg-blue-500/10 border-blue-500/20',
    read:     'text-amber-500 bg-amber-500/10 border-amber-500/20',
    replied:  'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    archived: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

export default function ContactInquiriesIndex({
    inquiries = {},
    stats = {},
    filters = {},
    contactSettings = {},
}) {
    const [search, setSearch]           = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [starredFilter, setStarredFilter]   = useState(filters.starred === 'true');
    const [activeInquiry, setActiveInquiry]   = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [deletingId, setDeletingId]   = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [adminNotes, setAdminNotes]   = useState('');
    const [adminReply, setAdminReply]   = useState('');
    const [newStatus, setNewStatus]     = useState('');
    const [newPriority, setNewPriority] = useState('normal');
    const [assignedTo, setAssignedTo]   = useState('');
    const [sendReplyEmail, setSendReplyEmail] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [starringId, setStarringId]   = useState(null);
    const [isGeneratingAiReply, setIsGeneratingAiReply] = useState(false);
    const [aiTone, setAiTone] = useState('professional');
    const [detectedSentiment, setDetectedSentiment] = useState(null);

    const handleGenerateAiReply = async () => {
        if (!activeInquiry) return;
        setIsGeneratingAiReply(true);
        try {
            const url = typeof route === 'function' && route().has('admin.contact.ai-reply')
                ? route('admin.contact.ai-reply', activeInquiry.id)
                : `/admin/contact-inquiries/${activeInquiry.id}/ai-reply`;

            const res = await axios.post(url, {
                tone: aiTone,
            });
            if (res.data?.success && res.data?.reply) {
                setAdminReply(res.data.reply);
                if (res.data.sentiment) {
                    setDetectedSentiment(res.data.sentiment);
                }
                toast.success('AI draft reply generated! You can review or edit before sending.');
            } else {
                toast.error(res.data?.message || 'Could not generate AI draft.');
            }
        } catch (err) {
            toast.error('Failed to connect to AI reply service.');
        } finally {
            setIsGeneratingAiReply(false);
        }
    };

    // Settings form
    const [settingsForm, setSettingsForm] = useState({
        recipient_email:   contactSettings.recipient_email || '',
        autoreply_enabled: contactSettings.autoreply_enabled ?? true,
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const inquiriesList = inquiries?.data || [];
    const allIds        = inquiriesList.map((i) => i.id);
    const allSelected   = selectedIds.length > 0 && selectedIds.length === allIds.length;

    // ─── Routing helpers ───────────────────────────────────────────────
    const applyFilters = useCallback((overrides = {}) => {
        const params = {
            search:   overrides.search   ?? (search || undefined),
            status:   overrides.status   ?? (statusFilter !== 'all' ? statusFilter : undefined),
            priority: overrides.priority ?? (priorityFilter !== 'all' ? priorityFilter : undefined),
            starred:  overrides.starred  ?? (starredFilter ? 'true' : undefined),
        };
        router.get(route('admin.contact.index'), params, { preserveState: true, replace: true });
    }, [search, statusFilter, priorityFilter, starredFilter]);

    const handleSearchSubmit = (e) => { e.preventDefault(); applyFilters(); };

    const handleStatusChange = (st) => {
        setStatusFilter(st);
        applyFilters({ status: st !== 'all' ? st : undefined });
    };

    const handlePriorityChange = (p) => {
        setPriorityFilter(p);
        applyFilters({ priority: p !== 'all' ? p : undefined });
    };

    const toggleStarFilter = () => {
        const next = !starredFilter;
        setStarredFilter(next);
        applyFilters({ starred: next ? 'true' : undefined });
    };

    // ─── Open modal ────────────────────────────────────────────────────
    const openInquiryModal = (inq) => {
        setActiveInquiry(inq);
        setAdminNotes(inq.admin_notes || '');
        setAdminReply(inq.admin_reply || '');
        setNewStatus(inq.status);
        setNewPriority(inq.priority || 'normal');
        setAssignedTo(inq.assigned_to || '');
        setSendReplyEmail(true);

        if (inq.status === 'new') {
            router.put(route('admin.contact.update', inq.id), {
                status: 'read', admin_notes: inq.admin_notes,
                priority: inq.priority || 'normal',
                is_starred: inq.is_starred,
            }, {
                preserveScroll: true, preserveState: true,
                onSuccess: () => setActiveInquiry((prev) => prev ? { ...prev, status: 'read' } : null),
            });
        }
    };

    // ─── Save inquiry update ────────────────────────────────────────────
    const handleUpdateInquiry = (e) => {
        e.preventDefault();
        if (!activeInquiry) return;
        setUpdatingStatus(true);

        router.put(route('admin.contact.update', activeInquiry.id), {
            status:       newStatus,
            admin_notes:  adminNotes,
            admin_reply:  sendReplyEmail ? adminReply : '',
            priority:     newPriority,
            is_starred:   activeInquiry.is_starred,
            assigned_to:  assignedTo,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Inquiry updated' + (adminReply && sendReplyEmail ? ' & reply sent ✉️' : ''));
                setActiveInquiry(null);
            },
            onError: () => toast.error('Failed to update inquiry'),
            onFinish: () => setUpdatingStatus(false),
        });
    };

    // ─── Delete single ──────────────────────────────────────────────────
    const handleDelete = (id) => {
        if (!window.confirm('Delete this inquiry? This cannot be undone.')) return;
        setDeletingId(id);
        router.delete(route('admin.contact.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Inquiry deleted');
                if (activeInquiry?.id === id) setActiveInquiry(null);
                setSelectedIds((prev) => prev.filter((x) => x !== id));
            },
            onError: () => toast.error('Delete failed'),
            onFinish: () => setDeletingId(null),
        });
    };

    // ─── Star toggle (AJAX) ─────────────────────────────────────────────
    const handleToggleStar = async (inq, e) => {
        e?.stopPropagation();
        setStarringId(inq.id);
        try {
            const res = await axios.post(route('admin.contact.toggle-star', inq.id));
            toast.success(res.data.is_starred ? '⭐ Starred' : 'Unstarred');
            router.reload({ only: ['inquiries', 'stats'] });
        } catch {
            toast.error('Failed to toggle star');
        } finally {
            setStarringId(null);
        }
    };

    // ─── Bulk selection ─────────────────────────────────────────────────
    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? [] : [...allIds]);
    };

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // ─── Bulk action ────────────────────────────────────────────────────
    const handleBulkAction = (action) => {
        if (selectedIds.length === 0) { toast.warning('Select at least one inquiry'); return; }
        if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} inquiries?`)) return;

        setBulkLoading(true);
        router.post(route('admin.contact.bulk'), { action, ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Bulk action completed');
                setSelectedIds([]);
            },
            onError: () => toast.error('Bulk action failed'),
            onFinish: () => setBulkLoading(false),
        });
    };

    // ─── Save settings ──────────────────────────────────────────────────
    const handleSaveSettings = (e) => {
        e.preventDefault();
        setSavingSettings(true);
        router.post(route('admin.contact.settings'), settingsForm, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Settings saved'); setShowSettingsModal(false); },
            onError: () => toast.error('Failed to save settings'),
            onFinish: () => setSavingSettings(false),
        });
    };

    // ─── Response time helper ───────────────────────────────────────────
    const responseTime = (inq) => {
        if (!inq.replied_at || !inq.created_at) return null;
        const diff = new Date(inq.replied_at) - new Date(inq.created_at);
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return '< 1 hour';
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    return (
        <div className="space-y-6">
            {/* ─── Top Header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-heading font-oswald uppercase tracking-tight flex items-center gap-2">
                        <RiMailUnreadLine className="text-primary" />
                        Contact Support Inbox
                        {stats.new > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                                {stats.new}
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-res/70 mt-1">
                        Manage client inquiries, send replies directly from panel, set priorities and track response times.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <a
                        href={route('admin.contact.export')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dynamic/40 hover:bg-dynamic/70 text-heading border border-border/60 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <RiDownloadLine size={15} className="text-emerald-500" />
                        Export CSV
                    </a>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dynamic/40 hover:bg-dynamic/70 text-heading border border-border/60 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <RiSettings3Line size={15} className="text-primary" />
                        Email Settings
                    </button>
                    <Link
                        href="/page/contact-us"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm shadow-primary/25"
                    >
                        View Contact Page
                    </Link>
                </div>
            </div>

            {/* ─── Stat Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-heading', border: 'border-border/60' },
                    { label: 'New', value: stats.new, color: 'text-blue-500', border: 'border-blue-500/20' },
                    { label: 'Read', value: stats.read, color: 'text-amber-500', border: 'border-amber-500/20' },
                    { label: 'Replied', value: stats.replied, color: 'text-emerald-500', border: 'border-emerald-500/20' },
                    { label: 'Archived', value: stats.archived, color: 'text-zinc-400', border: 'border-zinc-500/20' },
                    { label: 'Urgent', value: stats.urgent, color: 'text-rose-500', border: 'border-rose-500/20' },
                    { label: 'Starred', value: stats.starred, color: 'text-yellow-500', border: 'border-yellow-500/20' },
                ].map(({ label, value, color, border }) => (
                    <div key={label} className={`bg-bg rounded-2xl border ${border} p-3 shadow-2xs`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}/70`}>{label}</span>
                        <div className={`text-xl font-black font-oswald ${color} mt-0.5`}>{value ?? 0}</div>
                    </div>
                ))}
            </div>

            {/* ─── Filters ────────────────────────────────────────────── */}
            <div className="bg-bg rounded-2xl border border-border/60 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status tabs */}
                    <div className="flex flex-wrap gap-1">
                        {['all', 'new', 'read', 'replied', 'archived'].map((st) => (
                            <button key={st}
                                onClick={() => handleStatusChange(st)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    statusFilter === st ? 'bg-primary text-white shadow-xs' : 'text-res/80 hover:text-heading hover:bg-dynamic/40'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    {/* Priority filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-[11px] border border-border/60 bg-dynamic/20 text-heading focus:outline-none focus:border-primary"
                    >
                        <option value="all">All Priorities</option>
                        <option value="urgent">🔴 Urgent</option>
                        <option value="normal">🟡 Normal</option>
                        <option value="low">⚪ Low</option>
                    </select>

                    {/* Starred filter */}
                    <button
                        onClick={toggleStarFilter}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            starredFilter ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'text-res/70 border-border/40 hover:bg-dynamic/40'
                        }`}
                    >
                        <RiStarFill size={13} />
                        Starred
                    </button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-res/50">
                        <RiSearchLine size={16} />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, subject..."
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border/60 bg-dynamic/20 text-heading focus:outline-none focus:border-primary"
                    />
                </form>
            </div>

            {/* ─── Bulk Action Bar ─────────────────────────────────────── */}
            {selectedIds.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-primary">{selectedIds.length} selected</span>
                    {[
                        { label: 'Mark Read', action: 'mark_read', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
                        { label: 'Mark Replied', action: 'mark_replied', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
                        { label: 'Archive', action: 'archive', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
                        { label: '⭐ Star', action: 'mark_starred', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
                        { label: 'Delete', action: 'delete', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
                    ].map(({ label, action, color }) => (
                        <button key={action}
                            onClick={() => handleBulkAction(action)}
                            disabled={bulkLoading}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50 ${color}`}
                        >
                            {label}
                        </button>
                    ))}
                    <button onClick={() => setSelectedIds([])} className="ml-auto text-xs text-res/70 hover:text-heading">
                        <RiCloseLine size={16} />
                    </button>
                </div>
            )}

            {/* ─── Inquiries Table ─────────────────────────────────────── */}
            <div className="bg-bg rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-border/60 bg-dynamic/30 font-bold uppercase tracking-wider text-res/70">
                                <th className="p-4 w-10">
                                    <button onClick={toggleSelectAll} className="text-res/70 hover:text-primary">
                                        {allSelected ? <RiCheckboxLine size={18} className="text-primary" /> : <RiCheckboxBlankLine size={18} />}
                                    </button>
                                </th>
                                <th className="p-4">Sender</th>
                                <th className="p-4">Subject & Preview</th>
                                <th className="p-4">Priority</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {inquiriesList.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-10 text-center text-res/60">
                                        No inquiries found matching selected filters.
                                    </td>
                                </tr>
                            ) : (
                                inquiriesList.map((inq) => (
                                    <tr
                                        key={inq.id}
                                        onClick={() => openInquiryModal(inq)}
                                        className={`hover:bg-dynamic/25 transition-colors cursor-pointer ${
                                            inq.status === 'new' ? 'font-semibold bg-primary/[0.02]' : ''
                                        } ${inq.priority === 'urgent' ? 'border-l-2 border-l-rose-500' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <td className="p-4" onClick={(e) => toggleSelect(inq.id, e)}>
                                            {selectedIds.includes(inq.id)
                                                ? <RiCheckboxLine size={18} className="text-primary" />
                                                : <RiCheckboxBlankLine size={18} className="text-res/40 hover:text-primary" />
                                            }
                                        </td>

                                        {/* Sender */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                        {inq.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {inq.is_starred && (
                                                        <RiStarFill size={10} className="absolute -top-0.5 -right-0.5 text-yellow-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-heading truncate">{inq.name}</div>
                                                    <div className="text-[11px] text-res/70 truncate flex items-center gap-1">
                                                        <RiMailLine size={11} />{inq.email}
                                                    </div>
                                                    {inq.phone && (
                                                        <div className="text-[10px] text-res/60 flex items-center gap-1 mt-0.5">
                                                            <RiPhoneLine size={10} />{inq.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Subject + Preview */}
                                        <td className="p-4 max-w-xs">
                                            <div className="text-xs font-bold text-heading truncate">
                                                {inq.subject || 'General Contact Request'}
                                            </div>
                                            <div className="text-[11px] text-res/60 truncate mt-0.5">{inq.message}</div>
                                            {inq.replied_at && (
                                                <div className="text-[10px] text-emerald-500 flex items-center gap-1 mt-0.5">
                                                    <RiTimeLine size={10} /> Replied in {responseTime(inq)}
                                                </div>
                                            )}
                                        </td>

                                        {/* Priority */}
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                PRIORITY_BADGE[inq.priority || 'normal']
                                            }`}>
                                                {inq.priority || 'normal'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                STATUS_BADGES[inq.status] || STATUS_BADGES.new
                                            }`}>
                                                {inq.status}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="p-4 whitespace-nowrap text-res/70 text-[11px]">
                                            {new Date(inq.created_at).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                            })}
                                            <div className="text-[10px] text-res/50">
                                                {new Date(inq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    onClick={(e) => handleToggleStar(inq, e)}
                                                    disabled={starringId === inq.id}
                                                    className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-res hover:text-yellow-500 transition-all"
                                                    title="Toggle Star"
                                                >
                                                    {inq.is_starred
                                                        ? <RiStarFill size={15} className="text-yellow-500" />
                                                        : <RiStarLine size={15} />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => openInquiryModal(inq)}
                                                    className="p-1.5 rounded-lg hover:bg-primary/10 text-res hover:text-primary transition-all"
                                                    title="View & Reply"
                                                >
                                                    <RiEyeLine size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inq.id)}
                                                    disabled={deletingId === inq.id}
                                                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-res hover:text-rose-500 transition-all"
                                                    title="Delete"
                                                >
                                                    {deletingId === inq.id
                                                        ? <RiLoader4Line size={15} className="animate-spin text-rose-500" />
                                                        : <RiDeleteBinLine size={15} />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {inquiries?.links && inquiries.links.length > 3 && (
                    <div className="p-4 border-t border-border/40 flex items-center justify-between">
                        <span className="text-xs text-res/70">
                            Showing {inquiries.from ?? 0}–{inquiries.to ?? 0} of {inquiries.total ?? 0}
                        </span>
                        <div className="flex items-center gap-1">
                            {inquiries.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                        link.active ? 'bg-primary text-white'
                                        : link.url ? 'text-res hover:bg-dynamic/50'
                                        : 'text-res/30 pointer-events-none'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Modal: View & Reply ──────────────────────────────────── */}
            {activeInquiry && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setActiveInquiry(null)}>
                    <div className="bg-bg rounded-2xl border border-border/80 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-5 animate-scaleIn" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-border/50 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGES[activeInquiry.status]}`}>
                                        {activeInquiry.status}
                                    </span>
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_BADGE[activeInquiry.priority || 'normal']}`}>
                                        {PRIORITY_LABEL[activeInquiry.priority || 'normal']}
                                    </span>
                                    {activeInquiry.is_starred && <RiStarFill size={16} className="text-yellow-500" />}
                                </div>
                                <h3 className="text-xl font-bold text-heading font-oswald">
                                    {activeInquiry.subject || 'Client Inquiry'}
                                </h3>
                            </div>
                            <button onClick={() => setActiveInquiry(null)} className="p-1.5 rounded-lg hover:bg-dynamic/60 text-res shrink-0">
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        {/* Client Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-dynamic/20 text-xs">
                            <div>
                                <span className="text-res/60 font-semibold block uppercase text-[10px] mb-0.5">Client Name</span>
                                <span className="font-bold text-heading text-sm">{activeInquiry.name}</span>
                            </div>
                            <div>
                                <span className="text-res/60 font-semibold block uppercase text-[10px] mb-0.5">Email</span>
                                <a href={`mailto:${activeInquiry.email}`} className="font-bold text-primary hover:underline">{activeInquiry.email}</a>
                            </div>
                            {activeInquiry.phone && (
                                <div>
                                    <span className="text-res/60 font-semibold block uppercase text-[10px] mb-0.5">Phone</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-heading">{activeInquiry.phone}</span>
                                        <a
                                            href={`https://wa.me/${activeInquiry.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <RiWhatsappLine size={12} /> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div>
                                <span className="text-res/60 font-semibold block uppercase text-[10px] mb-0.5">Received</span>
                                <span className="text-heading">{new Date(activeInquiry.created_at).toLocaleString()}</span>
                            </div>
                            {activeInquiry.replied_at && (
                                <div className="col-span-2">
                                    <span className="text-res/60 font-semibold block uppercase text-[10px] mb-0.5">Replied At</span>
                                    <span className="text-emerald-500 font-semibold">
                                        {new Date(activeInquiry.replied_at).toLocaleString()} · Response time: {responseTime(activeInquiry)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">Client Message</label>
                            <div className="p-4 rounded-xl border border-border/60 bg-dynamic/10 text-sm text-heading leading-relaxed whitespace-pre-line">
                                {activeInquiry.message}
                            </div>
                        </div>

                        {/* Quick action links */}
                        <div className="flex flex-wrap gap-2">
                            <a
                                href={`mailto:${activeInquiry.email}?subject=Re:%20${encodeURIComponent(activeInquiry.subject || 'Your Inquiry at NestifyTech')}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all border border-primary/20"
                            >
                                <RiMailSendLine size={14} /> Open Email Client
                            </a>
                            {activeInquiry.phone && (
                                <a
                                    href={`https://wa.me/${activeInquiry.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                >
                                    <RiWhatsappLine size={14} /> WhatsApp Chat
                                </a>
                            )}
                        </div>

                        {/* Update form */}
                        <form onSubmit={handleUpdateInquiry} className="space-y-4 pt-4 border-t border-border/40">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Status */}
                                <div>
                                    <label className="block text-[10px] font-bold text-heading uppercase tracking-wider mb-1.5">Status</label>
                                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border/60 bg-dynamic/20 text-xs text-heading focus:outline-none focus:border-primary">
                                        <option value="new">New / Unread</option>
                                        <option value="read">Read / In Progress</option>
                                        <option value="replied">Replied / Resolved</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-[10px] font-bold text-heading uppercase tracking-wider mb-1.5">Priority</label>
                                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border/60 bg-dynamic/20 text-xs text-heading focus:outline-none focus:border-primary">
                                        <option value="urgent">🔴 Urgent</option>
                                        <option value="normal">🟡 Normal</option>
                                        <option value="low">⚪ Low</option>
                                    </select>
                                </div>

                                {/* Assigned To */}
                                <div>
                                    <label className="block text-[10px] font-bold text-heading uppercase tracking-wider mb-1.5">Assigned To</label>
                                    <input
                                        type="text"
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                        placeholder="Staff name or email"
                                        className="w-full px-3 py-2 rounded-xl border border-border/60 bg-dynamic/20 text-xs text-heading focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div>
                                <label className="block text-[10px] font-bold text-heading uppercase tracking-wider mb-1.5">Internal Notes (Private)</label>
                                <textarea rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Private staff notes — not visible to customer..."
                                    className="w-full p-3 rounded-xl border border-border/60 bg-dynamic/20 text-xs text-heading focus:outline-none focus:border-primary resize-none"
                                />
                            </div>

                            {/* Reply to Customer */}
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <label className="text-[10px] font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                        <RiReplyLine size={14} className="text-primary" />
                                        Reply to Customer (Email)
                                    </label>

                                    {/* AI Draft Reply Controls */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={aiTone}
                                            onChange={(e) => setAiTone(e.target.value)}
                                            className="px-2 py-1 text-[11px] rounded-lg border border-border/60 bg-bg text-heading focus:outline-none"
                                            title="AI Tone"
                                        >
                                            <option value="professional">Tone: Professional</option>
                                            <option value="friendly">Tone: Friendly</option>
                                            <option value="apologetic">Tone: Apologetic (Issue)</option>
                                            <option value="sales">Tone: Sales / Quote</option>
                                        </select>

                                        <button
                                            type="button"
                                            disabled={isGeneratingAiReply}
                                            onClick={handleGenerateAiReply}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50"
                                            title="Generate automatic reply using store AI context"
                                        >
                                            {isGeneratingAiReply ? (
                                                <RiLoader4Line size={12} className="animate-spin" />
                                            ) : (
                                                <RiSparkling2Line size={12} />
                                            )}
                                            <span>{isGeneratingAiReply ? 'Drafting...' : '✨ AI Draft Reply'}</span>
                                        </button>
                                    </div>
                                </div>

                                {detectedSentiment && (
                                    <div className="mb-2 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] flex items-center gap-1.5">
                                        <RiSparkling2Line size={12} />
                                        <span>AI Sentiment Detected: <strong>{detectedSentiment}</strong></span>
                                    </div>
                                )}

                                <textarea rows={4} value={adminReply} onChange={(e) => setAdminReply(e.target.value)}
                                    placeholder="Type your reply here or click 'AI Draft Reply' to generate a response instantly... Customer will receive this via email when you save."
                                    className="w-full p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs text-heading focus:outline-none focus:border-primary resize-none"
                                />
                                {adminReply && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" id="send_reply_email" checked={sendReplyEmail}
                                            onChange={(e) => setSendReplyEmail(e.target.checked)}
                                            className="w-4 h-4 rounded text-primary focus:ring-primary/20" />
                                        <label htmlFor="send_reply_email" className="text-xs cursor-pointer text-res/80">
                                            Send this reply via email to <strong>{activeInquiry.email}</strong>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setActiveInquiry(null)}
                                    className="px-4 py-2 rounded-xl border border-border/60 text-xs font-bold text-res hover:text-heading">
                                    Close
                                </button>
                                <button type="submit" disabled={updatingStatus}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50">
                                    {updatingStatus
                                        ? <><RiLoader4Line size={14} className="animate-spin" /> Saving...</>
                                        : <><RiSendPlaneLine size={14} /> {adminReply && sendReplyEmail ? 'Save & Send Reply' : 'Save Changes'}</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Modal: Email Settings ───────────────────────────────── */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
                    <div className="bg-bg rounded-2xl border border-border/80 w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-heading font-oswald flex items-center gap-2">
                                    <RiShieldKeyholeLine className="text-primary" />
                                    Contact Email Settings
                                </h3>
                                <p className="text-xs text-res/70 mt-0.5">Configure where client emails are delivered.</p>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="p-1.5 rounded-lg hover:bg-dynamic/60 text-res">
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        {/* SMTP Status */}
                        <div className="p-4 rounded-xl bg-dynamic/20 border border-border/60 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-res/70 font-semibold">Mail Dispatch:</span>
                                <span className={`font-bold ${contactSettings.mail_enabled ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {contactSettings.mail_enabled ? '● Active' : '○ Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-res/70 font-semibold">SMTP Host:</span>
                                <span className="font-mono text-heading">{contactSettings.mail_host}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-res/70 font-semibold">From Address:</span>
                                <span className="font-mono text-heading">{contactSettings.mail_from_address}</span>
                            </div>
                            <div className="pt-2 text-[11px] text-res/60 border-t border-border/40 flex items-center justify-between">
                                <span>Full SMTP credentials:</span>
                                <Link href={route('admin.setting', { type: 'mail' })} className="text-primary font-bold hover:underline">
                                    Email Settings →
                                </Link>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                                    Contact Recipient Email (Admin Inbox)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-res/60">
                                        <RiMailLine size={18} />
                                    </span>
                                    <input type="email" required
                                        value={settingsForm.recipient_email}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, recipient_email: e.target.value })}
                                        placeholder="support@nestifytech.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-dynamic/20 text-sm text-heading focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-dynamic/10">
                                <input type="checkbox" id="autoreply_enabled"
                                    checked={settingsForm.autoreply_enabled}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, autoreply_enabled: e.target.checked })}
                                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary/20"
                                />
                                <label htmlFor="autoreply_enabled" className="text-xs cursor-pointer">
                                    <span className="font-bold text-heading block">Send Auto-Acknowledgment to Client</span>
                                    <span className="text-res/70 block mt-0.5">
                                        Client receives a confirmation email right after submitting the form.
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                                <button type="button" onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 rounded-xl border border-border/60 text-xs font-bold text-res hover:text-heading">
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingSettings}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 shadow-sm">
                                    {savingSettings ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

ContactInquiriesIndex.layout = (page) => <AdminLayout title="Contact Support Inbox">{page}</AdminLayout>;
