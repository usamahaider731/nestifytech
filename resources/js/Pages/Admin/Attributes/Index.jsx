import React, { useState } from 'react'
import AdminLayout from '@/Layouts/AdminLayout';
import Table from '@/Components/Admin/Table';
import Checkbox from '@/Components/Admin/Checkbox';
import { RiCloseLine, RiDeleteBin2Fill, RiDeleteBin3Fill, RiDropLine, RiTableView } from 'react-icons/ri';
import { TbDots, TbDotsVertical } from 'react-icons/tb';
import Popup from '@/Components/Admin/Popup';
import PrimaryButton from '@/Components/Admin/PrimaryButton';
import axios, { Axios } from 'axios';
import { toast } from 'react-toastify';
import { Link } from '@inertiajs/react';

function Index({ attributes, table }) {
    const [Attributes, SetAttributes] = useState(attributes.data || attributes);
    const [DropdownOpenActions, SetDropdownOpenActions] = useState(null);
    const [Delete, SetDelete] = useState(null);

    function DeleteItemsFunction(attributeId) {
        SetDelete(attributeId);
    }
    const OnDeleteAttribute = async (e) => {
        e.preventDefault();

        if (Delete !== null) {
            try {
                const response = await axios.delete(route('admin.attributes.destroy', Delete));
                if (response.status === 200 || response.status === 204) {
                    SetAttributes(Attributes.filter(val => val.id !== Delete));
                    SetDelete(null);
                    toast.success("Attribute deleted successfully!");
                }
            } catch (error) {
                toast.error("Failed to deleted Attribute");
            }
        }
    };
    return (
        <div className='w-11/12 mx-auto pt-10 gap-4 flex flex-col'>
            <div className='flex items-center'></div>
            <Table
                values={attributes}
                onDataUpdate={SetAttributes}
                searchRoute="admin.attributes.index"
                keywords={table?.keywords}
                paginationPerPage={table?.paginationPerPage}
                paginationList={table?.paginationList}
                bulk={table?.bulk}
                className="w-full"
            >
                <Table.THead className='border-b border-b-secondary bg-secondary'>
                    <Table.TR className='h-12 bg-accent border-b border-b-secondary text-heading w-full text-sm font-medium'>
                        <Table.TH className='w-1/20'>
                            <Table.TH.Checkbox />
                        </Table.TH>
                        <Table.TH className='w-1/20'>ID</Table.TH>
                        <Table.TH className='w-3/20'>Attribute</Table.TH>
                        <Table.TH className='w-1/5'>Type</Table.TH>
                        <Table.TH className='w-7/20'>Options</Table.TH>
                        <Table.TH className='w-1/5'>
                            Actions
                        </Table.TH>
                    </Table.TR>
                </Table.THead>
                <Table.TBody>
                    {Attributes.length > 0 && Attributes.map((attribute) => {
                        const options = attribute?.options ?? [];

                        return (
                            <Table.TR key={attribute.id} className='h-12 bg-permanent border-b border-b-secondary text-heading w-full text-sm font-medium'>
                                <Table.TD>
                                    <Table.TD.Checkbox valueId={attribute.id} />
                                </Table.TD>
                                <Table.TD className='text-center'>
                                    {attribute.id}
                                </Table.TD>
                                <Table.TD className='text-center'>
                                    {attribute.name}
                                </Table.TD>

                                <Table.TD className='text-center'>
                                    {attribute.type}
                                </Table.TD>

                                <Table.TD className="text-center w-1/5 max-w-7/20 scroll-hidden">
                                    <div className="w-full items-center overflow-x-auto h-full flex gap-1.5 justify-center">
                                        {options.length === 0 && "No Options"}

                                        {options.length > 0 && options.length <= 4 &&
                                            options.map((option, key) => (
                                                <span
                                                    key={key}
                                                    className="px-2 py-0.75 text-xs rounded bg-primary text-heading"
                                                >
                                                    {option.value}
                                                </span>
                                            ))}

                                        {options.length > 4 && (
                                            <span className="px-2 py-0.75 text-xs rounded bg-primary text-heading">
                                                {options.length} Attributes
                                            </span>
                                        )}
                                    </div>
                                </Table.TD>
                                <Table.TD>
                                    <div className='flex items-center gap-1.5 justify-center  h-fit relative'>
                                        <div className='relative w-fit h-fit'>
                                            <div onClick={() => {
                                                DropdownOpenActions == attribute.id ? SetDropdownOpenActions(null) :
                                                    SetDropdownOpenActions(attribute.id);
                                            }} className={`relative h-7 rounded-full flex items-center justify-center hover:bg-dynamic w-7  ${DropdownOpenActions === attribute.id && 'bg-dynamic'}`}>
                                                <TbDotsVertical className={`cursor-pointer size-4.25`} />
                                            </div>
                                            {
                                                DropdownOpenActions === attribute.id &&
                                                <div className='absolute top-9 w-36 z-40 right-0 bg-accent rounded-md p-2 font-medium text-sm text-heading shadow-3xl'>
                                                    <div className='h-10 w-full px-3 cursor-pointer flex items-center hover:bg-primary justify-start rounded-md'>
                                                        View
                                                    </div>
                                                    <Link href={route('admin.attributes.edit', { 'id': attribute.id })} className='h-10 w-full px-3 cursor-pointer flex items-center hover:bg-dynamic justify-start rounded-md'>
                                                        Edit
                                                    </Link>
                                                    <div onClick={() => DeleteItemsFunction(attribute.id)} className='h-10 w-full px-3 cursor-pointer flex items-center hover:bg-red-500 justify-start rounded-md'>
                                                        Delete
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </Table.TD>

                            </Table.TR>
                        )
                    })}

                </Table.TBody>
            </Table>
            {Delete !== null &&
                <Popup>
                    <Popup.PopupBox>
                        <Popup.PopupHeader>
                            <h3 className='text-base font-medium text-primary'>Delete Attribute</h3>
                            <RiCloseLine className='size-5.5 cursor-pointer text-dynamic hover:text-heading' />
                        </Popup.PopupHeader>
                        <Popup.PopupSection>
                            <form onSubmit={(e) => OnDeleteAttribute(e)} autoComplete='false' className='w-full pb-6 flex flex-col items-center'>
                                <img src="/assets/image/extra_gallery.png" className='w-full' alt="" />
                                <h4 className='text-lg font-semibold text-accent font-oswald'>Delete Attribute</h4>
                                <p className='text-sm font-normal font-roboto'>Are You realy want to sure delete this attribute</p>
                                <PrimaryButton className='max-w-32 !bg-primary cursor-pointer font-medium text-sm !text-heading mt-3 hover:bg-primary'>
                                    Delete
                                </PrimaryButton>
                            </form>
                        </Popup.PopupSection>
                    </Popup.PopupBox>
                </Popup>
            }

        </div>
    )
}

export default Index
Index.layout = (view) => (
    <AdminLayout title="Attributes">
        {view}
    </AdminLayout>
)