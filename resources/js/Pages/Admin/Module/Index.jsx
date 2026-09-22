import ActionDropdown from '@/Components/ActionDropdown'
import ImageViwer from '@/Components/Admin/ImageViwer'
import Checkbox from '@/Components/Admin/Checkbox'
import Table from '@/Components/Admin/Table'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link, usePage } from '@inertiajs/react'
import React, { useEffect, useMemo, useState } from 'react'
import { hasPermission, stripTags } from '@/Utils/helper'
import { TbDotsVertical } from 'react-icons/tb'

function Index({ data, table, type }) {

  const { auth } = usePage().props
  const [Rows, setRows] = useState(data?.data || data || [])

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
  console.log(canWrite)
  const baseRoutes = useMemo(() => {
    // Prefer unified module routes everywhere
    return {
      index: 'module.index',
      create: 'module.create',
      edit: 'module.edit',
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
      link = route('post', {"type": 'product', sku: value.sku, "id": value.id })
    }

    if (!value || value === 'null') return 'None'
    return (
      <div className='text-[10px] font-medium text-primary px-3 py-1.25 w-fit mx-auto rounded-full'>
        <Link aria-label={`View ${title}`} target={'_blank'} rel="noopener noreferrer"  href={link}>{title}</Link>
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
        {brand?.image ? <ImageViwer image={brand.image} className='max-w-3/5' /> : (brand?.title ?? 'None')}
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

  return (
    <div className='w-full px-5 py-7 flex flex-col gap-7.5'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-medium capitalize text-primary'>{type}</h1>
        {canWrite && (
          <Link
            href={route(baseRoutes.create, { type })}
            className='bg-primary text-white px-4 py-2 rounded-md text-sm font-medium'
          >
            Create New {type}
          </Link>
        )}
      </div>

      <Table
        values={data}
        className='w-full'
        bulk={table?.bulk}
        keywords={table?.keywords}
        type={type}
        searchRoute="module.index"
        onDataUpdate={setRows}
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

