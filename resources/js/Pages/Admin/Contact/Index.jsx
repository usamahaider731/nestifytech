import AdminLayout from '@/Layouts/AdminLayout';
import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    RiMailUnreadLine,
    RiMailCheckLine,
    RiSearchLine,
    RiDeleteBinLine,
    RiEditLine,
    RiCloseLine,
    RiLoader4Line,
    RiCheckDoubleLine,
    RiSettings3Line,
    RiUserLine,
    RiMailLine,
    RiPhoneLine,
    RiCalendarLine,
    RiReplyLine,
    RiArchiveLine,
    RiInformationLine,
    RiShieldKeyholeLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';

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
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [activeInquiry, setActiveInquiry] = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [newStatus, setNewStatus] = useState('');

    // Settings form
    const [settingsForm, setSettingsForm] = useState({
        recipient_email: contactSettings.recipient_email || '',
        autoreply_enabled: contactSettings.autoreply_enabled ?? true,
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const inquiriesList = inquiries?.data || [];

    const handleFilter = (st = statusFilter) => {
        router.get(
            route('admin.contact.index'),
            { search: search || undefined, status: st !== 'all' ? st : undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilter();
    };

    const handleStatusFilterChange = (st) => {
        setStatusFilter(st);
        handleFilter(st);
    };

    const openInquiryModal = (inq) => {
        setActiveInquiry(inq);
        setAdminNotes(inq.admin_notes || '');
        setNewStatus(inq.status);

        // If 'new', auto-mark as 'read'
        if (inq.status === 'new') {
            router.put(route('admin.contact.update', inq.id), {
                status: 'read',
                admin_notes: inq.admin_notes,
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setActiveInquiry((prev) => prev ? { ...prev, status: 'read' } : null);
                },
            });
        }
    };

    const handleUpdateInquiry = (e) => {
        e.preventDefault();
        if (!activeInquiry) return;

        setUpdatingStatus(true);
        router.put(route('admin.contact.update', activeInquiry.id), {
            status: newStatus,
            admin_notes: adminNotes,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Inquiry status updated successfully');
                setActiveInquiry(null);
            },
            onError: () => {
                toast.error('Failed to update inquiry');
            },
            onFinish: () => setUpdatingStatus(false),
        });
    };

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this client inquiry? This action cannot be undone.')) {
            return;
        }

        setDeletingId(id);
        router.delete(route('admin.contact.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Inquiry deleted successfully');
                if (activeInquiry?.id === id) setActiveInquiry(null);
            },
            onError: () => toast.error('Failed to delete inquiry'),
            onFinish: () => setDeletingId(null),
        });
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        setSavingSettings(true);

        router.post(route('admin.contact.settings'), settingsForm, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Contact email settings updated successfully');
                setShowSettingsModal(false);
            },
            onError: () => toast.error('Failed to update contact settings'),
            onFinish: () => setSavingSettings(false),
        });
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-heading font-oswald uppercase tracking-tight flex items-center gap-2">
                        <RiMailUnreadLine className="text-primary" />
                        Client Contact Inquiries
                    </h1>
                    <p className="text-xs text-res/70 mt-1">
                        View client messages from the Contact Us form, update follow-up statuses, and configure recipient mail settings.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dynamic/40 hover:bg-dynamic/70 text-heading border border-border/60 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <RiSettings3Line size={16} className="text-primary" />
                        <span>Email & Key Settings</span>
                    </button>

                    <Link
                        href="/page/contact-us"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm shadow-primary/25"
                    >
                        <span>View Live Contact Page</span>
                    </Link>
                </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-bg rounded-2xl border border-border/60 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-res/70">Total Received</span>
                    <div className="text-2xl font-black font-oswald text-heading mt-1">{stats.total ?? 0}</div>
                </div>
                <div className="bg-bg rounded-2xl border border-blue-500/20 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Unread / New</span>
                    <div className="text-2xl font-black font-oswald text-blue-500 mt-1">{stats.new ?? 0}</div>
                </div>
                <div className="bg-bg rounded-2xl border border-emerald-500/20 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Resolved / Replied</span>
                    <div className="text-2xl font-black font-oswald text-emerald-500 mt-1">{stats.replied ?? 0}</div>
                </div>
                <div className="bg-bg rounded-2xl border border-border/60 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-res/70">Archived</span>
                    <div className="text-2xl font-black font-oswald text-heading mt-1">{stats.archived ?? 0}</div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-bg rounded-2xl border border-border/60 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    {['all', 'new', 'read', 'replied', 'archived'].map((st) => (
                        <button
                            key={st}
                            onClick={() => handleStatusFilterChange(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === st
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-res/80 hover:text-heading hover:bg-dynamic/40'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-res/50">
                        <RiSearchLine size={16} />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search sender, email, subject..."
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border/60 bg-dynamic/20 text-heading focus:outline-none focus:border-primary"
                    />
                </form>
            </div>

            {/* Table of Inquiries */}
            <div className="bg-bg rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-border/60 bg-dynamic/30 font-bold uppercase tracking-wider text-res/70">
                                <th className="p-4">Sender</th>
                                <th className="p-4">Subject & Message Preview</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {inquiriesList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-res/60">
                                        No client contact inquiries found matching the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                inquiriesList.map((inq) => (
                                    <tr
                                        key={inq.id}
                                        onClick={() => openInquiryModal(inq)}
                                        className={`hover:bg-dynamic/25 transition-colors cursor-pointer ${
                                            inq.status === 'new' ? 'font-semibold bg-primary/[0.02]' : ''
                                        }`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                    {inq.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-heading truncate">{inq.name}</div>
                                                    <div className="text-xs text-res/70 flex items-center gap-1 truncate">
                                                        <RiMailLine size={12} />
                                                        <span>{inq.email}</span>
                                                    </div>
                                                    {inq.phone && (
                                                        <div className="text-[11px] text-res/60 flex items-center gap-1">
                                                            <RiPhoneLine size={11} />
                                                            <span>{inq.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 max-w-md">
                                            <div className="text-xs font-bold text-heading truncate">
                                                {inq.subject || 'General Contact Request'}
                                            </div>
                                            <div className="text-xs text-res/70 truncate mt-0.5">
                                                {inq.message}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span
                                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    STATUS_BADGES[inq.status] || STATUS_BADGES.new
                                                }`}
                                            >
                                                {inq.status}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-res/70">
                                            {new Date(inq.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    onClick={() => openInquiryModal(inq)}
                                                    className="p-1.5 rounded-lg hover:bg-dynamic/60 text-res hover:text-primary transition-all"
                                                    title="View Details"
                                                >
                                                    <RiEditLine size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inq.id)}
                                                    disabled={deletingId === inq.id}
                                                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-res hover:text-rose-500 transition-all disabled:opacity-50"
                                                    title="Delete Inquiry"
                                                >
                                                    {deletingId === inq.id ? (
                                                        <RiLoader4Line size={16} className="animate-spin text-rose-500" />
                                                    ) : (
                                                        <RiDeleteBinLine size={16} />
                                                    )}
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
                            Showing {inquiries.from ?? 0} to {inquiries.to ?? 0} of {inquiries.total ?? 0} inquiries
                        </span>
                        <div className="flex items-center gap-1">
                            {inquiries.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                        link.active
                                            ? 'bg-primary text-white'
                                            : link.url
                                            ? 'text-res hover:bg-dynamic/50'
                                            : 'text-res/30 pointer-events-none'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: View & Update Inquiry */}
            {activeInquiry && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-bg rounded-2xl border border-border/80 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleIn">
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-1 ${STATUS_BADGES[activeInquiry.status]}`}>
                                    {activeInquiry.status}
                                </span>
                                <h3 className="text-xl font-bold text-heading font-oswald">
                                    {activeInquiry.subject || 'Client Inquiry'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveInquiry(null)}
                                className="p-1.5 rounded-lg hover:bg-dynamic/60 text-res"
                            >
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        {/* Client details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-dynamic/20 text-xs">
                            <div>
                                <span className="text-res/60 font-semibold block uppercase text-[10px]">Client Name</span>
                                <span className="font-bold text-heading text-sm">{activeInquiry.name}</span>
                            </div>
                            <div>
                                <span className="text-res/60 font-semibold block uppercase text-[10px]">Email Address</span>
                                <a href={`mailto:${activeInquiry.email}`} className="font-bold text-primary hover:underline">
                                    {activeInquiry.email}
                                </a>
                            </div>
                            {activeInquiry.phone && (
                                <div>
                                    <span className="text-res/60 font-semibold block uppercase text-[10px]">Phone Number</span>
                                    <span className="font-semibold text-heading">{activeInquiry.phone}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-res/60 font-semibold block uppercase text-[10px]">Submitted Date</span>
                                <span className="text-heading">
                                    {new Date(activeInquiry.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Message content */}
                        <div>
                            <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                                Client Message
                            </label>
                            <div className="p-4 rounded-xl border border-border/60 bg-dynamic/10 text-sm text-heading leading-relaxed whitespace-pre-line">
                                {activeInquiry.message}
                            </div>
                        </div>

                        {/* Quick email action */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                            <span className="text-res/80">Need to reply to {activeInquiry.name} directly?</span>
                            <a
                                href={`mailto:${activeInquiry.email}?subject=Re:%20${encodeURIComponent(activeInquiry.subject || 'Your Inquiry at NestifyTech')}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all"
                            >
                                <RiReplyLine size={14} />
                                <span>Open Email Client</span>
                            </a>
                        </div>

                        {/* Status update form */}
                        <form onSubmit={handleUpdateInquiry} className="space-y-4 pt-2 border-t border-border/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1.5">
                                        Update Inquiry Status
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border/60 bg-dynamic/20 text-xs text-heading focus:outline-none focus:border-primary"
                                    >
                                        <option value="new">New / Unread</option>
                                        <option value="read">Read / In Progress</option>
                                        <option value="replied">Replied / Resolved</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1.5">
                                    Internal Admin Notes (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add any internal remarks or resolutions taken by staff..."
                                    className="w-full p-3 rounded-xl border border-border/60 bg-dynamic/20 text-xs text-heading focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveInquiry(null)}
                                    className="px-4 py-2 rounded-xl border border-border/60 text-xs font-bold text-res hover:text-heading"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingStatus}
                                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {updatingStatus ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Email & Key Settings */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-bg rounded-2xl border border-border/80 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleIn">
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-heading font-oswald flex items-center gap-2">
                                    <RiShieldKeyholeLine className="text-primary" />
                                    Contact Form Backend Email Settings
                                </h3>
                                <p className="text-xs text-res/70 mt-0.5">
                                    Configure where client emails are delivered and manage automated responses.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="p-1.5 rounded-lg hover:bg-dynamic/60 text-res"
                            >
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        {/* Current SMTP Status Overview */}
                        <div className="p-4 rounded-xl bg-dynamic/20 border border-border/60 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-res/70 font-semibold">Outgoing Mail Dispatch:</span>
                                <span className={`font-bold ${contactSettings.mail_enabled ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {contactSettings.mail_enabled ? '● Active' : '○ Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-res/70 font-semibold">SMTP Host / Server:</span>
                                <span className="font-mono text-heading">{contactSettings.mail_host}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-res/70 font-semibold">Default Sender Address:</span>
                                <span className="font-mono text-heading">{contactSettings.mail_from_address}</span>
                            </div>
                            <div className="pt-2 text-[11px] text-res/60 border-t border-border/40 flex items-center justify-between">
                                <span>Full SMTP credentials & Mailtrap settings are managed in:</span>
                                <Link
                                    href={route('admin.setting', { type: 'mail' })}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Email / Mailtrap Settings →
                                </Link>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-5">
                            {/* Recipient Email Address */}
                            <div>
                                <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                                    Contact Form Recipient Email (Admin Inbox)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-res/60">
                                        <RiMailLine size={18} />
                                    </span>
                                    <input
                                        type="email"
                                        required
                                        value={settingsForm.recipient_email}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, recipient_email: e.target.value })}
                                        placeholder="e.g. support@nestifytech.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-dynamic/20 text-sm text-heading focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <p className="text-[11px] text-res/60 mt-1">
                                    All new client requests sent from the contact form are immediately dispatched to this address.
                                </p>
                            </div>

                            {/* Client Auto-reply Toggle */}
                            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-dynamic/10">
                                <input
                                    type="checkbox"
                                    id="autoreply_enabled"
                                    checked={settingsForm.autoreply_enabled}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, autoreply_enabled: e.target.checked })}
                                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary/20"
                                />
                                <label htmlFor="autoreply_enabled" className="text-xs cursor-pointer">
                                    <span className="font-bold text-heading block">
                                        Send Automated Acknowledgment Email to Client
                                    </span>
                                    <span className="text-res/70 block mt-0.5">
                                        When checked, the client will immediately receive a professional confirmation email confirming their request has been logged.
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                                <button
                                    type="button"
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 rounded-xl border border-border/60 text-xs font-bold text-res hover:text-heading"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                                >
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

ContactInquiriesIndex.layout = (page) => <AdminLayout title="Contact Inquiries">{page}</AdminLayout>;
