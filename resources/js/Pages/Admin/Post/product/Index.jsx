import ImageViwer from '@/Components/Admin/ImageViwer'
import SvgViewer from '@/Components/Admin/SvgViewer'
import Checkbox from '@/Components/Checkbox'
import Table from '@/Components/Table'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link } from '@inertiajs/react'
import React, { useState } from 'react'
import { RiDeleteBin6Line, RiFile3Fill, RiFileEditLine } from 'react-icons/ri'
function Index({ products }) {
    const [Product, SetProduct] = useState(products.data);
    // console.log(Product)
    return (
        <div className='w-full px-5 py-7 flex flex-col gap-7.5'>
            <Table values={Product} className='w-full'>
                <Table.THead className='w-full'>
                    <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                        <Table.TH className='w-1/20 font-medium'>
                            <Table.TH.Checkbox />
                        </Table.TH>
                        <Table.TH className='w-1/20 font-medium'>Id</Table.TH>
                        <Table.TH className='w-1/20 font-medium'>Sku</Table.TH>
                        <Table.TH className='w-1/20 font-medium'>Image</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Product</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Parent</Table.TH>
                        <Table.TH className='w-1/10 font-medium'>Brand</Table.TH>
                        <Table.TH className='w-1/10 font-medium'>Status</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Action</Table.TH>
                    </Table.TR>
                </Table.THead>
                <Table.TBody className='w-full'>
                    {Product && Product.map((Data) => (
                        <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={Data.id}>
                            <Table.TD className="">
                                <Table.TD.Checkbox valueId={Data.id} />
                            </Table.TD>
                            <Table.TD className='font-normal text-center text-base'>{Data.id}</Table.TD>
                            <Table.TD className='font-normal text-center text-base'>{Data.sku}</Table.TD>
                            <Table.TD className='font-normal text-center text-base'>
                                <div className='w-full flex items-center justify-center'>
                                    <div className='size-8 flex bg-white/20 backdrop-blur-lg  justify-center items-center rounded-full overflow-hidden'>
                                        {Data.image ?
                                            <ImageViwer image={Data.image} className='max-w-6 max-h-6 h-6 rounded-full' />
                                            :
                                            <img src="/assets/image/profile-avatar.webp" className='size-6 rounded-full object-cover' alt="" />
                                        }
                                    </div>
                                </div>
                            </Table.TD>
                            <Table.TD className='font-normal text-center text-base'>{Data.title}</Table.TD>
                            <Table.TD className='font-normal text-center text-base'>
                                <div className='w-full h-full flex items-center justify-center gap-1.5'>
                                    {
                                        Data.parent ?
                                            Data.parent.map((parent) => {
                                                return (
                                                    <div key={parent.id} className='bg-primary px-1.5 py-0.75 w-fit rounded-md text-[10px] font-medium text-white'>
                                                        {parent.title}
                                                    </div>
                                                )
                                            })
                                            : 'None'
                                    }
                                </div>
                            </Table.TD>
                            <Table.TD className=''>
                                <div className='w-full h-full flex items-center justify-center'>
                                    {
                                        Data.brand ?

                                            <ImageViwer image={Data.brand.image} className='max-w-3/5' />
                                                                                       
                                            : 'None'
                                    }
                                </div>
                            </Table.TD>
                            <Table.TD className=''>
                                <div className='w-full flex items-center line-clamp-1 whitespace-nowrap justify-center'>
                                    <div className={`size-6 rounded-full ${Data.status=='publish' ? 'bg-green-600' : 'bg-red-500'}`}></div>
                                </div>
                            </Table.TD>
                            <Table.TD className='flex'>
                                <div className='w-full flex h-12 my-auto  items-center gap-3 justify-center'>
                                    <span className='h-6.5 w-6.5 rounded-full bg-red-500 text-white text-sm flex text-center items-center justify-center'>
                                        <RiDeleteBin6Line className='w-3' />
                                    </span>
                                    {/* <Link href={route('product.edit', { 'id': Data.id })} className='h-6.5 w-6.5 rounded-full bg-primary text-white text-sm flex text-center items-center justify-center'>
                                        <RiFileEditLine className='w-3' />
                                    </Link>
                                    <Link href={route('product.index', { 'id': Data.id })} className='h-6.5 w-6.5 rounded-full bg-secondary text-white text-sm flex text-center items-center justify-center'>
                                        <RiFile3Fill className='w-3' />
                                    </Link> */}
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
Index.layout = (view) => (
    <AdminLayout children={view} />
)