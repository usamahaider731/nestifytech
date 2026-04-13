import ImageViwer from '@/Components/Admin/ImageViwer'
import SvgViewer from '@/Components/Admin/SvgViewer'
import Checkbox from '@/Components/Checkbox'
import Table from '@/Components/Table'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link } from '@inertiajs/react'
import React, { useState, useEffect } from 'react'
import { stripTags, hasPermission } from '@/Utils/helper'
import { RiDeleteBin6Line, RiFile3Fill, RiFileEditLine } from 'react-icons/ri'
import { usePage } from '@inertiajs/react'

function Index({ data, table, type }) {
    const { auth } = usePage().props;
    const [Taxonomies, SetTaxonomies] = useState(data.data);
    const Column = table?.columns || [];

    useEffect(() => {
        SetTaxonomies(data.data);
    }, [data, type]);

    const ImageRender = (Data, column) => {
        return (
            <div className='w-full flex items-center justify-center'>
                <div className='size-9.5 flex justify-center items-center rounded bg-dynamic'>
                    {Data[column.column] ?
                        <ImageViwer image={Data[column.column]} className='max-w-4/5 object-cover aspect-square' />
                        :
                        <img src="/assets/image/profile-avatar.webp" className='size-7.5 rounded-full object-cover' alt="" />
                    }
                </div>
            </div>
        )
    }

    const FieldRender = (Data, column) => {
        if (column.type == 'image') {
            return ImageRender(Data, column)
        }
        if (column.type == 'description') {
            return stripTags(Data[column.column])
        }
        if (column.type == 'category') {
            return Data.parent ? Data.parent.title : 'None'
        }
        if (column.type == 'discount') {
            return (
                <>
                    {
                        Data.discount && Data.discount != 'null' ? <div className='bg-green-600 text-[10px] font-medium text-white px-3 py-1.25 w-fit mx-auto rounded-full'>{Data.discount}% Discount</div> : 'None'
                    }
                </>
            )
        }
        if (column.type == 'action') {
            return (
                <div className='w-full flex h-12 my-auto  items-center gap-3 justify-center'>
                    {hasPermission(auth.user, `${type}-write`) && (
                        <>
                            <span className='h-6.5 w-6.5 rounded-full bg-red-500 text-white text-sm flex text-center items-center justify-center cursor-pointer'>
                                <RiDeleteBin6Line className='w-3' />
                            </span>
                            <Link href={route('taxonomy.edit', { type: type, id: Data.id })} className='h-6.5 w-6.5 rounded-full bg-primary text-white text-sm flex text-center items-center justify-center'>
                                <RiFileEditLine className='w-3' />
                            </Link>
                        </>
                    )}
                    <Link href={route('taxonomy.index', { type: type, id: Data.id })} className='h-6.5 w-6.5 rounded-full bg-secondary text-white text-sm flex text-center items-center justify-center'>
                        <RiFile3Fill className='w-3' />
                    </Link>
                </div>
            )
        }
        else {
            return (
                Data[column.column]
            )
        }
    }

    return (
        <div className='w-full px-5 py-7 flex flex-col gap-7.5'>
            <div className='flex justify-between items-center'>
                <h1 className='text-xl font-medium capitalize text-primary'>{type}s</h1>
                {hasPermission(auth.user, `${type}-write`) && (
                    <Link
                        href={route('taxonomy.create', { type: type, ...(new URLSearchParams(window.location.search).get('id') ? { parent_id: new URLSearchParams(window.location.search).get('id') } : {}) })}
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
                searchRoute="taxonomy.index"
                onDataUpdate={SetTaxonomies}
                paginationPerPage={table?.paginationPerPage}
                paginationList={table?.paginationList}
            >
                <Table.THead className='w-full'>
                    <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                        <Table.TH className='w-1/20 font-medium'>
                            <Table.TH.Checkbox />
                        </Table.TH>
                        {Column.map((col) => (
                            <Table.TH width={col.width} className=' font-medium' key={col.id}>{col.label}</Table.TH>
                        ))}
                    </Table.TR>
                </Table.THead>
                <Table.TBody className='w-full'>
                    {Taxonomies && Taxonomies.map((Data) => (
                        <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={Data.id}>
                            <Table.TD className="">
                                <Table.TD.Checkbox valueId={Data.id} />
                            </Table.TD>
                            {Column.map((column) => (
                                <Table.TD style={{ width: column.width }} className=' font-medium text-center' key={column.id}>
                                    {FieldRender(Data, column)}
                                </Table.TD>
                            ))}
                        </Table.TR>
                    ))}
                </Table.TBody>
            </Table>
        </div>
    )
}

Index.layout = (view) => {
    return (
        <AdminLayout>{view}</AdminLayout>
    )
}

export default Index
