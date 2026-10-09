import AdminLayout from '@/Layouts/AdminLayout'
import axios from 'axios'
import React, { useMemo, useState } from 'react'
import { Link } from '@inertiajs/react'
import {
    RiStarFill, RiCheckLine, RiCloseLine, RiDeleteBinLine,
    RiMessage3Line, RiArrowLeftLine, RiTimeLine, RiUserLine,
    RiShoppingBagLine, RiThumbUpLine, RiFlag2Line,
    RiErrorWarningLine, RiCheckboxCircleLine, RiLoader4Line
} from 'react-icons/ri'

/* ─── Mini Toast ──────────────────────────────────────────── */
function useToast() {
    const [toasts, setToasts] = useState([])
    const push = (msg, type = 'success') => {
        const id = Date.now()
        setToasts(p => [...p, { id, msg, type }])
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
    }
    const dismiss = id => setToasts(p => p.filter(t => t.id !== id))
    return { toasts, push, dismiss }
}
function ToastStack({ toasts, dismiss }) {
    if (!toasts.length) return null
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium min-w-64 max-w-sm pointer-events-auto
                    ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {t.type === 'success' ? <RiCheckboxCircleLine className="size-4 shrink-0" /> : <RiErrorWarningLine className="size-4 shrink-0" />}
                    <span className="flex-1">{t.msg}</span>
                    <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 shrink-0"><RiCloseLine className="size-4" /></button>
                </div>
            ))}
        </div>
    )
}

/* ─── Stars ─────────────────────────────────────────────── */
function Stars({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => <RiStarFill key={i} className={`size-3.5 ${i <= rating ? 'text-amber-400' : 'text-secondary/20'}`} />)}
        </div>
    )
}

