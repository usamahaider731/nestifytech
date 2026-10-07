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
import { RiBarChartBoxLine, RiCheckboxCircleLine, RiDraftLine, RiStackLine } from 'react-icons/ri'

function Index({ data, table, type, stats }) {

  const { auth } = usePage().props
  const [Rows, setRows] = useState(data?.data || data || [])
  const [exportFormat, setExportFormat] = useState('csv')
  const [importing, setImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showAdvancedModal, setShowAdvancedModal] = useState(false)
  const [activeTab, setActiveTab] = useState('export') // export or import
  const [importFile, setImportFile] = useState(null)
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

  const canWrite = hasPermission(auth?.user, `${type}-write`)
  const canDelete = hasPermission(auth?.user, `${type}-delete`)
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

  const renderAction = (row) => {
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
      case 'action':
        return renderAction(row)
      case 'link':
        return renderLink(row, column)
      default:
        return row?.[column.column]
    }
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
  const isPostModule  = stats && 'published' in stats
  const statCards     = stats ? [
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

  console.log(stats)
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
        <h1 className='text-xl font-medium capitalize text-primary'>{type}</h1>
        <div className='flex gap-3 items-center'>
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
              className='bg-primary text-white px-4 py-2 rounded-md text-sm font-medium'
            >
              Create New {type}
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
      >
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
      </Table>
    </div>
  )
}

export default Index
Index.layout = (view) => (
  <AdminLayout title="Module">{view}</AdminLayout>
)

