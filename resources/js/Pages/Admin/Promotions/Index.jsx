import AdminLayout from '@/Layouts/AdminLayout'
import React, { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  RiPercentLine,
  RiAddCircleLine,
  RiSearchLine,
  RiDeleteBinLine,
  RiEditLine,
  RiToggleLine,
  RiToggleFill,
  RiCloseLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiPriceTag3Line,
  RiCoupon2Line,
  RiShoppingBag3Line,
  RiLayoutGridLine,
  RiStore3Line,
  RiAppsLine,
  RiUserHeartLine,
  RiShieldUserLine,
} from 'react-icons/ri'
import { toast } from 'react-toastify'

const TARGET_ICONS = {
  all:        <RiLayoutGridLine />,
  product:    <RiShoppingBag3Line />,
  category:   <RiLayoutGridLine />,
  brand:      <RiStore3Line />,
  collection: <RiAppsLine />,
  user_role:  <RiShieldUserLine />,
  user:       <RiUserHeartLine />,
}

const TARGET_LABELS = {
  all:        'All Products',
  product:    'Specific Products',
  category:   'Categories',
  brand:      'Brands',
  collection: 'Collections',
  user_role:  'User Roles',
  user:       'Specific Users',
}

const TYPE_COLORS = {
  discount: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  tax:      'text-amber-400 bg-amber-400/10 border-amber-400/20',
}

const EMPTY_FORM = {
  name: '',
  type: 'discount',
  rate_type: 'percentage',
  rate_value: '',
  target_type: 'all',
  target_ids: [],
  code: '',
  min_spend: '',
  start_date: '',
  end_date: '',
  priority: 0,
  status: 'active',
  description: '',
}

