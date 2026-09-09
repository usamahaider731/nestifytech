import ImageViwer from '@/Components/Admin/ImageViwer'
import SvgViewer from '@/Components/Admin/SvgViewer'
import Checkbox from '@/Components/Admin/Checkbox'
import Table from '@/Components/Admin/Table'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link } from '@inertiajs/react'
import React, { useState } from 'react'
import { stripTags } from '@/Utils/helper'
import { RiDeleteBin6Line, RiFile3Fill, RiFileEditLine } from 'react-icons/ri'
function Index({ languages }) {
    const [Language, SetLanguage] = useState(languages);
    console.log(Language);
    return (
        <div className='w-full px-5 py-7 flex flex-col gap-7.5'>
            <Table values={Language} className='w-full'>
                <Table.THead className='w-full'>
                    <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                        <Table.TH className='w-1/20 font-medium'>
                            <Table.TH.Checkbox />
                        </Table.TH>
                        <Table.TH className='w-1/20 font-medium'>prefix</Table.TH>
                        <Table.TH className='w-1/20 font-medium'>Image</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Name</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Direction</Table.TH>
                        <Table.TH className='w-15/100 font-medium'>Active</Table.TH>
                        <Table.TH className='w-1/5 font-medium'>Default</Table.TH>
                        <Table.TH className='w-1/5 font-medium'>Action</Table.TH>
                    </Table.TR>
                </Table.THead>
                <Table.TBody className='w-full'>
                    {Language && Language.map((Data) => (
                        <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={Data.prefix}>
                            <Table.TD className="">
                                <Table.TD.Checkbox valueId={Data.prefix} />
                            </Table.TD>
                            <Table.TD className='font-normal text-center text-base'>{Data.prefix}</Table.TD>
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
                            <Table.TD className='font-normal text-center text-base'>{Data.name}</Table.TD>
                            <Table.TD className='font-normal text-center text-base'>
                                {
                                    Data.direction ? Data.direction == 'ltr' ? 'Left to Right' : 'Right to Left' : 'Left to Right'
                                }
                            </Table.TD>
                            <Table.TD className='font-normal text-center text-base'>
                                {
                                    <div className={`${Data.active ? 'bg-green-600' : 'bg-red-600'} size-4.25 animate-pulse font-medium text-white mx-auto rounded-full`}></div>
                                }
                            </Table.TD>
                            <Table.TD className='text-center'>
                                {
                                    Data.is_default == "true" ? <div className='bg-blue-600 text-[10px] font-medium text-white px-3 py-1.25 w-fit mx-auto rounded-full'>Default</div> : 'None'
                                }
                            </Table.TD>
                            <Table.TD className='flex'>
                                <div className='w-full flex h-12 my-auto  items-center gap-3 justify-center'>
                                    <span className='h-6.5 w-6.5 rounded-full bg-red-500 text-white text-sm flex text-center items-center justify-center'>
                                        <RiDeleteBin6Line className='w-3' />
                                    </span>
                                    <Link href={route('admin.lang.edit', Data.prefix)} className='h-6.5 w-6.5 rounded-full bg-primary text-white text-sm flex text-center items-center justify-center'>
                                        <RiFileEditLine className='w-3' />
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
        <AdminLayout title="Language">{view}</AdminLayout>
    )
}