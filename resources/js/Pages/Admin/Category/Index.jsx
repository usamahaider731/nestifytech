import ImageViwer from '@/Components/Admin/ImageViwer'
import SvgViewer from '@/Components/Admin/SvgViewer'
import Checkbox from '@/Components/Checkbox'
import Table from '@/Components/Table'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link } from '@inertiajs/react'
import React, { useState } from 'react'
import { stripTags } from '@/Utils/helper'
import { RiDeleteBin6Line, RiFile3Fill, RiFileEditLine } from 'react-icons/ri'

function Index({ data }) {
    const [Category, SetCategory] = useState(data.data);
    return (
        <div className='w-full px-5 py-7 flex flex-col gap-7.5'>
            <Table values={Category} className='w-full'>
                <Table.THead className='w-full'>
                    <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                        <Table.TH className='w-1/20 font-medium'>
                            <Table.TH.Checkbox />
                        </Table.TH>
                        <Table.TH className='w-1/20 font-medium'>Id</Table.TH>
                        <Table.TH className='w-1/20 font-medium'>Image</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Category</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Parent</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Discount</Table.TH>
                        <Table.TH className='w-1/5 font-medium'>Description</Table.TH>
                        <Table.TH className='w-1/5 font-medium'>Action</Table.TH>
                    </Table.TR>
                </Table.THead>
                <Table.TBody className='w-full'>
                    {Category && Category.map((Data) => (
                        <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={Data.id}>
                            <Table.TD className="">
                                <Table.TD.Checkbox valueId={Data.id} />
                            </Table.TD>
                            <Table.TD className='font-normal text-center text-base'>{Data.id}</Table.TD>
                            <Table.TD className='font-normal text-center text-base'>
                                <div className='w-full flex items-center justify-center'>
                                    <div className='size-9.5 flex justify-center items-center rounded bg-dynamic'>
                                        {Data.image ?
                                    <ImageViwer image={Data.image} className='max-w-3/5' />
                                    :
                                    <img src="/assets/image/profile-avatar.webp" className='size-7.5 rounded-full object-cover' alt="" />
                                }
                                    </div>
                                </div>
                            </Table.TD>
                            <Table.TD className='font-normal text-center text-base'>{Data.title}</Table.TD>
                            <Table.TD className='font-normal text-center text-base'>
                                {
                                    Data.parent ? Data.parent.title : 'None'
                                }
                            </Table.TD>
                            <Table.TD className='font-normal text-center text-base'>
                                {
                                    Data.discount ? <div className='bg-green-600 text-[10px] font-medium text-white px-3 py-1.25 w-fit mx-auto rounded-full'>{Data.discount}% Discount</div> : 'None'
                                }
                            </Table.TD>
                            <Table.TD className=''>
                                <div className='w-full flex items-center line-clamp-1 whitespace-nowrap justify-center'>
                                    {stripTags(Data.description)}
                                </div>
                            </Table.TD>
                            <Table.TD className='flex'>
                                <div className='w-full flex h-12 my-auto  items-center gap-3 justify-center'>
                                    <span className='h-6.5 w-6.5 rounded-full bg-red-500 text-white text-sm flex text-center items-center justify-center'>
                                        <RiDeleteBin6Line className='w-3' />
                                    </span>
                                    <Link href={route('category.edit', { 'id': Data.id })} className='h-6.5 w-6.5 rounded-full bg-primary text-white text-sm flex text-center items-center justify-center'>
                                        <RiFileEditLine className='w-3' />
                                    </Link>
                                    <Link href={route('category.index', { 'id': Data.id })} className='h-6.5 w-6.5 rounded-full bg-secondary text-white text-sm flex text-center items-center justify-center'>
                                        <RiFile3Fill className='w-3' />
                                    </Link>
                                </div>
                            </Table.TD>
                        </Table.TR>
                    ))}
                </Table.TBody>
            </Table>
        </div>
    )
}

export default Index
Index.layout = (view) => {
    return (
        <AdminLayout>{view}</AdminLayout>
    )
}