export default function PromotionsIndex({
  rules = {},
  filters = {},
  stats = {},
  availableTargets = {},
}) {
  const [search, setSearch] = useState(filters.search || '')
  const [typeFilter, setTypeFilter] = useState(filters.type || 'all')
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
  const [showModal, setShowModal] = useState(false)
  const [editRule, setEditRule] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [targetSearch, setTargetSearch] = useState('')

  const categories  = availableTargets?.categories  || []
  const brands      = availableTargets?.brands      || []
  const collections = availableTargets?.collections || []
  const products    = availableTargets?.products    || []
  const users       = availableTargets?.users       || []
  const roles       = availableTargets?.roles       || []
  const targetOptions = useMemo(() => {
    switch (form.target_type) {
      case 'category':   return categories.map(i => ({ id: i.id, label: i.title }))
      case 'brand':      return brands.map(i => ({ id: i.id, label: i.title }))
      case 'collection': return collections.map(i => ({ id: i.id, label: i.title }))
      case 'product':    return products.map(i => ({ id: i.id, label: `${i.title}${i.sku ? ` (${i.sku})` : ''}` }))
      case 'user':       return users.map(i => ({ id: i.id, label: `${i.name} <${i.email}>` }))
      case 'user_role':  return roles.map(i => ({ id: i.id, label: i.title }))
      default:           return []
    }
  }, [form.target_type, categories, brands, collections, products, users, roles])

  const filteredTargetOptions = useMemo(() => {
    if (!targetSearch) return targetOptions
    const s = targetSearch.toLowerCase()
    return targetOptions.filter(o => o.label.toLowerCase().includes(s))
  }, [targetOptions, targetSearch])

  const openCreate = () => {
    setEditRule(null)
    setForm(EMPTY_FORM)
    setTargetSearch('')
    setShowModal(true)
  }

  const openEdit = (rule) => {
    setEditRule(rule)
    setForm({
      name:        rule.name        || '',
      type:        rule.type        || 'discount',
      rate_type:   rule.rate_type   || 'percentage',
      rate_value:  rule.rate_value  ?? '',
      target_type: rule.target_type || 'all',
      target_ids:  Array.isArray(rule.target_ids) ? rule.target_ids : [],
      code:        rule.code        || '',
      min_spend:   rule.min_spend   ?? '',
      start_date:  rule.start_date  ? rule.start_date.substring(0, 10) : '',
      end_date:    rule.end_date    ? rule.end_date.substring(0, 10) : '',
      priority:    rule.priority    ?? 0,
      status:      rule.status      || 'active',
      description: rule.description || '',
    })
    setTargetSearch('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditRule(null)
    setForm(EMPTY_FORM)
    setTargetSearch('')
  }

  const toggleTargetId = (id) => {
    setForm(prev => {
      const existing = prev.target_ids || []
      const isSelected = existing.includes(id)
      return {
        ...prev,
        target_ids: isSelected ? existing.filter(x => x !== id) : [...existing, id],
      }
    })
  }

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Rule name is required'); return }
    if (form.rate_value === '' || isNaN(Number(form.rate_value))) { toast.error('Rate value must be a number'); return }

    setSubmitting(true)
    const payload = {
      ...form,
      rate_value: Number(form.rate_value),
      min_spend: form.min_spend !== '' ? Number(form.min_spend) : null,
      priority: Number(form.priority) || 0,
      target_ids: form.target_type === 'all' ? [] : form.target_ids,
    }

    if (editRule) {
      router.put(route('admin.promotions.update', editRule.id), payload, {
        onSuccess: () => { toast.success('Rule updated!'); closeModal() },
        onError: (e) => { toast.error(Object.values(e)[0] || 'Error updating rule') },
        onFinish: () => setSubmitting(false),
      })
    } else {
      router.post(route('admin.promotions.store'), payload, {
        onSuccess: () => { toast.success('Rule created!'); closeModal() },
        onError: (e) => { toast.error(Object.values(e)[0] || 'Error creating rule') },
        onFinish: () => setSubmitting(false),
      })
    }
  }

  const handleToggle = (id) => {
    setTogglingId(id)
    router.post(route('admin.promotions.toggle', id), {}, {
      onSuccess: () => toast.success('Status updated!'),
      onError: () => toast.error('Failed to toggle status'),
      onFinish: () => setTogglingId(null),
    })
  }

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete rule "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    router.delete(route('admin.promotions.destroy', id), {
      onSuccess: () => toast.success('Rule deleted!'),
      onError: () => toast.error('Failed to delete rule'),
      onFinish: () => setDeletingId(null),
    })
  }

  const applyFilters = () => {
    router.get(route('admin.promotions.index'), {
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
    }, { preserveState: true })
  }

  const rulesItems = rules?.data || []

  const getRateSummary = (rule) => {
    if (rule.rate_type === 'percentage') return `${rule.rate_value}%`
    return `PKR ${Number(rule.rate_value).toLocaleString()}`
  }

  const getTargetSummary = (rule) => {
    if (rule.target_type === 'all') return 'All products'
    const count = Array.isArray(rule.target_ids) ? rule.target_ids.length : 0
    return `${TARGET_LABELS[rule.target_type] || rule.target_type} (${count})`
  }

  return (
    <AdminLayout title="Promotions & Tax Rules">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold heading flex items-center gap-2">
            <RiPercentLine className="text-primary" />
            Promotions &amp; Tax Rules
          </h1>
          <p className="text-sm secondary mt-1">
            Configure custom discounts and tax rules targeting products, categories, brands, collections, and users.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <RiAddCircleLine />
          New Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Rules', value: stats.total_rules ?? 0, icon: <RiCoupon2Line />, color: 'text-blue-400' },
          { label: 'Active Discounts', value: stats.active_discounts ?? 0, icon: <RiPriceTag3Line />, color: 'text-emerald-400' },
          { label: 'Active Tax Rules', value: stats.active_taxes ?? 0, icon: <RiPercentLine />, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg rounded-xl border accent p-4 flex items-center gap-3">
            <span className={`text-2xl ${stat.color}`}>{stat.icon}</span>
            <div>
              <div className="text-xl font-bold heading">{stat.value}</div>
              <div className="text-xs secondary">{stat.label}</div>
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
            placeholder="Search by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            className="w-full pl-9 pr-4 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border accent bg text-sm heading outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Types</option>
          <option value="discount">Discount</option>
          <option value="tax">Tax</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border accent bg text-sm heading outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={applyFilters} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="bg rounded-xl border accent overflow-hidden">
        {rulesItems.length === 0 ? (
          <div className="py-16 text-center">
            <RiCoupon2Line className="text-5xl secondary mx-auto mb-3" />
            <p className="heading font-medium">No rules found</p>
            <p className="secondary text-sm mt-1">Create your first discount or tax rule.</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90">
              + Create Rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b accent">
                  {['Name / Code', 'Type', 'Rate', 'Target', 'Validity', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left secondary font-medium uppercase text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rulesItems.map((rule) => (
                  <tr key={rule.id} className="border-b accent hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium heading">{rule.name}</div>
                      {rule.code && <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded border border-blue-400/30 text-blue-400 bg-blue-400/10 font-mono">{rule.code}</span>}
                      {rule.min_spend > 0 && <div className="text-xs secondary mt-0.5">Min: PKR {Number(rule.min_spend).toLocaleString()}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium capitalize ${TYPE_COLORS[rule.type] || ''}`}>
                        {rule.type === 'discount' ? <RiPriceTag3Line /> : <RiPercentLine />}
                        {rule.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold heading">
                      {getRateSummary(rule)}
                      <div className="text-xs secondary capitalize">{rule.rate_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 secondary text-xs">
                        <span className="text-base">{TARGET_ICONS[rule.target_type]}</span>
                        {getTargetSummary(rule)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs secondary">
                      {rule.start_date ? (
                        <div>
                          <div>From: {rule.start_date?.substring(0, 10)}</div>
                          {rule.end_date && <div>To: {rule.end_date?.substring(0, 10)}</div>}
                        </div>
                      ) : <span className="text-emerald-400">Always active</span>}
                    </td>
                    <td className="px-4 py-3">
                      {rule.status === 'active'
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full"><RiCheckboxCircleLine /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs secondary border accent px-2 py-0.5 rounded-full"><RiCloseCircleLine /> Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(rule)} className="p-1.5 rounded-lg border accent hover:bg-blue-400/10 hover:text-blue-400 hover:border-blue-400/30 transition-colors" title="Edit"><RiEditLine /></button>
                        <button onClick={() => handleToggle(rule.id)} disabled={togglingId === rule.id} className={`p-1.5 rounded-lg border transition-colors ${rule.status === 'active' ? 'accent hover:bg-amber-400/10 hover:text-amber-400 hover:border-amber-400/30' : 'accent hover:bg-emerald-400/10 hover:text-emerald-400 hover:border-emerald-400/30'}`} title="Toggle status">
                          {togglingId === rule.id ? <RiLoader4Line className="animate-spin" /> : (rule.status === 'active' ? <RiToggleFill className="text-emerald-400" /> : <RiToggleLine />)}
                        </button>
                        <button onClick={() => handleDelete(rule.id, rule.name)} disabled={deletingId === rule.id} className="p-1.5 rounded-lg border accent hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/30 transition-colors" title="Delete">
                          {deletingId === rule.id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
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
      {rules?.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {rules.links?.map((link, i) => (
            link.url
              ? <button key={i} onClick={() => router.get(link.url, {}, { preserveState: true })} className={`px-3 py-1.5 text-sm rounded-lg border ${link.active ? 'bg-primary text-white border-primary' : 'accent heading hover:bg-primary/10'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
              : <span key={i} className="px-3 py-1.5 text-sm rounded-lg border accent secondary opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
          ))}
        </div>
      )}

      {/* ===== CREATE / EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl bg rounded-2xl border accent shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b accent">
              <h2 className="text-lg font-bold heading flex items-center gap-2">
                <RiCoupon2Line className="text-primary" />
                {editRule ? 'Edit Rule' : 'Create New Rule'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-red-400/10 hover:text-red-400 transition-colors secondary">
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium secondary mb-1.5">Rule Name <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. Summer Sale 20% Off" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none" />
              </div>

              {/* Type + Rate Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Rule Type</label>
                  <div className="flex gap-2">
                    {['discount', 'tax'].map(t => (
                      <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))} className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${form.type === t ? (t === 'discount' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' : 'bg-amber-400/10 text-amber-400 border-amber-400/30') : 'accent secondary hover:bg-primary/5'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Rate Type</label>
                  <div className="flex gap-2">
                    {['percentage', 'fixed'].map(r => (
                      <button key={r} onClick={() => setForm(p => ({ ...p, rate_type: r }))} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${form.rate_type === r ? 'bg-primary/10 text-primary border-primary/30' : 'accent secondary hover:bg-primary/5'}`}>{r === 'percentage' ? '% Percent' : '# Fixed'}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rate Value + Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Rate Value <span className="text-red-400">*</span> <span className="text-xs text-primary/70">{form.rate_type === 'percentage' ? '(%)' : '(fixed amount)'}</span></label>
                  <input type="number" min="0" step="0.01" placeholder={form.rate_type === 'percentage' ? 'e.g. 15' : 'e.g. 500'} value={form.rate_value} onChange={e => setForm(p => ({ ...p, rate_value: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Coupon Code <span className="text-xs opacity-60">(optional)</span></label>
                  <input type="text" placeholder="e.g. SUMMER20" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading font-mono focus:ring-2 focus:ring-primary/30 outline-none uppercase" />
                </div>
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium secondary mb-2">Apply To</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TARGET_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => { setForm(p => ({ ...p, target_type: key, target_ids: [] })); setTargetSearch('') }} className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs text-center transition-colors ${form.target_type === key ? 'bg-primary/10 text-primary border-primary/30' : 'accent secondary hover:bg-primary/5'}`}>
                      <span className="text-lg">{TARGET_ICONS[key]}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Multi-Select */}
              {form.target_type !== 'all' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium secondary">
                      Select {TARGET_LABELS[form.target_type]}
                      {form.target_ids.length > 0 && <span className="ml-2 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{form.target_ids.length} selected</span>}
                    </label>
                    {form.target_ids.length > 0 && <button onClick={() => setForm(p => ({ ...p, target_ids: [] }))} className="text-xs text-red-400 hover:underline">Clear all</button>}
                  </div>
                  <input type="text" placeholder={`Search ${TARGET_LABELS[form.target_type].toLowerCase()}...`} value={targetSearch} onChange={e => setTargetSearch(e.target.value)} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none mb-2" />
                  <div className="max-h-40 overflow-y-auto rounded-lg border accent">
                    {filteredTargetOptions.length === 0
                      ? <div className="py-4 text-center text-sm secondary">No items found</div>
                      : filteredTargetOptions.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 cursor-pointer border-b accent last:border-b-0 transition-colors">
                          <input type="checkbox" checked={form.target_ids.includes(opt.id)} onChange={() => toggleTargetId(opt.id)} className="accent-primary" />
                          <span className="text-sm heading truncate">{opt.label}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Min Spend */}
              <div>
                <label className="block text-sm font-medium secondary mb-1.5">Minimum Spend <span className="text-xs opacity-60">(optional)</span></label>
                <input type="number" min="0" step="0.01" placeholder="e.g. 1000" value={form.min_spend} onChange={e => setForm(p => ({ ...p, min_spend: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none" />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Start Date <span className="text-xs opacity-60">(optional)</span></label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">End Date <span className="text-xs opacity-60">(optional)</span></label>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none" />
                </div>
              </div>

              {/* Priority + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Priority <span className="text-xs opacity-60">(higher = applied first)</span></label>
                  <input type="number" min="0" placeholder="0" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium secondary mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {['active', 'inactive'].map(s => (
                      <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))} className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${form.status === s ? (s === 'active' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' : 'accent secondary') : 'accent secondary hover:bg-primary/5'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium secondary mb-1.5">Description <span className="text-xs opacity-60">(optional)</span></label>
                <textarea rows={2} placeholder="Internal notes about this rule..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border accent bg text-sm heading focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t accent">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border accent secondary text-sm hover:bg-primary/5 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                {submitting && <RiLoader4Line className="animate-spin" />}
                {editRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

