import AdminLayout from '@/Layouts/AdminLayout'
import axios from 'axios'
import React, { useState, useMemo } from 'react'
import { router, Link } from '@inertiajs/react'
import {
  RiArchiveLine,
  RiAlertLine,
  RiCheckDoubleLine,
  RiCloseCircleLine,
  RiSearchLine,
  RiFilter3Line,
  RiEditLine,
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
  RiArrowRightUpLine,
  RiSparkling2Line,
  RiInformationLine,
  RiLoader4Line,
  RiExchangeLine,
  RiPriceTag3Line,
  RiStackLine
} from 'react-icons/ri'
import { toast } from 'react-toastify'

export default function InventoryIndex({ products = [], stores = [], filters = {}, stats = {} }) {
  const [search, setSearch] = useState(filters.search || '')
  const [filter, setFilter] = useState(filters.filter || 'all')
  const [selectedStore, setSelectedStore] = useState(filters.store || 'all')
  const [threshold, setThreshold] = useState(filters.threshold || 5)
  const [editingId, setEditingId] = useState(null) // 'product-123' or 'var-456'
  const [editingValue, setEditingValue] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [expandedProducts, setExpandedProducts] = useState({})

  const currency = stats.currency || 'PKR'

  // Toggle variant rows accordion
  const toggleExpanded = (id) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Filter application
  const applyFilter = (newFilter, newThreshold = threshold, newStore = selectedStore) => {
    setFilter(newFilter)
    router.get(
      route('admin.inventory.index'),
      {
        search: search || undefined,
        filter: newFilter !== 'all' ? newFilter : undefined,
        store: newStore !== 'all' ? newStore : undefined,
        threshold: newThreshold !== 5 ? newThreshold : undefined
      },
      { preserveState: true, replace: true }
    )
  }

  const handleStoreChange = (e) => {
    const val = e.target.value
    setSelectedStore(val)
    applyFilter(filter, threshold, val)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    router.get(
      route('admin.inventory.index'),
      {
        search: search || undefined,
        filter: filter !== 'all' ? filter : undefined,
        store: selectedStore !== 'all' ? selectedStore : undefined,
        threshold: threshold !== 5 ? threshold : undefined
      },
      { preserveState: true, replace: true }
    )
  }

  // Start inline edit
  const startEdit = (key, currentStock) => {
    setEditingId(key)
    setEditingValue(String(currentStock))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingValue('')
  }

  // Save stock update
  const saveStock = async (item, isVariation = false) => {
    const parsedStock = parseInt(editingValue, 10)
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error('Please enter a valid stock quantity (0 or greater).')
      return
    }

    const key = isVariation ? `var-${item.id}` : `prod-${item.id}`
    setSavingId(key)

    try {
      const endpoint = isVariation
        ? route('admin.inventory.update-variation-stock', item.id)
        : route('admin.inventory.update-stock', item.id)

      const res = await axios.post(endpoint, { stock: parsedStock })

      if (res.data?.success) {
        toast.success(res.data.message || 'Stock updated!')
        cancelEdit()
        // Soft refresh without full reload
        router.reload({ only: ['products', 'stats'] })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update stock.'
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <AdminLayout title="Inventory & Stock Management">
      <div className="w-full flex flex-col gap-6 py-6">

        {/* ── Top Header Banner ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-accent p-6 rounded-2xl border border-permanent/30 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
              <RiStackLine className="size-4" />
              <span>Real-Time Warehouse Stock</span>
            </div>
            <h1 className="text-2xl font-bold text-heading">Inventory Management</h1>
            <p className="text-sm text-secondary">
              Monitor, track, and inline-update live product inventory, variants, and low-stock alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.reload()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-permanent/40 hover:bg-dynamic/50 text-heading text-sm font-medium transition-colors"
            >
              <RiRefreshLine className="size-4 text-secondary" />
              <span>Refresh</span>
            </button>
            <Link
              href={route('post.create', { type: 'product' })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#9e95f5] text-white text-sm font-semibold shadow-md shadow-primary/30 hover:opacity-95 transition-all"
            >
              <span>+ Add New Product</span>
            </Link>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div
            onClick={() => applyFilter('all')}
            className={`p-4 rounded-2xl bg-accent border cursor-pointer transition-all hover:shadow-md ${
              filter === 'all' ? 'border-primary ring-2 ring-primary/20' : 'border-permanent/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Total Products</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <RiArchiveLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-heading">{stats.total_products ?? 0}</span>
              <span className="text-xs text-secondary">items</span>
            </div>
            <span className="text-[10px] text-secondary mt-1 block">
              {stats.total_units?.toLocaleString() ?? 0} total units
            </span>
          </div>

          <div
            onClick={() => applyFilter('in')}
            className={`p-4 rounded-2xl bg-accent border cursor-pointer transition-all hover:shadow-md ${
              filter === 'in' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-permanent/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">In Stock</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <RiCheckDoubleLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-500">{stats.in_stock ?? 0}</span>
              <span className="text-xs text-secondary">healthy</span>
            </div>
            <span className="text-[10px] text-secondary mt-1 block">Ready to fulfill</span>
          </div>

          <div
            onClick={() => applyFilter('low')}
            className={`p-4 rounded-2xl bg-accent border cursor-pointer transition-all hover:shadow-md ${
              filter === 'low' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-permanent/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Low Stock</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <RiAlertLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-amber-500">{stats.low_stock ?? 0}</span>
              <span className="text-xs text-secondary">&le; {threshold} pcs</span>
            </div>
            <span className="text-[10px] text-secondary mt-1 block">Reorder alert</span>
          </div>

          <div
            onClick={() => applyFilter('out')}
            className={`p-4 rounded-2xl bg-accent border cursor-pointer transition-all hover:shadow-md ${
              filter === 'out' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-permanent/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Out of Stock</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <RiCloseCircleLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-rose-500">{stats.out_of_stock ?? 0}</span>
              <span className="text-xs text-secondary">critical</span>
            </div>
            <span className="text-[10px] text-secondary mt-1 block">0 units available</span>
          </div>

          <div className="p-4 rounded-2xl bg-accent border border-permanent/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Inventory Cost</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <RiPriceTag3Line className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-heading">
                {currency} {Number(stats.total_cost || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-secondary mt-1 block">Total buy capital</span>
          </div>

          <div className="p-4 rounded-2xl bg-accent border border-permanent/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Projected Profit</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <RiSparkling2Line className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-emerald-500">
                {currency} {Number(stats.total_projected_profit || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-secondary mt-1 block">Gross margin pool</span>
          </div>
        </div>

        {/* ── Filters & Search Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-accent p-4 rounded-2xl border border-permanent/30">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product title or ID..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-bg border border-permanent/40 rounded-xl text-heading placeholder:text-secondary focus:outline-none focus:border-primary"
            />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-wrap">
            {stores && stores.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider hidden md:inline">
                  Store:
                </span>
                <select
                  value={selectedStore}
                  onChange={handleStoreChange}
                  className="bg-bg text-heading border border-permanent/40 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
                >
                  <option value="all">All Stores / Branches</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <span className="text-xs font-semibold text-secondary uppercase tracking-wider hidden md:inline">
              Filter:
            </span>
            <button
              onClick={() => applyFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-heading border border-permanent/30'
              }`}
            >
              All ({stats.total_products ?? 0})
            </button>
            <button
              onClick={() => applyFilter('in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'in'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-emerald-500 border border-permanent/30'
              }`}
            >
              In Stock ({stats.in_stock ?? 0})
            </button>
            <button
              onClick={() => applyFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'low'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-amber-500 border border-permanent/30'
              }`}
            >
              Low Stock ({stats.low_stock ?? 0})
            </button>
            <button
              onClick={() => applyFilter('out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'out'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-rose-500 border border-permanent/30'
              }`}
            >
              Out of Stock ({stats.out_of_stock ?? 0})
            </button>
          </div>
        </div>

        {/* ── Products Inventory Table ── */}
        <div className="bg-accent rounded-2xl border border-permanent/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg/60 border-b border-permanent/30 text-[11px] font-bold uppercase tracking-wider text-secondary">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-3">SKU</th>
                  <th className="py-3.5 px-3">Store</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Supplier</th>
                  <th className="py-3.5 px-3">Buy Cost</th>
                  <th className="py-3.5 px-3">Sale Price</th>
                  <th className="py-3.5 px-3">Unit Margin</th>
                  <th className="py-3.5 px-3">Stock Units</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Edit / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-permanent/20">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-12 text-center text-secondary">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RiArchiveLine className="size-10 text-secondary/50" />
                        <span className="font-semibold text-heading">No products found</span>
                        <span className="text-xs">
                          {search ? 'Try clearing your search query or filters.' : 'No products in inventory yet.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((item) => {
                    const isEditing = editingId === `prod-${item.id}`
                    const isSaving = savingId === `prod-${item.id}`
                    const isExpanded = !!expandedProducts[item.id]

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-dynamic/30 transition-colors">
                          {/* Product Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={`/storage/${item.image}`}
                                  alt={item.title}
                                  className="size-10 rounded-xl object-cover border border-permanent/30 shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = '/assets/images/placeholder.png'
                                  }}
                                />
                              ) : (
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                                  {item.title ? item.title.charAt(0).toUpperCase() : 'P'}
                                </div>
                              )}
                              <div className="flex flex-col max-w-[280px]">
                                <span className="font-semibold text-heading truncate hover:text-primary transition-colors">
                                  {item.title}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-secondary">ID: #{item.id}</span>
                                  {item.has_variations && (
                                    <button
                                      onClick={() => toggleExpanded(item.id)}
                                      className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                                    >
                                      <span>{item.variations.length} Variants</span>
                                      <span>{isExpanded ? '▴' : '▾'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs text-secondary bg-bg px-2 py-1 rounded border border-permanent/30">
                              {item.sku}
                            </span>
                          </td>

                          {/* Store / Branch */}
                          <td className="py-3.5 px-3">
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block max-w-[130px] truncate">
                              🏪 {item.store || 'Not Assigned'}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-3">
                            <span className="text-xs text-heading font-medium">
                              {item.category}
                            </span>
                          </td>

                          {/* Supplier */}
                          <td className="py-3.5 px-3">
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block max-w-[120px] truncate">
                              {item.supplier || 'Not Assigned'}
                            </span>
                          </td>

                          {/* Buy Cost */}
                          <td className="py-3.5 px-3 text-xs text-secondary font-mono">
                            {item.buy_price > 0 ? (
                              <span>{currency} {Number(item.buy_price).toLocaleString()}</span>
                            ) : (
                              <span className="text-secondary/50 italic">--</span>
                            )}
                          </td>

                          {/* Sale Price */}
                          <td className="py-3.5 px-3 font-semibold text-heading">
                            {currency} {Number(item.price || 0).toLocaleString()}
                          </td>

                          {/* Unit Margin */}
                          <td className="py-3.5 px-3">
                            {item.buy_price > 0 ? (
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold ${item.unit_profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {item.unit_profit >= 0 ? '+' : ''}{currency} {Number(item.unit_profit).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-secondary">
                                  {item.margin_pct}% margin
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-secondary/60 italic">Set buy price</span>
                            )}
                          </td>

                          {/* Stock Units (with inline editor) */}
                          <td className="py-3.5 px-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveStock(item, false)
                                    if (e.key === 'Escape') cancelEdit()
                                  }}
                                  className="w-20 px-2 py-1 text-xs font-semibold bg-bg border border-primary rounded-lg text-heading focus:outline-none"
                                />
                                <button
                                  onClick={() => saveStock(item, false)}
                                  disabled={isSaving}
                                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                  title="Save"
                                >
                                  {isSaving ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiCheckLine className="size-3.5" />}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                                  title="Cancel"
                                >
                                  <RiCloseLine className="size-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                    item.stock_status === 'out'
                                      ? 'bg-rose-500/15 text-rose-500'
                                      : item.stock_status === 'low'
                                      ? 'bg-amber-500/15 text-amber-500'
                                      : 'bg-emerald-500/15 text-emerald-500'
                                  }`}
                                >
                                  {item.stock} units
                                </span>
                                {!item.has_variations && (
                                  <button
                                    onClick={() => startEdit(`prod-${item.id}`, item.stock)}
                                    className="p-1 text-secondary hover:text-primary rounded hover:bg-dynamic/50 transition-colors"
                                    title="Quick Edit Stock"
                                  >
                                    <RiEditLine className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Stock Status Badge */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                item.stock_status === 'out'
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : item.stock_status === 'low'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-emerald-500/15 text-emerald-500'
                              }`}
                            >
                              {item.stock_status === 'out'
                                ? 'Out of Stock'
                                : item.stock_status === 'low'
                                ? 'Low Stock'
                                : 'In Stock'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={route('post.edit', { type: 'product', id: item.id })}
                                className="flex items-center gap-1 text-xs text-secondary hover:text-primary font-medium p-1.5 rounded-lg hover:bg-dynamic/50 transition-colors"
                                title="Edit Product Details"
                              >
                                <RiEditLine className="size-4" />
                                <span>Edit</span>
                              </Link>
                              <a
                                href={`/product/${item.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-secondary hover:text-heading p-1.5 rounded-lg hover:bg-dynamic/50 transition-colors"
                                title="View in Storefront"
                              >
                                <RiArrowRightUpLine className="size-4" />
                              </a>
                            </div>
                          </td>
                        </tr>

                        {/* ── Variations Accordion Row ── */}
                        {item.has_variations && isExpanded && (
                          <tr className="bg-bg/40 border-y border-dashed border-permanent/30">
                            <td colSpan="11" className="py-3 px-8">
                              <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                                  Variants for &ldquo;{item.title}&rdquo;:
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {item.variations.map((v) => {
                                    const isVarEditing = editingId === `var-${v.id}`
                                    const isVarSaving = savingId === `var-${v.id}`

                                    return (
                                      <div
                                        key={v.id}
                                        className="flex items-center justify-between p-2.5 bg-accent rounded-xl border border-permanent/30 text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          {v.color && (
                                            <span
                                              className="size-3.5 rounded-full border border-black/20 shrink-0"
                                              style={{ backgroundColor: v.color }}
                                            />
                                          )}
                                          <span className="font-semibold text-heading truncate max-w-[130px]">
                                            {v.name}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {isVarEditing ? (
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="number"
                                                min="0"
                                                autoFocus
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') saveStock(v, true)
                                                  if (e.key === 'Escape') cancelEdit()
                                                }}
                                                className="w-16 px-1.5 py-0.5 text-xs bg-bg border border-primary rounded text-heading focus:outline-none"
                                              />
                                              <button
                                                onClick={() => saveStock(v, true)}
                                                disabled={isVarSaving}
                                                className="p-1 rounded bg-emerald-600 text-white"
                                              >
                                                {isVarSaving ? <RiLoader4Line className="size-3 animate-spin" /> : <RiCheckLine className="size-3" />}
                                              </button>
                                              <button
                                                onClick={cancelEdit}
                                                className="p-1 rounded bg-rose-600 text-white"
                                              >
                                                <RiCloseLine className="size-3" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5">
                                              <span
                                                className={`px-2 py-0.5 rounded-full font-bold ${
                                                  v.stock <= 0
                                                    ? 'bg-rose-500/15 text-rose-500'
                                                    : v.stock <= threshold
                                                    ? 'bg-amber-500/15 text-amber-500'
                                                    : 'bg-emerald-500/15 text-emerald-500'
                                                }`}
                                              >
                                                {v.stock} pcs
                                              </span>
                                              <button
                                                onClick={() => startEdit(`var-${v.id}`, v.stock)}
                                                className="p-1 text-secondary hover:text-primary rounded transition-colors"
                                                title="Quick edit variant stock"
                                              >
                                                <RiEditLine className="size-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