/* ─── Status Badge ─────────────────────────────────────── */
const STATUS_MAP = {
    approved: { cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    pending:  { cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    rejected: { cls: 'bg-red-100 text-red-600 border-red-200',       dot: 'bg-red-500' },
}
function StatusBadge({ status }) {
    const s = STATUS_MAP[status] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${s.cls}`}>
            <span className={`size-1.5 rounded-full ${s.dot}`} />{status}
        </span>
    )
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ name }) {
    const initials = (name || 'G').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    const colors = ['bg-violet-500','bg-blue-500','bg-pink-500','bg-teal-500','bg-orange-500']
    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
    return <div className={`size-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>
}

/* ─── Review Card ─────────────────────────────────────────── */
function ReviewCard({ rev, onStatusChange, onDelete, showRepliesLink }) {
    const [expanded, setExpanded] = useState(false)
    const [loading, setLoading] = useState(null)
    const comment = rev.comment || ''
    const isLong = comment.length > 160

    const handleStatus = async (status) => {
        setLoading(status === 'approved' ? 'approve' : 'reject')
        try {
            await axios.post(route('admin.reviews.status', { id: rev.id }), { status })
            onStatusChange(rev.id, status)
        } catch { onStatusChange(null, null) }
        setLoading(null)
    }
    const handleDelete = async () => {
        if (!confirm('Delete this review permanently?')) return
        setLoading('delete')
        try {
            await axios.delete(route('admin.reviews.destroy', { id: rev.id }))
            onDelete(rev.id)
        } catch {}
        setLoading(null)
    }

    return (
        <div className="bg-accent rounded-xl border border-secondary/10 hover:border-primary/20 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col">
            {/* Status stripe */}
            <div className={`h-1 w-full shrink-0 ${rev.status === 'approved' ? 'bg-green-500' : rev.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />

            <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={rev.user?.name} />
                        <div className="min-w-0">
                            <p className="font-semibold text-heading text-sm truncate">{rev.user?.name || 'Guest'}</p>
                            <p className="text-[11px] text-res truncate">{rev.user?.email || '—'}</p>
                        </div>
                    </div>
                    <StatusBadge status={rev.status} />
                </div>

                {/* Product */}
                {rev.post && (
                    <div className="flex items-center gap-1.5 text-[11px] text-res -mt-1">
                        <RiShoppingBagLine className="size-3.5 text-primary shrink-0" />
                        <span className="truncate font-medium text-heading">{rev.post.title}</span>
                    </div>
                )}

                {/* Rating + date */}
                <div className="flex items-center justify-between">
                    <Stars rating={rev.rating ?? 0} />
                    <span className="text-[10px] text-res flex items-center gap-1">
                        <RiTimeLine className="size-3" />
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </span>
                </div>

                {/* Comment */}
                <div className="bg-common/40 rounded-lg px-3.5 py-3 text-sm text-res leading-relaxed min-h-[52px] flex-1">
                    {comment ? (
                        <>
                            {isLong && !expanded ? comment.slice(0,160) + '…' : comment}
                            {isLong && (
                                <button onClick={() => setExpanded(!expanded)} className="ml-1 text-primary text-xs font-medium hover:underline">
                                    {expanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </>
                    ) : <span className="italic text-res/50 text-xs">No comment provided</span>}
                </div>

                {/* Engagement stats */}
                <div className="flex items-center gap-4 text-[11px] text-res">
                    <span className="flex items-center gap-1"><RiThumbUpLine className="size-3.5" />{rev.likes ?? 0} likes</span>
                    <span className="flex items-center gap-1"><RiFlag2Line className="size-3.5" />{rev.reports ?? 0} reports</span>
                    <span className="flex items-center gap-1 capitalize"><RiUserLine className="size-3.5" />{rev.type ?? 'general'}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-secondary/10">
                    {rev.status !== 'approved' && (
                        <button onClick={() => handleStatus('approved')} disabled={!!loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all disabled:opacity-50">
                            {loading === 'approve' ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiCheckLine className="size-3.5" />}
                            Approve
                        </button>
                    )}
                    {rev.status !== 'rejected' && (
                        <button onClick={() => handleStatus('rejected')} disabled={!!loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50">
                            {loading === 'reject' ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiCloseLine className="size-3.5" />}
                            Reject
                        </button>
                    )}
                    {showRepliesLink && (
                        <Link href={`/admin/reviews?id=${rev.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all">
                            <RiMessage3Line className="size-3.5" />Replies
                        </Link>
                    )}
                    <button onClick={handleDelete} disabled={!!loading}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all disabled:opacity-50">
                        {loading === 'delete' ? <RiLoader4Line className="animate-spin size-3.5" /> : <RiDeleteBinLine className="size-3.5" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Page ───────────────────────────────────────────────── */
function ReviewIndex({ reviews: initialReviews, selectedParentId }) {
    const { toasts, push, dismiss } = useToast()
    const initial = Array.isArray(initialReviews) ? initialReviews : (initialReviews?.data ?? [])
    const [reviews, setReviews] = useState(initial)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    const stats = useMemo(() => ({
        total:    reviews.length,
        pending:  reviews.filter(r => r.status === 'pending').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        rejected: reviews.filter(r => r.status === 'rejected').length,
    }), [reviews])

    const filtered = useMemo(() => reviews.filter(r => {
        const matchFilter = filter === 'all' || r.status === filter
        const q = search.toLowerCase()
        const matchSearch = !q || r.user?.name?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q) || r.post?.title?.toLowerCase().includes(q)
        return matchFilter && matchSearch
    }), [reviews, filter, search])

    const handleStatusChange = (id, status) => {
        if (!id) return
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
        push(`Review ${status}!`, 'success')
    }
    const handleDelete = (id) => {
        setReviews(prev => prev.filter(r => r.id !== id))
        push('Review deleted.', 'success')
    }

    const TABS = [
        { key:'all',      label:'All',      count: stats.total,    active: 'bg-heading text-permanent' },
        { key:'pending',  label:'Pending',  count: stats.pending,  active: 'bg-amber-500 text-white' },
        { key:'approved', label:'Approved', count: stats.approved, active: 'bg-green-500 text-white' },
        { key:'rejected', label:'Rejected', count: stats.rejected, active: 'bg-red-500 text-white' },
    ]

    return (
        <div className="py-7 flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                <div className="flex items-center gap-3">
                    {selectedParentId && (
                        <a href={route('admin.reviews.index')} className="flex items-center justify-center size-9 rounded-lg border border-secondary/20 hover:border-primary/30 hover:text-primary text-heading transition-all bg-accent">
                            <RiArrowLeftLine className="size-4" />
                        </a>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-heading">
                            {selectedParentId ? `Replies to Review #${selectedParentId}` : 'Reviews'}
                        </h1>
                        <p className="text-sm text-res mt-0.5">
                            {selectedParentId ? 'Viewing replies for the selected review.' : 'Manage and moderate customer reviews across all products.'}
                        </p>
                    </div>
                </div>
                <input type="text" placeholder="Search by user, product or comment…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full sm:w-72 bg-accent border border-secondary/20 rounded-xl px-4 py-2.5 text-sm text-heading placeholder:text-res/50 focus:outline-none focus:border-primary/50 transition" />
            </div>

            {/* Stat Cards */}
            {!selectedParentId && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label:'Total Reviews',    val: stats.total,    bg:'bg-accent',   text:'text-blue-600' },
                        { label:'Pending Review',   val: stats.pending,  bg:'bg-accent', text:'text-amber-600' },
                        { label:'Approved',         val: stats.approved, bg:'bg-accent', text:'text-green-600' },
                        { label:'Rejected',         val: stats.rejected, bg:'bg-accent',     text:'text-red-500' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl border p-4 flex flex-col gap-1 ${s.bg}`}>
                            <span className={`text-3xl font-bold ${s.text}`}>{s.val}</span>
                            <span className="text-xs font-medium text-res">{s.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-accent rounded-xl border border-secondary/10 p-1 w-fit flex-wrap">
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${filter === tab.key ? tab.active + ' shadow-sm' : 'bg-transparent text-res hover:bg-common/60'}`}>
                        {tab.label}
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full
                            ${filter === tab.key ? 'bg-white/20 text-inherit' : 'bg-secondary/10 text-res'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-res gap-3">
                    <RiMessage3Line className="size-12 opacity-20" />
                    <p className="text-sm">No reviews found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(rev => (
                        <ReviewCard key={rev.id} rev={rev}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                            showRepliesLink={!selectedParentId} />
                    ))}
                </div>
            )}

            <ToastStack toasts={toasts} dismiss={dismiss} />
        </div>
    )
}

export default ReviewIndex
ReviewIndex.layout = page => <AdminLayout title="Reviews">{page}</AdminLayout>
