import Checkbox from '@/Components/Checkbox';
import AdminLayout from '@/Layouts/AdminLayout'
import { Link } from '@inertiajs/react'
import React from 'react'
import { RiDeleteBin6Line, RiFileEditLine, RiFile3Fill, RiLayoutGridFill, RiListUnordered } from 'react-icons/ri';
import Table from '@/Components/Table'
import { usePage } from '@inertiajs/react';
import { hasPermission } from '@/Utils/helper';

function Index({ roles, table }) {
    const { auth } = usePage().props;
    const [Roles, SetRoles] = React.useState(roles.data || roles);
    const [Layout, SetLayout] = React.useState('grid');

    React.useEffect(() => {
        SetRoles(roles.data || roles);
    }, [roles]);

    const Column = table?.columns || [];

    const FieldRender = (Data, column) => {
        if (column.type == 'status_dot') {
            return (
                <div className='w-full flex items-center justify-center'>
                    {Data[column.column] === 'publish' ?
                        <div className='bg-green-500 size-4.5 rounded-full animate-pulse'></div>
                        :
                        <div className='bg-red-500 size-4.5 rounded-full animate-pulse'></div>
                    }
                </div>
            )
        }
        if (column.type == 'action') {
            return (
                <div className='w-full flex h-12 my-auto items-center gap-3 justify-center'>
                    {hasPermission(auth.user, 'role-write') && (
                        <>
                            <span className='h-6.5 w-6.5 rounded-full bg-red-500 text-white text-sm flex text-center items-center justify-center cursor-pointer'>
                                <RiDeleteBin6Line className='w-3' />
                            </span>
                            <Link href={route('edit.role', { id: Data.id })} className='h-6.5 w-6.5 rounded-full bg-primary text-white text-sm flex text-center items-center justify-center'>
                                <RiFileEditLine className='w-3' />
                            </Link>
                        </>
                    )}
                    <Link href={route('role.detail', { id: Data.id })} className='h-6.5 w-6.5 rounded-full bg-secondary text-white text-sm flex text-center items-center justify-center'>
                        <RiFile3Fill className='w-3' />
                    </Link>
                </div>
            )
        }
        return Data[column.column];
    }

    return (
        <div className='w-full px-5 py-7 flex flex-col gap-7.5'>
            <div className='flex justify-between items-center'>
                <h1 className='text-xl font-medium capitalize text-primary'>User Roles</h1>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center bg-accent p-1 rounded-lg border border-primary/10'>
                        <button 
                            onClick={() => SetLayout('grid')} 
                            className={`p-2 rounded-md transition-all ${Layout === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-primary hover:bg-primary/5'}`}
                            title="Grid View"
                        >
                            <RiLayoutGridFill className='size-5' />
                        </button>
                        <button 
                            onClick={() => SetLayout('table')} 
                            className={`p-2 rounded-md transition-all ${Layout === 'table' ? 'bg-primary text-white shadow-lg' : 'text-primary hover:bg-primary/5'}`}
                            title="Table View"
                        >
                            <RiListUnordered className='size-5' />
                        </button>
                    </div>
                    {hasPermission(auth.user, 'role-write') && (
                        <Link
                            href={route('role.create')}
                            className='bg-primary text-white px-4 py-2 rounded-md text-sm font-medium'
                        >
                            Create New Role
                        </Link>
                    )}
                </div>
            </div>

            {Layout === 'grid' ? (
                <div className='grid grid-cols-4 gap-5'>
                    {Roles && Roles.map((role) => (
                        <div key={role.id} className='p-6 flex flex-col col-span-1 justify-between gap-5 items-start shadow bg-accent rounded-2xl'>
                            <div className='flex text-heading items-start justify-between w-full'>
                                <h4 className='text-heading font-primary capitalize text-base font-medium'>{role.title}</h4>
                                {hasPermission(auth.user, 'role-write') && (
                                    <Link href={route('edit.role', { id: role.id })} className='size-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center'>
                                        <RiFileEditLine className='size-5' />
                                    </Link>
                                )}
                            </div>
                            <div className='flex w-full justify-between items-center'>
                                <div className='flex items-center gap-2'>
                                    {role.status === 'publish' ?
                                        <div className='bg-green-500 size-2.5 rounded-full'></div>
                                        :
                                        <div className='bg-red-500 size-2.5 rounded-full'></div>
                                    }
                                    <span className='text-secondary font-primary text-sm font-medium capitalize'>{role.status}</span>
                                </div>
                                <div className='flex items-center'>
                                    <Link href={route('role.detail', { id: role.id })} className='h-fit w-fit flex items-center px-3 py-1.5
                                         bg-secondary text-[10px] rounded font-medium font-primary uppercase text-white hover:bg-secondary/90 transition-colors'>
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Table
                    values={roles}
                    className='w-full'
                    keywords={table?.keywords}
                    type="role"
                    searchRoute="role"
                    onDataUpdate={SetRoles}
                    paginationPerPage={table?.paginationPerPage}
                    paginationList={table?.paginationList}
                >
                    <Table.THead className='w-full'>
                        <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
                            
                            {Column.map((col) => (
                                <Table.TH width={col.width} className=' font-medium' key={col.id}>{col.label}</Table.TH>
                            ))}
                        </Table.TR>
                    </Table.THead>
                    <Table.TBody className='w-full'>
                        {Roles && Roles.map((Data) => (
                            <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={Data.id}>
                                {Column.map((column) => (
                                    <Table.TD style={{ width: column.width }} className=' font-medium text-center' key={column.id}>
                                        {FieldRender(Data, column)}
                                    </Table.TD>
                                ))}
                            </Table.TR>
                        ))}
                    </Table.TBody>
                </Table>
            )}
        </div>
    )
}

export default Index
Index.layout = (view) => (
    <AdminLayout>{view}</AdminLayout>
)