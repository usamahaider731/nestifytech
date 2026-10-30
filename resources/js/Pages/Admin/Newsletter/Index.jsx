import AdminLayout from '@/Layouts/AdminLayout';
import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import {
    RiMailSendLine,
    RiSearchLine,
    RiDeleteBinLine,
    RiLoader4Line,
    RiDownloadLine,
    RiUserLine,
    RiMailLine,
    RiCalendarLine,
    RiCheckLine,
    RiCloseLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';

const STATUS_BADGES = {
    active:       'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    unsubscribed: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

const SOURCE_LABELS = {
    footer:  'Footer',
    sidebar: 'Sidebar Widget',
    popup:   'Promo Popup',
    profile: 'Profile Settings',
};

export default function NewsletterIndex({
    subscribers = {},
    stats = {},
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deletingId, setDeletingId] = useState(null);

    const subscribersList = subscribers?.data || [];

    const handleFilter = (st = statusFilter) => {
        router.get(
            route('admin.newsletter.index'),
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

    const handleDelete = (id) => {
        if (!window.confirm('Remove this subscriber permanently? This cannot be undone.')) return;

        setDeletingId(id);
        router.delete(route('admin.newsletter.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Subscriber removed.'),
            onError:   () => toast.error('Failed to remove subscriber.'),
            onFinish:  () => setDeletingId(null),
        });
    };

    const handleExport = () => {
        window.open(route('admin.newsletter.export'), '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-heading font-oswald uppercase tracking-tight flex items-center gap-2">
                        <RiMailSendLine className="text-primary" />
                        Newsletter Subscribers
                    </h1>
                    <p className="text-xs text-res/70 mt-1">
                        Manage email subscribers who signed up through your website newsletter forms.
                    </p>
                </div>

                <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm shadow-primary/25"
                >
                    <RiDownloadLine size={16} />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-bg rounded-2xl border border-border/60 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-res/70">Total Subscribers</span>
                    <div className="text-2xl font-black font-oswald text-heading mt-1">{stats.total ?? 0}</div>
                </div>
                <div className="bg-bg rounded-2xl border border-emerald-500/20 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Active</span>
                    <div className="text-2xl font-black font-oswald text-emerald-600 mt-1">{stats.active ?? 0}</div>
                </div>
                <div className="bg-bg rounded-2xl border border-zinc-500/20 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Unsubscribed</span>
                    <div className="text-2xl font-black font-oswald text-zinc-500 mt-1">{stats.unsubscribed ?? 0}</div>
                </div>
                <div className="bg-bg rounded-2xl border border-blue-500/20 p-4 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">This Month</span>
                    <div className="text-2xl font-black font-oswald text-blue-500 mt-1">{stats.this_month ?? 0}</div>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="bg-bg rounded-2xl border border-border/60 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    {['all', 'active', 'unsubscribed'].map((st) => (
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

                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-res/50">
                        <RiSearchLine size={16} />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border/60 bg-dynamic/20 text-heading focus:outline-none focus:border-primary"
                    />
                </form>
            </div>

            {/* Table */}
            <div className="bg-bg rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-border/60 bg-dynamic/30 font-bold uppercase tracking-wider text-res/70">
                                <th className="p-4">Subscriber</th>
                                <th className="p-4">Source</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Subscribed On</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {subscribersList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-res/60">
                                        No newsletter subscribers found for the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                subscribersList.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-dynamic/25 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                    {(sub.name || sub.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    {sub.name && (
                                                        <div className="text-sm font-bold text-heading truncate flex items-center gap-1">
                                                            <RiUserLine size={12} />
                                                            {sub.name}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-res/70 flex items-center gap-1 truncate">
                                                        <RiMailLine size={12} />
                                                        <span>{sub.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-dynamic/30 text-res border border-border/40">
                                                {SOURCE_LABELS[sub.source] || sub.source}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    STATUS_BADGES[sub.status] || STATUS_BADGES.active
                                                }`}
                                            >
                                                {sub.status === 'active' ? (
                                                    <RiCheckLine size={12} />
                                                ) : (
                                                    <RiCloseLine size={12} />
                                                )}
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-res/70">
                                            <span className="flex items-center gap-1">
                                                <RiCalendarLine size={12} />
                                                {sub.subscribed_at
                                                    ? new Date(sub.subscribed_at).toLocaleDateString(undefined, {
                                                          month: 'short',
                                                          day: 'numeric',
                                                          year: 'numeric',
                                                      })
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => handleDelete(sub.id)}
                                                disabled={deletingId === sub.id}
                                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-res hover:text-rose-500 transition-all disabled:opacity-50"
                                                title="Remove Subscriber"
                                            >
                                                {deletingId === sub.id ? (
                                                    <RiLoader4Line size={16} className="animate-spin text-rose-500" />
                                                ) : (
                                                    <RiDeleteBinLine size={16} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {subscribers?.links && subscribers.links.length > 3 && (
                    <div className="p-4 border-t border-border/40 flex items-center justify-between">
                        <span className="text-xs text-res/70">
                            Showing {subscribers.from ?? 0} to {subscribers.to ?? 0} of {subscribers.total ?? 0} subscribers
                        </span>
                        <div className="flex items-center gap-1">
                            {subscribers.links.map((link, i) => (
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
        </div>
    );
}

NewsletterIndex.layout = (page) => <AdminLayout title="Newsletter Subscribers">{page}</AdminLayout>;
