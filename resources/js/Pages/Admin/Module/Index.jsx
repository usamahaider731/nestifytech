import ActionDropdown from '@/Components/ActionDropdown'
import ImageViwer from '@/Components/Admin/ImageViwer'
import Checkbox from '@/Components/Admin/Checkbox'
import Table from '@/Components/Admin/Table'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useEffect, useMemo, useState } from 'react'
import { hasPermission, stripTags } from '@/Utils/helper'
import { TbDotsVertical, TbCloudDownload, TbCloudUpload, TbFileZip, TbDatabaseImport, TbDatabaseExport } from 'react-icons/tb'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { RiBarChartBoxLine, RiCheckboxCircleLine, RiDraftLine, RiStackLine, RiArrowLeftLine, RiCheckLine, RiCloseLine, RiErrorWarningLine, RiArrowLeftSLine, RiLayoutGridFill, RiListUnordered, RiStarFill } from 'react-icons/ri'
import axios from 'axios'

function Index({ data, table, type, stats }) {
  const { auth } = usePage().props
  const [Rows, setRows] = useState(data?.data || data || [])
  const [exportFormat, setExportFormat] = useState('csv')
  const [importing, setImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showAdvancedModal, setShowAdvancedModal] = useState(false)
  const [activeTab, setActiveTab] = useState('export') // export or import
  const [importFile, setImportFile] = useState(null)
  const [toasts, setToasts] = useState([])
  const [viewMode, setViewMode] = useState('table')

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const handlePostAction = async (href, data = {}, label = '') => {
    try {
      await axios.post(href, data, {
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content }
      })
      addToast(`${label || 'Action'} completed successfully.`, 'success')
      // Refresh page data via Inertia without full reload
      router.reload({ only: ['data'] })
    } catch (err) {
      const msg = err?.response?.data?.message || `${label || 'Action'} failed. Please try again.`
      addToast(msg, 'error')
    }
  }
  useEffect(() => {
    setRows(data?.data || data || [])
  }, [data, type])

  const columns = useMemo(() => {
    if (Array.isArray(table?.columns) && table.columns.length > 0) return table.columns

    // Fallback when schema has no table.columns (e.g. attributes.json)
    const first = (data?.data && data.data[0]) ? data.data[0] : (Array.isArray(data) ? data[0] : null)
    if (!first) return []

    const keys = Object.keys(first).filter(k => !['meta'].includes(k))
    const safe = keys.slice(0, 8) // keep UI reasonable
    return safe.map(k => ({
      id: k,
      label: k.toUpperCase(),
      column: k,
      width: `${Math.floor(100 / Math.max(safe.length, 1))}%`,
    }))
  }, [table?.columns, data])
  const canWrite = hasPermission(auth?.user, `${type.split('_')[0]}-write`)
  const canDelete = hasPermission(auth?.user, `${type.split('_')[0]}-delete`)
  const baseRoutes = useMemo(() => {
    // Prefer unified module routes everywhere
    return {
      index: 'module.index',
      create: 'module.create',
      edit: 'module.edit',
      delete: 'module.delete'
    }
  }, [])

  const renderImage = (row, column) => {
    const value = row?.[column.column]
    return (
      <div className='w-full flex items-center justify-center'>
        <div className='size-9.5 flex justify-center items-center rounded bg-dynamic overflow-hidden'>
          {value ? (
            <ImageViwer image={value} className='max-w-4/5 object-cover aspect-square' />
          ) : (
            <img src="/assets/image/profile-avatar.webp" className='size-7.5 rounded-full object-cover' alt="" />
          )}
        </div>
      </div>
    )
  }

  const renderBadges = (row, column) => {
    const value = row?.[column.column]

    // Support both styles:
    // - array of objects -> badges
    // - scalar (string/number) -> plain text (used by category parent_id lookup)
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None'
      return (
        <div className='w-full h-full flex items-center justify-center gap-1.5 flex-wrap'>
          {value.map((p, idx) => (
            <div key={p?.id ?? `${p?.title ?? p?.name ?? 'item'}-${idx}`} className='bg-primary px-1.5 py-0.75 w-fit rounded-md text-[10px] font-medium text-white'>
              {p?.title ?? p?.name ?? '—'}
            </div>
          ))}
        </div>
      )
    }

    if (value === null || typeof value === 'undefined' || value === '') return 'None'
    return String(value)
  }
  const renderLink = (row, column) => {
    const value = row?.[column.column]
    const title = value?.[column.value_condition.return_key] ?? value.name;
    let link = "#"
    if (column.value_table === 'posts') {
      link = route('post', { "type": 'product', sku: value.sku, "id": value.id })
    }

    if (!value || value === 'null') return 'None'
    return (
      <div className='text-[10px] font-medium text-primary px-3 py-1.25 w-fit mx-auto rounded-full'>
        <Link aria-label={`View ${title}`} target={'_blank'} rel="noopener noreferrer" href={link}>{title}</Link>
      </div>
    )
  }
  const renderDiscount = (row, column) => {
    const discount = row?.[column.column]
    if (!discount || discount === 'null') return 'None'
    return (
      <div className='bg-green-600 text-[10px] font-medium text-white px-3 py-1.25 w-fit mx-auto rounded-full'>
        {discount}% Discount
      </div>
    )
  }

  const renderBrandImage = (row) => {
    const brand = row?.brand
    if (!brand) return 'None'
    if (typeof brand === 'string') return brand

    return (
      <div className='w-full h-full flex items-center justify-center'>
        {brand?.image ? <ImageViwer image={brand.image} width={80} height={40} className='h-10 w-auto max-w-[80px] object-contain' /> : (brand?.title ?? 'None')}
      </div>
    )
  }

  const renderStatusDot = (row, column) => {
    const status = row?.[column.column]
    return (
      <div className='w-full flex items-center justify-center'>
        <div className={`size-4 rounded-full ${status === 'publish' ? 'bg-green-600' : 'bg-red-500'}`} />
      </div>
    )
  }

  const renderAction = (row, column) => {
    // If the schema defines specific actions
    if (column && column.actions && Array.isArray(column.actions)) {
      return (
        <div className='w-full flex h-12 my-auto items-center gap-3 justify-center'>
          <ActionDropdown>
            <ActionDropdown.Trigger>
              <TbDotsVertical className='cursor-pointer size-4.25' />
            </ActionDropdown.Trigger>
            <ActionDropdown.Context className='flex flex-col gap-0.75 shadow-[2px_2px_3px_2px] shadow-secondary'>
              {column.actions.map((actionItem, idx) => {
                let href = '#';

                // If there's a condition to show this action based on row data
                if (actionItem.condition) {
                  const { key, operator, value } = actionItem.condition;
                  if (operator === '==' && row[key] != value) return null;
                  if (operator === '!=' && row[key] == value) return null;
                }

                if (actionItem.route) {
                  let params = { type, id: row.id };
                  if (actionItem.params) {
                    params = { ...params, ...actionItem.params };
                  }
                  // Replace dynamic params from row
                  Object.keys(params).forEach(k => {
                    if (typeof params[k] === 'string' && params[k].startsWith('{') && params[k].endsWith('}')) {
                      const rowKey = params[k].replace(/[{}]/g, '');
                      params[k] = row[rowKey];
                    }
                  });
                  href = route(actionItem.route, params);
                } else if (actionItem.url_template) {
                  href = actionItem.url_template;
                  Object.keys(row).forEach(k => {
                    href = href.replace(`{${k}}`, row[k] || '');
                  });
                }

                if (actionItem.type === 'external') {
                  return (
                    <a key={idx} href={href} target={actionItem.target || '_self'} className="block w-full text-left px-4 py-2 text-sm text-text hover:bg-common hover:text-primary transition-colors">
                      {actionItem.label}
                    </a>
                  )
                }

                return (
                  actionItem.method?.toUpperCase() === 'POST' ? (
                    <button
                      key={idx}
                      onClick={() => handlePostAction(href, actionItem.data || {}, actionItem.label)}
                      className={`h-10 w-full px-3 cursor-pointer flex items-center justify-start rounded-md transition-colors text-sm font-medium ${actionItem.label === 'Approve' ? 'text-green-600 hover:bg-green-100' :
                          actionItem.label === 'Reject' ? 'text-red-500 hover:bg-red-100' :
                            actionItem.label === 'Delete' ? 'text-red-700 hover:bg-red-100' :
                              'text-heading hover:bg-primary hover:text-white'
                        }`}
                    >
                      {actionItem.label}
                    </button>
                  ) : (
                    <ActionDropdown.Link
                      key={idx}
                      method={actionItem.method || 'GET'}
                      href={href}
                      className={`h-10 w-full px-3 cursor-pointer flex items-center justify-start rounded-md transition-colors text-sm font-medium ${actionItem.label === 'Approve' ? 'text-green-600 hover:bg-green-100' :
                          actionItem.label === 'Reject' ? 'text-red-500 hover:bg-red-100' :
                            actionItem.label === 'Delete' ? 'text-red-700 hover:bg-red-100' :
                              'text-heading hover:bg-primary hover:text-white'
                        }`}
                    >
                      {actionItem.label}
                    </ActionDropdown.Link>
                  )
                )
              })}
            </ActionDropdown.Context>
          </ActionDropdown>
        </div>
      )
    }

    // Default action behavior
    return (
      <div className='w-full flex h-12 my-auto items-center gap-3 justify-center'>
        <ActionDropdown>
          <ActionDropdown.Trigger>
            <TbDotsVertical className='cursor-pointer size-4.25' />
          </ActionDropdown.Trigger>
          <ActionDropdown.Context className='flex flex-col gap-0.75 shadow-[2px_2px_3px_2px] shadow-secondary'>
            {canWrite && (
              <ActionDropdown.Link href={route(baseRoutes.edit, { type, id: row.id })}>
                Edit
              </ActionDropdown.Link>
            )}
            {canDelete && (
              <ActionDropdown.Link method={"POST"} href={route(baseRoutes.delete, { type, id: row.id })}>
                Delete
              </ActionDropdown.Link>
            )}

          </ActionDropdown.Context>
        </ActionDropdown>
      </div>
    )
  }

  const fieldRender = (row, column) => {
    switch (column.type) {
      case 'image':
        return renderImage(row, column)
      case 'description':
        return stripTags(row?.[column.column] ?? '')
      case 'badage':
      case 'badge':
      case 'category_badges':
      case 'role_badges':
        return renderBadges(row, column)
      case 'brand_image':
        return renderBrandImage(row)
      case 'discount':
        return renderDiscount(row, column)
      case 'status_dot':
        return renderStatusDot(row, column)
      case 'status_badge': {
        const s = row?.[column.column]
        const map = {
          approved: 'bg-green-100 text-green-700',
          rejected: 'bg-red-100 text-red-600',
          pending: 'bg-amber-100 text-amber-700',
        }
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>
            {s ?? '—'}
          </span>
        )
      }
      case 'action':
        return renderAction(row, column)
      case 'link':
        return renderLink(row, column)
      default:
        return row?.[column.column]
    }
  }

  const renderCardStatus = (row, col) => {
    if (!col) return null
    const val = row?.[col.column] ?? row?.[col.id]
    if (val === undefined || val === null || val === '') return null

    const valStr = String(val).toLowerCase()
    const isApprovedOrPublished = ['publish', 'published', 'approved', 'active', '1', 'true'].includes(valStr)
    const isPending = ['pending', 'draft', 'in_review'].includes(valStr)
    const isRejectedOrDeleted = ['rejected', 'delete', 'deleted', 'inactive', '0', 'false'].includes(valStr)

    const badgeStyle = isApprovedOrPublished
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
      : isPending
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
        : isRejectedOrDeleted
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
          : 'bg-dynamic text-secondary border-secondary/20'

    const dotStyle = isApprovedOrPublished
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      : isPending
        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
        : isRejectedOrDeleted
          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
          : 'bg-secondary'

    const labelMap = {
      publish: 'Published',
      '1': 'Active',
      '0': 'Inactive',
      draft: 'Draft',
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
    }
    const label = labelMap[valStr] || (typeof val === 'string' ? val : valStr)

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle} capitalize tracking-wide transition-colors select-none`}>
        <span className={`size-1.5 rounded-full ${dotStyle}`} />
        <span>{label}</span>
      </span>
    )
  }

  const renderCardImage = (row, col, titleText) => {
    if (!col) return null
    const val = row?.[col.column] ?? row?.[col.id]
    if (val) {
      return (
        <ImageViwer
          image={val}
          className='w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300'
        />
      )
    }
    // Sleek branded monogram avatar if no image
    const initial = String(titleText || row?.id || '?').charAt(0).toUpperCase()
    return (
      <div className='w-full h-full rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-dynamic/80 flex items-center justify-center font-bold text-lg text-primary select-none group-hover:scale-105 transition-transform duration-300 shadow-inner'>
        {initial}
      </div>
    )
  }

  const renderCardBadge = (row, col) => {
    if (!col) return null
    const colId = col.id || col.column
    const val = row?.[col.column] ?? row?.[col.id]

    // Special styling for ratings
    if (colId === 'rating' || col.column === 'rating') {
      const ratingVal = val ?? row?.rating ?? 5
      return (
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-2xs'>
          <RiStarFill className='size-3 text-amber-500 fill-amber-500' />
          <span>{ratingVal}</span>
          <span className='text-[10px] text-amber-500/70 font-normal'>/ 5</span>
        </span>
      )
    }

    // Special styling for brand images
    if (col.type === 'brand_image') {
      const brand = row?.brand
      if (!brand) return null
      if (brand?.image) {
        return (
          <div className='h-7 px-2.5 rounded-lg bg-dynamic/50 border border-secondary/15 flex items-center justify-center hover:border-primary/30 transition-colors' title={brand?.title}>
            <ImageViwer image={brand.image} width={70} height={24} className='h-4.5 w-auto max-w-[65px] object-contain' />
          </div>
        )
      }
      return (
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-dynamic/60 text-heading border border-secondary/15'>
          {brand?.title || brand}
        </span>
      )
    }

    // Special styling for user avatars list (e.g. on roles card)
    if (colId === 'users' || col.type === 'user_avatars') {
      const usersList = Array.isArray(val) ? val : (Array.isArray(row?.users) ? row.users : []);
      const totalCount = row?.users_count !== undefined ? row.users_count : usersList.length;
      const visible = usersList.slice(0, 3);
      const remaining = totalCount - visible.length;

      if (totalCount === 0) {
        return <span className='text-xs text-secondary/70 italic'>No users</span>;
      }

      return (
        <div className='flex items-center -space-x-2.5 overflow-hidden py-1'>
          {visible.map((u, idx) => {
            const avatar = u?.image || u?.user_avater;
            const uName = u?.name || `User ${idx + 1}`;
            return (
              <div
                key={u?.id || idx}
                title={uName}
                className='relative size-10 rounded-full ring-2 ring-accent bg-dynamic overflow-hidden flex items-center justify-center shadow-xs shrink-0'
              >
                {avatar ? (
                  <ImageViwer image={avatar} className='size-10 rounded-full object-cover' />
                ) : (
                  <div className='size-10 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center uppercase'>
                    {uName.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}
          {remaining > 0 && (
            <div
              title={`${remaining} more user${remaining > 1 ? 's' : ''}`}
              className='relative size-10 rounded-full ring-2 ring-accent bg-dynamic/90 text-heading font-bold text-xs flex items-center justify-center shadow-xs shrink-0'
            >
              +{remaining}
            </div>
          )}
        </div>
      );
    }

    // Badges / category / role
    if (['badage', 'badge', 'category_badges', 'role_badges'].includes(col.type)) {
      return (
        <div className='flex items-center gap-1.5 flex-wrap [&>div]:!h-auto [&>div]:!w-auto [&>div]:!justify-start'>
          {fieldRender(row, col)}
        </div>
      )
    }

    // Fallback chip
    return (
      <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-dynamic/50 text-secondary border border-secondary/15'>
        {col.label && <span className='text-[10px] opacity-70 uppercase tracking-wider font-semibold'>{col.label}:</span>}
        <span className='font-semibold text-heading truncate max-w-32'>{fieldRender(row, col)}</span>
      </span>
    )
  }

  const handleExport = () => {
    // Determine table name. Default to plural of type if not provided explicitly in table schema.
    const tableName = table?.table || (type + 's');
    let exportUrl = route('admin.export') + '?table=' + tableName + '&type=' + type + '&format=' + exportFormat;
    if (selectedIds.length > 0) {
      exportUrl += '&ids=' + selectedIds.join(',');
    }
    window.location.href = exportUrl;
  }

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const tableName = table?.table || (type + 's');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table', tableName);
    formData.append('type', type);
    formData.append('format', exportFormat);

    router.post(route('admin.import'), formData, {
      onSuccess: () => alert('Import successful'),
      onError: (err) => alert(err.file || err.table || 'Import failed'),
      onFinish: () => setImporting(false)
    });
  }

  // Determine if this is a posts-type or taxonomy-type module for stat labels
  const isPostModule = stats && 'published' in stats
  const statCards = stats ? [
    {
      label: 'Total',
      value: stats.total ?? 0,
      change: stats.total_change,
      icon: <RiStackLine />,
      bg: 'bg-blue-500/15 text-blue-600',
      border: 'border-blue-200',
      note: stats.total_change > 0 ? `+${stats.total_change}% from last week` : `${stats.total_change}% from last week`,
    },
    isPostModule ? {
      label: 'Published',
      value: stats.published ?? 0,
      change: stats.published_change,
      icon: <RiCheckboxCircleLine />,
      bg: 'bg-green-500/15 text-green-600',
      border: 'border-green-200',
      note: 'Last week analytics',
    } : {
      label: 'Active',
      value: stats.active ?? 0,
      icon: <RiCheckboxCircleLine />,
      bg: 'bg-green-500/15 text-green-600',
      border: 'border-green-200',
      note: 'Last week analytics',
      change: stats.active_change
    },
    isPostModule ? {
      label: 'Draft',
      value: stats.draft ?? 0,
      icon: <RiDraftLine />,
      change: stats.draft_change,
      bg: 'bg-amber-500/15 text-amber-600',
      border: 'border-amber-200',
      note: 'Last week analytics',
    } : {
      label: 'Inactive',
      value: stats.other ?? 0,
      icon: <RiDraftLine />,
      change: stats.other_change,
      bg: 'bg-amber-500/15 text-amber-600',
      border: 'border-amber-200',
      note: 'Last week analytics',
    }
  ] : []

  if (stats && 'in_stock' in stats) {
    statCards.push(
      {
        label: 'In Stock',
        value: stats.in_stock ?? 0,
        change: stats.in_stock_change,
        icon: <RiCheckboxCircleLine />,
        bg: 'bg-green-500/15 text-green-600',
        border: 'border-green-200',
        note: 'Last week analytics',
      },
      {
        label: 'Out of Stock',
        value: stats.out_stock ?? 0,
        change: stats.out_stock_change,
        icon: <RiDraftLine />,
        bg: 'bg-red-500/15 text-red-600',
        border: 'border-red-200',
        note: 'Last week analytics',
      }
    );
  }
  return (
    <div className='w-full py-7 flex flex-col gap-7.5'>

      {/* ── Stat Cards ── */}
      {statCards.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {statCards.map((card, i) => (
            <div key={i} className={`p-5 flex col-span-1 justify-between flex-col gap-10 items-start shadow bg-accent ${card.border}`}>
              <div className='flex text-heading flex-col w-full'>
                <div className='flex items-center w-full justify-between'>
                  <div className={`${card.bg} rounded-lg size-9 flex items-center justify-center`}>
                    {card.icon}
                  </div>
                  {card.change !== undefined && (
                    <span
                      className={`text-base mb-2 font-medium ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      ({card.change >= 0 ? '+' : ''}{card.change}%)
                    </span>
                  )}
                </div>

                <span className='text-2xl mt-2 font-medium font-primary'>{card.value}</span>

                <div className='flex w-full flex-col'>
                  <span className='text-secondary mt-1 font-primary text-sm font-medium capitalize'>{card.label} {type}s</span>
                  {card.note && <span className='text-xs text-res mt-0.5'>{card.note}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => window.history.back()}
            className='flex items-center justify-center size-8 rounded-lg bg-accent border border-secondary/20 hover:border-primary/40 hover:text-primary text-heading transition-all'
            title='Go back'
          >
            <RiArrowLeftSLine className='size-4' />
          </button>
          <h1 className='text-xl font-medium capitalize text-primary'>{type.replace('_', ' ')}</h1>
        </div>
        <div className='flex gap-3 items-center'>
          {/* View Toggle */}
          <div className="flex bg-accent border border-secondary/20 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-res hover:text-heading hover:bg-white/5'}`}
              title="Table View"
            >
              <RiListUnordered className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-primary text-white shadow-sm' : 'text-res hover:text-heading hover:bg-white/5'}`}
              title="Card View"
            >
              <RiLayoutGridFill className="size-4" />
            </button>
          </div>

          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className='border-gray-300 rounded-md text-sm py-1.5 focus:ring-primary focus:border-primary'
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
          </select>
          {canWrite && (
            <label className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity ${importing ? 'bg-gray-400 opacity-70' : 'bg-green-600 hover:bg-green-700'}`}>
              {importing ? 'Importing...' : 'Import'}
              <input type="file" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
          )}
          <span type='button' onClick={(e) => { e.preventDefault(); handleExport(); }} className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium'>
            Export
          </span>
          {canWrite && (
            <Link
              href={route(baseRoutes.create, { type })}
              className='bg-primary text-white px-4 py-2 capitalize rounded-md text-sm font-medium'
            >
              Create New {type.replace('_', ' ')}
            </Link>
          )}
        </div>
      </div>

      <Table
        values={data}
        className='w-full'
        bulk={table?.bulk}
        keywords={table?.keywords}
        type={type}
        searchRoute="module.index"
        onDataUpdate={setRows}
        onCheckChange={setSelectedIds}
        paginationPerPage={table?.paginationPerPage}
        paginationList={table?.paginationList}
        viewMode={viewMode}
      >
        {viewMode === 'table' ? (
          <>
            <Table.THead className='w-full'>
              <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                <Table.TH className='w-1/20 font-medium'>
                  <Table.TH.Checkbox />
                </Table.TH>
                {columns.map((col) => (
                  <Table.TH width={col.width} className='font-medium' key={col.id} sort={col.sort} column={col.column}>{col.label}</Table.TH>
                ))}
              </Table.TR>
            </Table.THead>
            <Table.TBody className='w-full'>
              {Rows && Rows.map((row) => (
                <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={row.id}>
                  <Table.TD>
                    <Table.TD.Checkbox valueId={row.id} />
                  </Table.TD>
                  {columns.map((col) => (
                    <Table.TD style={{ width: col.width }} className='font-medium text-center' key={col.id}>
                      {fieldRender(row, col)}
                    </Table.TD>
                  ))}
                </Table.TR>
              ))}
            </Table.TBody>
          </>
        ) : (
          Rows && Rows.map((row) => {
              const card = table?.card;

              if (card) {
                const getCol = (id) => columns.find(c => c.column === id || c.id === id) || { column: id, id };
                const titleCol = card.title ? getCol(card.title) : null;
                const titleText = titleCol ? (row[titleCol.column] ?? row[titleCol.id]) : '';

                return (
                  <div
                    key={row.id}
                    className="group relative flex flex-col justify-between rounded-2xl bg-accent border border-secondary/15 hover:border-primary/40 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-6px_rgba(115,103,240,0.12)] dark:hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Top ambient highlight on hover */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Subtle soft glow in corner */}
                    <div className="absolute -top-16 -right-16 size-36 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="flex flex-col gap-3.5 relative z-10">
                      {/* ── Top Bar: Checkbox + ID and Status + Action ── */}
                      <div className="flex items-center justify-between pb-3 border-b border-secondary/10">
                        <div className="flex items-center gap-2">
                          <Table.TD.Checkbox
                            valueId={row.id}
                            className="size-4 !mx-0 rounded border-secondary/30 text-primary cursor-pointer transition-colors"
                          />
                          <span className="text-[11px] font-bold tracking-wider text-secondary/70 bg-dynamic/60 px-2 py-0.5 rounded-md">
                            #{row.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {card.top_right && (
                            <div className="flex items-center">
                              {renderCardStatus(row, getCol(card.top_right))}
                            </div>
                          )}
                          {card.actions && (
                            <div className="[&>div]:!h-auto [&>div]:!w-auto [&>div]:!my-0 [&_button]:!h-7 [&_button]:!w-7 text-secondary hover:text-heading transition-colors">
                              {fieldRender(row, getCol(card.actions))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Hero / Identity: Image + Title + Subtitle ── */}
                      <div className="flex gap-3.5 items-start">
                        {card.image && (
                          <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-dynamic/80 to-dynamic/30 border border-secondary/15 flex items-center justify-center p-1 shadow-inner group-hover:border-primary/40 group-hover:shadow-md transition-all duration-300">
                            {renderCardImage(row, getCol(card.image), titleText)}
                          </div>
                        )}

                        <div className="flex flex-col min-w-0 flex-1 pt-0.5">
                          {card.title && (
                            <h3 className="text-[15px] font-bold text-heading group-hover:text-primary transition-colors line-clamp-2 leading-snug tracking-tight">
                              {fieldRender(row, getCol(card.title))}
                            </h3>
                          )}
                          {card.subtitle && (
                            <div className="text-xs text-res mt-1 flex items-center gap-1.5 truncate [&>div]:!mx-0 [&>div]:!px-0 [&>div]:!py-0">
                              <span className="text-secondary/70 font-semibold text-[10px] uppercase tracking-wider">
                                {getCol(card.subtitle).label || card.subtitle}:
                              </span>
                              <span className="font-medium text-heading/80 truncate">
                                {fieldRender(row, getCol(card.subtitle))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Content / Comment / Excerpt ── */}
                      {card.content && (
                        <div className="relative rounded-xl bg-dynamic/35 dark:bg-dynamic/15 p-3 text-xs leading-relaxed text-res border border-secondary/10 group-hover:border-secondary/20 transition-colors line-clamp-3 italic">
                          <span className="text-secondary/60 font-serif mr-1 text-sm">“</span>
                          {fieldRender(row, getCol(card.content))}
                          <span className="text-secondary/60 font-serif ml-1 text-sm">”</span>
                        </div>
                      )}
                    </div>

                    {/* ── Badges / Meta Footer ── */}
                    {card.badges && Array.isArray(card.badges) && card.badges.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-secondary/10 flex flex-wrap gap-2 items-center relative z-10">
                        {card.badges.map(badgeId => (
                          <div key={badgeId} className="flex items-center">
                            {renderCardBadge(row, getCol(badgeId))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Fallback for schemas without "card" config
              return (
                <div
                  key={row.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-accent border border-secondary/15 hover:border-primary/40 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-6px_rgba(115,103,240,0.12)] dark:hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center justify-between pb-3 border-b border-secondary/10">
                    <div className="flex items-center gap-2">
                      <Table.TD.Checkbox valueId={row.id} className="size-4 !mx-0 rounded border-secondary/30 text-primary cursor-pointer" />
                      <span className="text-[11px] font-bold tracking-wider text-secondary/70 bg-dynamic/60 px-2 py-0.5 rounded-md">#{row.id}</span>
                    </div>
                    <div className="[&>div]:!h-auto [&>div]:!w-auto [&>div]:!my-0 [&_button]:!h-7 [&_button]:!w-7 text-secondary hover:text-heading transition-colors">
                      {columns.map(col => col.type === 'action' ? fieldRender(row, col) : null)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-3">
                    {columns.filter(col => col.type !== 'action' && col.column !== 'id').map((col) => (
                      <div key={col.id} className="flex flex-col bg-dynamic/30 rounded-xl p-2.5 border border-secondary/10">
                        <span className="text-[10px] uppercase font-bold text-secondary/70 tracking-wider mb-0.5">{col.label}</span>
                        <div className="text-xs font-semibold text-heading truncate">
                          {fieldRender(row, col)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
        )}
      </Table>

      {/* ── Toast Notifications ── */}
      <div className='fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none'>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium min-w-64 max-w-80 pointer-events-auto
              animate-[slideInRight_0.3s_ease-out]
              ${toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
              }`}
          >
            <span className='shrink-0 size-5 rounded-full bg-white/20 flex items-center justify-center'>
              {toast.type === 'success' ? <RiCheckLine className='size-3' /> : <RiErrorWarningLine className='size-3' />}
            </span>
            <span className='flex-1'>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className='shrink-0 opacity-70 hover:opacity-100'
            >
              <RiCloseLine className='size-4' />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Index
Index.layout = (view) => (
  <AdminLayout title="Module">{view}</AdminLayout>
)

