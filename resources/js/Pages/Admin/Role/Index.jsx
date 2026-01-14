import Checkbox from '@/Components/Checkbox';
import AdminLayout from '@/Layouts/AdminLayout'
import { Link } from '@inertiajs/react'
import React from 'react'
import { FaEdit, FaPage4 } from 'react-icons/fa';
import { LiaEdit, LiaPagelines } from 'react-icons/lia';
import { RiDeleteBin2Line, RiDeleteBinLine, RiEdit2Line, RiEditBoxLine, RiEditCircleLine, RiFileEditLine, RiFileLine, RiOpenSourceLine, RiPagesLine } from 'react-icons/ri';

function Index({ roles }) {
    return (
        <div className='w-11/12 mx-auto p-5 flex flex-col gap-5'>
            {/* 
            <Link className='rounded-md h-10 flex items-center bg-primary px-6 w-fit text-heading text-[15px] cursor-pointer font-medium'>Add Role</Link>
            <table className='w-full'>
                <thead className='w-full'>
                    <tr className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                        <th className='w-1/20 font-medium'></th>
                        <th className='w-1/20 font-medium'>Id</th>
                        <th className='w-1/4 font-medium'>Role</th>
                        <th className='w-1/4 font-medium'>Status</th>
                        <th className='w-15/100 font-medium'>View Details</th>
                        <th className='w-1/4 font-medium'>Action</th>
                    </tr>
                </thead>
                {
                    roles.length > 0 &&
                    <tbody className='w-full'>
                        {
                            roles.map((role) => {
                                return (
                                    <tr key={role.id} className='w-full text-heading border-y border-heading uppercase text-sm h-12 bg-accent'>
                                        <td className='text-center w-1/20'>
                                            <div className='w-full flex items-center justify-center'>
                                                <Checkbox value={role.id} />
                                            </div>
                                        </td>
                                        <td className='text-center w-1/20'>{role.id}</td>
                                        <td className='text-center w-1/4'>{role.title}</td>
                                        <td className='text-center w-1/4'>{role.status}</td>
                                        <td className='text-center w-15/100'><Link href={route('role.detail',{'id': role.id})} className='rounded cursor-pointer h-10 px-2 py-1.5 bg-primary text-[10px] uppercase font-medium font-primary'>View Details</Link></td>
                                        <td className='text-center w-1/4'>
                                            <div className='w-full h-full flex items-center justify-center gap-5'>
                                                <Link href={route('edit.role',{'id':role.id})} className='cursor-pointer flex justify-center items-center'>
                                                    <LiaEdit className='size-4.5' />
                                                </Link>
                                                <span className='cursor-pointer flex justify-center items-center'>
                                                    <RiDeleteBinLine className='size-4.5' />
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })

                        }

                    </tbody>

                }

            </table>
            {roles.length <= 0 &&
                <div className='bg-accent w-full px-5 h-15 flex items-center text-heading font-medium font-primary'>You have no Role Please add roles</div>
            } */}
            <div className='grid grid-cols-3 gap-5'>
                {
                    roles.map((role) => (
                        <div key={role.id} className='p-6 flex flex-col col-span-1 justify-between gap-5 items-start shadow bg-accent rounded-lg'>
                            <div className='flex text-heading items-start justify-between w-full'>
                                <h4 className='text-heading font-primary capitalize text-base font-medium'>{role.title}</h4>
                                <Link href={route('edit.role',{'id': role.id})} className={`size-9 text-white flex items-center justify-center`}>
                                    <RiFileLine />
                                </Link>
                            </div>
                            <div className='flex w-full justify-between items-center'>
                                <span className='text-secondary mt-1 font-primary text-sm font-medium'>{role.status}</span>
                                <div className='flex items-center'>
                                    <Link href={route('role.detail',{'id': role.id})} className='h-fit w-fit flex items-center px-2.25 py-1.25
                                     bg-primary text-[10px] rounded font-extralight font-primary uppercase text-white'>
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}
export default Index
Index.layout = (view) => (
    <AdminLayout>{view}</AdminLayout>
)