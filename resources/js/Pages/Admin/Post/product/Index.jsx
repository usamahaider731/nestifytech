import ActionDropdown from '@/Components/ActionDropdown'
import ImageViwer from '@/Components/Admin/ImageViwer'
import SvgViewer from '@/Components/Admin/SvgViewer'
import Checkbox from '@/Components/Checkbox'
import Table from '@/Components/Table'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link } from '@inertiajs/react'
import React, { useState, useEffect } from 'react'
import { RiDeleteBin6Line, RiFile3Fill, RiFileEditLine } from 'react-icons/ri'
import { TbDotsVertical } from 'react-icons/tb'

function Index({ products, table }) {
    const [Product, SetProduct] = useState(products.data || products);
    const Column = table?.columns || [];
    console.log(products);
    useEffect(() => {
        SetProduct(products.data || products);
    }, [products]);

    const FieldRender = (Data, column) => {
        switch (column.type) {
            case 'image':
                return (
                    <div className='w-full flex items-center justify-center'>
                        <div className='size-8 flex bg-white/20 backdrop-blur-lg justify-center items-center rounded-full overflow-hidden'>
                            {Data.image ?
                                <ImageViwer image={Data.image} className='max-w-6 max-h-6 h-6 rounded-full' />
                                :
                                <img src="/assets/image/profile-avatar.webp" className='size-6 rounded-full object-cover' alt="" />
                            }
                        </div>
                    </div>
                );
            case 'category_badges':
            case 'badage':
            case 'badge':
                return (
                    <div className='w-full h-full flex items-center justify-center gap-1.5 flex-wrap'>
                        {(Data?.[column.column] || Data.parent) ? (Data?.[column.column] || Data.parent).map((p) => (
                            <div key={p.id} className='bg-primary px-1.5 py-0.75 w-fit rounded-md text-[10px] font-medium text-white'>
                                {p.title}
                            </div>
                        )) : 'None'}
                    </div>
                );
            case 'brand_image':
                return (
                    <div className='w-full h-full flex items-center justify-center'>
                        {Data.brand ? <ImageViwer image={Data.brand.image} className='max-w-3/5' /> : 'None'}
                    </div>
                );
            case 'status_dot':
                return (
                    <div className='w-full flex items-center justify-center'>
                        <div className={`size-4 rounded-full ${Data.status === 'publish' ? 'bg-green-600' : 'bg-red-500'}`}></div>
                    </div>
                );
            case 'action':
                return (
                    <div className='w-full flex h-12 my-auto items-center gap-3 justify-center'>
                        <ActionDropdown>
                            <ActionDropdown.Trigger>
                                <TbDotsVertical className='cursor-pointer size-4.25' />
                            </ActionDropdown.Trigger>
                            <ActionDropdown.Context className='flex flex-col gap-0.75 shadow-[2px_2px_3px_2px] shadow-secondary'>
                                <ActionDropdown.Link href={route('post.edit', { 'id': Data.id, 'type': 'product' })}>
                                    Edit
                                </ActionDropdown.Link>
                                <ActionDropdown.List className='hover:bg-red-500'>
                                    Delete
                                </ActionDropdown.List>
                            </ActionDropdown.Context>
                        </ActionDropdown>
                    </div>
                );
            default:
                return Data[column.column];
        }
    };

    return (
        <div className='w-full px-5 py-7 flex flex-col gap-7.5'>
            <div className='flex justify-between items-center'>
                <h1 className='text-xl font-medium text-primary'>Products</h1>
                <Link
                    href={route('post.create', { type: 'product' })}
                    className='bg-primary text-white px-4 py-2 rounded-md text-sm font-medium'
                >
                    Add Product
                </Link>
            </div>

            <Table
                values={products}
                className='w-full'
                bulk={table?.bulk}
                keywords={table?.keywords}
                type="product"
                searchRoute="post.index"
                onDataUpdate={SetProduct}
                paginationPerPage={table?.paginationPerPage}
                paginationList={table?.paginationList}
            >
                <Table.THead className='w-full'>
                    <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                        <Table.TH className='w-1/20 font-medium'>
                            <Table.TH.Checkbox />
                        </Table.TH>
                        {Column.map((col) => (
                            <Table.TH width={col.width} className='font-medium' key={col.id}>{col.label}</Table.TH>
                        ))}
                    </Table.TR>
                </Table.THead>
                <Table.TBody className='w-full'>
                    {Product && Product.map((Data) => (
                        <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={Data.id}>
                            <Table.TD>
                                <Table.TD.Checkbox valueId={Data.id} />
                            </Table.TD>
                            {Column.map((col) => (
                                <Table.TD style={{ width: col.width }} className='font-medium text-center' key={col.id}>
                                    {FieldRender(Data, col)}
                                </Table.TD>
                            ))}
                        </Table.TR>
                    ))}
                </Table.TBody>
            </Table>
        </div>
    );
}

export default Index;
Index.layout = (view) => (
    <AdminLayout children={view} />
);