import AdminLayout from '@/Layouts/AdminLayout'
import React, { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import axios from 'axios'
import {
  RiCoupon2Line,
  RiAddCircleLine,
  RiSearchLine,
  RiDeleteBinLine,
  RiEditLine,
  RiCloseLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiGiftLine,
  RiMoneyDollarCircleLine,
  RiUserLine,
  RiCalendarLine,
  RiSettings3Line,
  RiMagicLine,
} from 'react-icons/ri'
import { toast } from 'react-toastify'

const STATUS_COLORS = {
  active:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  inactive:  'text-secondary bg-secondary/10 border-secondary/20',
  exhausted: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
}

const EMPTY_FORM = {
  code: '',
  initial_balance: '',
  status: 'active',
  expires_at: '',
  issued_to_user_id: '',
  note: '',
  quantity: 1,
}

export default function GiftCardsIndex({ cards = {}, stats = {}, users = [], filters = {} }) {
  const [search, setSearch] = useState(filters.search || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
  const [showModal, setShowModal] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [generatingCode, setGeneratingCode] = useState(false)

  const cardsItems = cards?.data || []

  const handleGenerateCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await axios.get(route('admin.gift-cards.generate-code'))
      if (res.data?.success && res.data?.code) {
        setForm(p => ({ ...p, code: res.data.code }))
        toast.success(`Generated code: ${res.data.code}`)
      }
    } catch (e) {
      // Fallback local random generation if network error
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let fallback = 'GC-'
      for (let i = 0; i < 8; i++) {
        fallback += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      setForm(p => ({ ...p, code: fallback }))
      toast.info(`Generated code: ${fallback}`)
    } finally {
      setGeneratingCode(false)
    }
  }

  const openCreate = () => {
    setEditCard(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (card) => {
    setEditCard(card)
    setForm({
      code: card.code || '',
      initial_balance: card.initial_balance ?? '',
      status: card.status || 'active',
      expires_at: card.expires_at ? card.expires_at.substring(0, 10) : '',
      issued_to_user_id: card.issued_to_user_id ?? '',
      note: card.note || '',
      quantity: 1,
      remaining_balance: card.remaining_balance ?? card.initial_balance ?? 0,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditCard(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = () => {
    if (!form.initial_balance || isNaN(Number(form.initial_balance))) {
      toast.error('Balance is required')
      return
    }
    setSubmitting(true)

    if (editCard) {
      router.put(route('admin.gift-cards.update', editCard.id), {
        status: form.status,
        remaining_balance: Number(form.remaining_balance ?? form.initial_balance),
        expires_at: form.expires_at || null,
        issued_to_user_id: form.issued_to_user_id || null,
        note: form.note,
      }, {
        onSuccess: () => { toast.success('Gift card updated!'); closeModal() },
        onError: (e) => toast.error(Object.values(e)[0] || 'Error'),
        onFinish: () => setSubmitting(false),
      })
    } else {
      router.post(route('admin.gift-cards.store'), {
        code: form.code || null,
        initial_balance: Number(form.initial_balance),
        status: form.status,
        expires_at: form.expires_at || null,
        issued_to_user_id: form.issued_to_user_id || null,
        note: form.note,
        quantity: Number(form.quantity) || 1,
      }, {
        onSuccess: () => { toast.success('Gift card(s) created!'); closeModal() },
        onError: (e) => toast.error(Object.values(e)[0] || 'Error'),
        onFinish: () => setSubmitting(false),
      })
    }
  }

  const handleDelete = (id, code) => {
    if (!window.confirm(`Delete gift card "${code}"? This cannot be undone.`)) return
    setDeletingId(id)
    router.delete(route('admin.gift-cards.destroy', id), {
      onSuccess: () => toast.success('Gift card deleted!'),
      onError: () => toast.error('Failed to delete'),
      onFinish: () => setDeletingId(null),
    })
  }

  const applyFilters = () => {
    router.get(route('admin.gift-cards.index'), {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
    }, { preserveState: true })
  }

  return (
    <AdminLayout title="Gift Cards">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold heading flex items-center gap-2">
            <RiGiftLine className="text-primary" />
            Gift Cards
          </h1>
          <p className="text-sm secondary mt-1">
            Issue and manage gift cards. Apply at checkout for balance-based discounts.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={route('admin.setting', { type: 'popup' })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border accent heading text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <RiSettings3Line className="text-secondary" />
            <span>Popup &amp; Offers</span>
          </Link>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity">
            <RiAddCircleLine />
            <span>Issue Gift Card</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Cards', value: stats.total ?? 0, icon: <RiCoupon2Line />, color: 'text-blue-400' },
          { label: 'Active', value: stats.active ?? 0, icon: <RiCheckboxCircleLine />, color: 'text-emerald-400' },
          { label: 'Exhausted', value: stats.exhausted ?? 0, icon: <RiCloseCircleLine />, color: 'text-rose-400' },
          { label: 'Active Balance', value: `PKR ${Number(stats.total_balance ?? 0).toLocaleString()}`, icon: <RiMoneyDollarCircleLine />, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg rounded-xl border accent p-4 flex items-center gap-3">
            <span className={`text-2xl ${s.color}`}>{s.icon}</span>
            <div>
              <div className="text-lg font-bold heading">{s.value}</div>
              <div className="text-xs secondary">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg rounded-xl border accent p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 secondary" />
          <input
            type="text"
            placeholder="Search by code or note..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            className="w-full pl-9 pr-4 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border accent bg text-sm heading outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="exhausted">Exhausted</option>
        </select>
        <button onClick={applyFilters} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">Apply</button>
      </div>

      {/* Table */}
      <div className="bg rounded-xl border accent overflow-hidden">
        {cardsItems.length === 0 ? (
          <div className="py-16 text-center">
            <RiGiftLine className="text-5xl secondary mx-auto mb-3" />
            <p className="heading font-medium">No gift cards yet</p>
            <p className="secondary text-sm mt-1">Issue your first gift card.</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90">+ Issue Gift Card</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b accent">
                  {['Code', 'Balance', 'Remaining', 'Issued To', 'Expires', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left secondary font-medium uppercase text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cardsItems.map(card => (
                  <tr key={card.id} className="border-b accent hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary text-sm">{card.code}</span>
                      {card.note && <div className="text-xs secondary mt-0.5 truncate max-w-32">{card.note}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono heading">PKR {Number(card.initial_balance).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono heading">PKR {Number(card.remaining_balance).toLocaleString()}</div>
                      <div className="w-20 h-1.5 bg-accent rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, (card.remaining_balance / card.initial_balance) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {card.issued_to_name ? (
                        <div>
                          <div className="text-xs heading">{card.issued_to_name}</div>
                          <div className="text-xs secondary">{card.issued_to_email}</div>
                        </div>
                      ) : <span className="text-xs secondary">— Public</span>}
                    </td>
                    <td className="px-4 py-3 text-xs secondary">
                      {card.expires_at ? card.expires_at.substring(0, 10) : <span className="text-emerald-400">Never</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[card.status] || ''}`}>
                        {card.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(card)} className="p-1.5 rounded-lg border accent hover:bg-blue-400/10 hover:text-blue-400 hover:border-blue-400/30 transition-colors" title="Edit"><RiEditLine /></button>
                        <button onClick={() => handleDelete(card.id, card.code)} disabled={deletingId === card.id} className="p-1.5 rounded-lg border accent hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/30 transition-colors" title="Delete">
                          {deletingId === card.id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {cards?.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {cards.links?.map((link, i) => (
            link.url
              ? <button key={i} onClick={() => router.get(link.url, {}, { preserveState: true })} className={`px-3 py-1.5 text-sm rounded-lg border ${link.active ? 'bg-primary text-white border-primary' : 'accent heading hover:bg-primary/10'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
              : <span key={i} className="px-3 py-1.5 text-sm rounded-lg border accent secondary opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
          ))}
        </div>
      )}

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-lg bg rounded-2xl border accent shadow-2xl">

            <div className="flex items-center justify-between p-5 border-b accent">
              <h2 className="text-lg font-bold heading flex items-center gap-2">
                <RiGiftLine className="text-primary" />
                {editCard ? 'Edit Gift Card' : 'Issue Gift Card'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-red-400/10 hover:text-red-400 transition-colors secondary"><RiCloseLine className="text-xl" /></button>
            </div>

            <div className="p-5 space-y-4">

              {!editCard && (
                <>
                  {/* Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium secondary">
                        Code <span className="text-xs opacity-60">(custom or auto-generated)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        disabled={generatingCode}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        <RiMagicLine className={generatingCode ? 'animate-spin' : ''} />
                        <span>{generatingCode ? 'Generating...' : 'Auto-Generate Code'}</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="e.g. GC-8X9Y2Z1A"
                        value={form.code}
                        onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                        className="w-full pr-24 px-3 py-2 rounded-lg border accent bg text-sm heading font-mono uppercase focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        disabled={generatingCode}
                        className="absolute right-1.5 px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors font-medium flex items-center gap-1"
                        title="Generate random unique code"
                      >
                        <RiMagicLine />
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium secondary mb-1.5">
                      Quantity <span className="text-xs opacity-60">(bulk generate — code will be auto-generated per card)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.quantity}
                      onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                </>
              )}

              {/* Balance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">
                    {editCard ? 'Remaining Balance' : 'Balance (PKR)'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={editCard ? form.remaining_balance : form.initial_balance}
                    onChange={e => setForm(p => ({
                      ...p,
                      [editCard ? 'remaining_balance' : 'initial_balance']: e.target.value,
                    }))}
                    className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="exhausted">Exhausted</option>
                  </select>
                </div>
              </div>

              {/* Expiry + User */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">
                    <RiCalendarLine className="inline mr-1" />Expiry Date <span className="text-xs opacity-60">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">
                    <RiUserLine className="inline mr-1" />Assign to User <span className="text-xs opacity-60">(optional)</span>
                  </label>
                  <select value={form.issued_to_user_id} onChange={e => setForm(p => ({ ...p, issued_to_user_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none">
                    <option value="">— Public (anyone)</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium secondary mb-1.5">Internal Note <span className="text-xs opacity-60">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Christmas promo for VIP customers"
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t accent">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border accent secondary text-sm hover:bg-primary/5 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-60">
                {submitting && <RiLoader4Line className="animate-spin" />}
                {editCard ? 'Save Changes' : 'Issue Card(s)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
