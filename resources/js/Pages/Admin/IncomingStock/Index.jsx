import AdminLayout from '@/Layouts/AdminLayout'
import axios from 'axios'
import React, { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import {
  RiTruckLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiSearchLine,
  RiAddCircleLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiExchangeLine,
  RiInboxArchiveLine,
  RiFileTextLine,
  RiStore3Line,
  RiArrowRightLine,
  RiLoader4Line,
  RiCloseLine,
  RiMoneyDollarCircleLine
} from 'react-icons/ri'
import { toast } from 'react-toastify'

export default function IncomingStockIndex({ orders = {}, filters = {}, stats = {}, suppliers = [], products = [] }) {
  const [search, setSearch] = useState(filters.search || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receivingId, setReceivingId] = useState(null)

  const currency = stats.currency || 'PKR'

  // New PO Form State
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    supplier_name: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    tracking_number: '',
    notes: '',
    items: [
      { product_id: '', variation_id: '', product_title: '', sku: '', quantity_ordered: 10, unit_cost: 0 }
    ]
  })

  // Add Item to PO
  const addItemRow = () => {
    setPoForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: '', variation_id: '', product_title: '', sku: '', quantity_ordered: 10, unit_cost: 0 }
      ]
    }))
  }

  // Remove Item from PO
  const removeItemRow = (idx) => {
    if (poForm.items.length <= 1) return
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }))
  }

  // Update Item in PO
  const updateItemRow = (idx, field, val) => {
    setPoForm(prev => {
      const updated = [...prev.items]
      updated[idx] = { ...updated[idx], [field]: val }

      // Auto-fill product title and SKU when product changes
      if (field === 'product_id') {
        const prod = products.find(p => String(p.id) === String(val))
        if (prod) {
          updated[idx].product_title = prod.title
          updated[idx].sku = prod.sku
          updated[idx].variation_id = ''
        }
      }

      return { ...prev, items: updated }
    })
  }

  // Handle Create PO Submission
  const handleCreatePo = async (e) => {
    e.preventDefault()

    // Validate items
    const validItems = poForm.items.filter(item => item.product_id && item.quantity_ordered > 0)
    if (validItems.length === 0) {
      toast.error('Please add at least one product with quantity greater than 0.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await axios.post(route('admin.incoming-stock.store'), {
        ...poForm,
        items: validItems
      })

      if (res.data?.success) {
        toast.success(res.data.message)
        setShowCreateModal(false)
        router.reload()
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create purchase order.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Receive stock into warehouse
  const handleReceiveOrder = async (order) => {
    if (!window.confirm(`Receive Purchase Order ${order.po_number}? This will instantly increment product stocks across your store!`)) {
      return
    }

    setReceivingId(order.id)
    try {
      const res = await axios.post(route('admin.incoming-stock.receive', order.id))
      if (res.data?.success) {
        toast.success(res.data.message)
        router.reload()
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to receive stock.'
      toast.error(msg)
    } finally {
      setReceivingId(null)
    }
  }

  // Update order status (in_transit or cancelled)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.post(route('admin.incoming-stock.status', orderId), { status: newStatus })
      if (res.data?.success) {
        toast.success(res.data.message)
        router.reload()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.')
    }
  }

  // Delete draft order
  const handleDeleteOrder = async (orderId, poNum) => {
    if (!window.confirm(`Delete incoming purchase order ${poNum}?`)) return

    try {
      const res = await axios.delete(route('admin.incoming-stock.destroy', orderId))
      if (res.data?.success) {
        toast.success(res.data.message)
        router.reload()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order.')
    }
  }

  // Filter application
  const applyFilter = (newStatus) => {
    setStatusFilter(newStatus)
    router.get(
      route('admin.incoming-stock.index'),
      {
        status: newStatus !== 'all' ? newStatus : undefined,
        search: search || undefined
      },
      { preserveState: true, replace: true }
    )
  }

  return (
    <AdminLayout title="Incoming Stock & Purchase Orders">
      <div className="w-full flex flex-col gap-6 py-6">

        {/* ── Top Header Banner ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-accent p-6 rounded-2xl border border-permanent/30 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
              <RiTruckLine className="size-4" />
              <span>Inbound Procurement &amp; Restocking</span>
            </div>
            <h1 className="text-2xl font-bold text-heading">Incoming Stock Orders</h1>
            <p className="text-sm text-secondary">
              Record purchase orders from suppliers, monitor in-transit deliveries, and automatically add stock to warehouse when received.
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#9e95f5] text-white text-sm font-semibold shadow-md shadow-primary/30 hover:opacity-95 transition-all"
            >
              <RiAddCircleLine className="size-5" />
              <span>+ Create Inbound PO</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-accent border border-permanent/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Inbound Shipments</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <RiTruckLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-heading">
                {(stats.ordered || 0) + (stats.in_transit || 0)}
              </span>
              <span className="text-xs text-secondary">active orders</span>
            </div>
            <span className="text-[11px] text-secondary mt-1 block">
              {stats.total_orders ?? 0} total purchase orders recorded
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-accent border border-permanent/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Incoming Units</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <RiInboxArchiveLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-blue-500">
                {stats.total_incoming_units?.toLocaleString() ?? 0}
              </span>
              <span className="text-xs text-secondary">units</span>
            </div>
            <span className="text-[11px] text-secondary mt-1 block">Awaiting warehouse check-in</span>
          </div>

          <div className="p-4 rounded-2xl bg-accent border border-permanent/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Inbound Cost Value</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <RiMoneyDollarCircleLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-500">
                {currency} {Number(stats.total_incoming_cost || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-secondary mt-1 block">Capital committed for reorders</span>
          </div>

          <div className="p-4 rounded-2xl bg-accent border border-permanent/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Completed Check-ins</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <RiCheckboxCircleLine className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-500">
                {stats.received ?? 0}
              </span>
              <span className="text-xs text-secondary">received</span>
            </div>
            <span className="text-[11px] text-secondary mt-1 block">Added directly to live stock</span>
          </div>
        </div>

        {/* ── Toolbar & Filters ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-accent p-4 rounded-2xl border border-permanent/30">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => applyFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-heading border border-permanent/30'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => applyFilter('ordered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'ordered'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-blue-500 border border-permanent/30'
              }`}
            >
              Ordered ({stats.ordered ?? 0})
            </button>
            <button
              onClick={() => applyFilter('in_transit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'in_transit'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-amber-500 border border-permanent/30'
              }`}
            >
              In Transit ({stats.in_transit ?? 0})
            </button>
            <button
              onClick={() => applyFilter('received')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'received'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-bg text-secondary hover:text-emerald-500 border border-permanent/30'
              }`}
            >
              Received ({stats.received ?? 0})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={route('admin.inventory.index')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View Current Warehouse Stock</span>
              <RiArrowRightLine className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Inbound Orders Table ── */}
        <div className="bg-accent rounded-2xl border border-permanent/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg/60 border-b border-permanent/30 text-[11px] font-bold uppercase tracking-wider text-secondary">
                <tr>
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-3">Supplier</th>
                  <th className="py-3.5 px-3">Order Date</th>
                  <th className="py-3.5 px-3">Expected Date</th>
                  <th className="py-3.5 px-3">Units (Rec/Ord)</th>
                  <th className="py-3.5 px-3">Total Cost</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-permanent/20">
                {(orders.data || []).length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-secondary">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RiInboxArchiveLine className="size-10 text-secondary/50" />
                        <span className="font-semibold text-heading">No incoming stock orders found</span>
                        <span className="text-xs">Create your first Purchase Order to schedule incoming deliveries.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (orders.data || []).map((order) => {
                    const isReceiving = receivingId === order.id

                    return (
                      <tr key={order.id} className="hover:bg-dynamic/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-heading">
                          <div className="flex flex-col">
                            <span>{order.po_number}</span>
                            {order.tracking_number && (
                              <span className="text-[10px] text-secondary font-mono">
                                Track: {order.tracking_number}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <RiStore3Line className="size-4 text-secondary" />
                            <span className="font-medium text-heading">{order.supplier_name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-secondary text-xs">
                          {order.order_date || '--'}
                        </td>

                        <td className="py-3.5 px-3 text-secondary text-xs">
                          {order.expected_delivery_date || '--'}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-xs font-semibold text-heading">
                            {order.total_units_received} / {order.total_units_ordered} pcs
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-heading">
                          {currency} {Number(order.total_cost || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              order.status === 'received'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : order.status === 'in_transit'
                                ? 'bg-amber-500/15 text-amber-500'
                                : order.status === 'cancelled'
                                ? 'bg-rose-500/15 text-rose-500'
                                : 'bg-blue-500/15 text-blue-500'
                            }`}
                          >
                            {order.status === 'in_transit' ? 'In Transit' : order.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.status === 'ordered' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'in_transit')}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 transition-colors"
                                title="Mark as dispatched / on the way"
                              >
                                Mark In Transit
                              </button>
                            )}

                            {['ordered', 'in_transit'].includes(order.status) && (
                              <button
                                onClick={() => handleReceiveOrder(order)}
                                disabled={isReceiving}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1"
                                title="Receive stock into inventory"
                              >
                                {isReceiving ? (
                                  <RiLoader4Line className="size-3.5 animate-spin" />
                                ) : (
                                  <RiCheckboxCircleLine className="size-3.5" />
                                )}
                                <span>Receive Stock</span>
                              </button>
                            )}

                            {order.status !== 'received' && (
                              <button
                                onClick={() => handleDeleteOrder(order.id, order.po_number)}
                                className="p-1.5 text-secondary hover:text-rose-500 rounded-lg hover:bg-dynamic/50 transition-colors"
                                title="Cancel / Delete Order"
                              >
                                <RiDeleteBinLine className="size-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Create Purchase Order Modal ── */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-accent w-full max-w-3xl rounded-2xl border border-permanent/40 p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-permanent/30">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-heading">New Inbound Purchase Order (PO)</h3>
                  <span className="text-xs text-secondary">
                    Plan incoming supplier restocks and define unit costs.
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-secondary hover:text-heading rounded-lg hover:bg-dynamic/50"
                >
                  <RiCloseLine className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePo} className="flex flex-col gap-5 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">
                      Select Supplier
                    </label>
                    <select
                      value={poForm.supplier_id}
                      onChange={(e) => {
                        const sid = e.target.value
                        const sup = suppliers.find(s => String(s.id) === String(sid))
                        setPoForm(prev => ({
                          ...prev,
                          supplier_id: sid,
                          supplier_name: sup ? sup.title : ''
                        }))
                      }}
                      className="w-full px-3 py-2 text-sm bg-bg border border-permanent/40 rounded-xl text-heading focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Choose Supplier / Vendor --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">
                      Or Custom Supplier Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Electronics Ltd"
                      value={poForm.supplier_name}
                      onChange={(e) => setPoForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-bg border border-permanent/40 rounded-xl text-heading focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">
                      Order Date
                    </label>
                    <input
                      type="date"
                      value={poForm.order_date}
                      onChange={(e) => setPoForm(prev => ({ ...prev, order_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-bg border border-permanent/40 rounded-xl text-heading focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">
                      Expected Arrival Date
                    </label>
                    <input
                      type="date"
                      value={poForm.expected_delivery_date}
                      onChange={(e) => setPoForm(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-bg border border-permanent/40 rounded-xl text-heading focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Items Repeater */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Inbound Products &amp; Quantities
                    </span>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      + Add Another Item
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {poForm.items.map((item, idx) => {
                      const selectedProd = products.find(p => String(p.id) === String(item.product_id))

                      return (
                        <div key={idx} className="flex items-center gap-2 p-2.5 bg-bg/80 rounded-xl border border-permanent/30">
                          {/* Product select */}
                          <div className="flex-1 min-w-[180px]">
                            <select
                              value={item.product_id}
                              onChange={(e) => updateItemRow(idx, 'product_id', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-accent border border-permanent/40 rounded-lg text-heading focus:outline-none"
                              required
                            >
                              <option value="">-- Select Product --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
                              ))}
                            </select>
                          </div>

                          {/* Variation select if product has variations */}
                          {selectedProd?.has_variations && (
                            <div className="w-36">
                              <select
                                value={item.variation_id}
                                onChange={(e) => updateItemRow(idx, 'variation_id', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-accent border border-permanent/40 rounded-lg text-heading focus:outline-none"
                              >
                                <option value="">Main Product</option>
                                {selectedProd.variations.map(v => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Qty */}
                          <div className="w-24">
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={item.quantity_ordered}
                              onChange={(e) => updateItemRow(idx, 'quantity_ordered', parseInt(e.target.value, 10) || 0)}
                              className="w-full px-2.5 py-1.5 text-xs bg-accent border border-permanent/40 rounded-lg text-heading focus:outline-none"
                              required
                            />
                          </div>

                          {/* Unit Cost */}
                          <div className="w-28">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Unit Cost"
                              value={item.unit_cost}
                              onChange={(e) => updateItemRow(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 text-xs bg-accent border border-permanent/40 rounded-lg text-heading focus:outline-none"
                              required
                            />
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1.5 text-secondary hover:text-rose-500 rounded"
                            title="Remove row"
                          >
                            <RiCloseLine className="size-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-permanent/30">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-secondary hover:text-heading"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/30 hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    {isSubmitting && <RiLoader4Line className="size-3.5 animate-spin" />}
                    <span>Save Purchase Order</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
