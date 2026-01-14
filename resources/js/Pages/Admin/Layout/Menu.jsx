import ActionDropdown from '@/Components/ActionDropdown'
import PartButton from '@/Components/Admin/PartButton'
import Checkbox from '@/Components/Checkbox'
import Dropdown from '@/Components/Dropdown'
import PrimaryButton from '@/Components/PrimaryButton'
import Table from '@/Components/Table'
import Textarea from '@/Components/Textarea'
import TextInput from '@/Components/TextInput'
import AdminLayout from '@/Layouts/AdminLayout'
import { input } from '@/Utils/classes'
import axios from 'axios'
import React, { useState } from 'react'
import { RiExpandUpDownLine } from 'react-icons/ri'
import { TbDotsVertical } from 'react-icons/tb'
import { toast } from 'react-toastify'

function Menu({ menu, menu_options }) {
  const [Menu, SetMenu] = useState(menu);
  const [Name, SetName] = useState('');
  const [Parent, SetParent] = useState(0);
  const [Link, SetLink] = useState('');
  const [Options, SetOptions] = useState(menu_options);
  const [FormId, SetFormId] = useState(null);
  const resetForm = () => {
    SetName('');
    SetParent(0);
    SetLink('');
    SetFormId(null);
  };
  const onSubmithandle = async (e) => {
    e.preventDefault();
    let r = toast.loading("Menu is submitting...");
    let Routes = route('menu.submit');
    if (FormId !== null) {
      Routes = route('menu.update', { id: FormId });
    }
    const formData = new FormData();
    formData.append('name', Name);
    formData.append('parent', Parent);
    formData.append('link', Link);
    try {
      const response = await axios.post(Routes, formData, {
        Menus: { 'Content-Type': 'multipart/form-data' }
      });
      toast.dismiss(r);
      toast.success(`Menu successfully ${FormId !== null ? 'updated' : 'created'}`);
      UpdateTable(response.data);
      resetForm();
    } catch (error) {
      toast.dismiss(r);
      toast.error(`Failed to ${FormId !== null ? 'update' : 'create'} Menu`);
    }
  };
  const UpdateTable = (data) => {
    SetMenu(prev => {
      const updatedData = [...prev];
      const index = updatedData.findIndex(menu => menu.id === data.id);
      if (index !== -1) {
        updatedData[index] = data; // Update
      } else {
        updatedData.push(data); // Add
      }
      return updatedData; // return array, not object
    });
  };

  const RemoveRow = (id) => {
    SetMenu(prev => prev.filter(menu => menu.id !== id));
  };
  const EditLine = (MenuData) => {
    SetParent(MenuData.parent ?? 0)
    SetName(MenuData.name)
    SetLink(MenuData.link)
    SetFormId(MenuData.id)
  }
  return (
    <div className='flex items-start py-5 px-6 mx-auto'>
      <div className='w-7/10 pr-2.5'>
        <Table values={Menu}>
          <Table.THead>
            <Table.TR>
              <Table.TH className='w-1/10'>
                <Table.TH.Checkbox />
              </Table.TH>
              <Table.TH className='w-1/4'>Menu</Table.TH>
              <Table.TH className='w-1/4'>Link</Table.TH>
              <Table.TH className='w-1/5'>parent</Table.TH>
              <Table.TH className='w-1/5'>Action</Table.TH>
            </Table.TR>
          </Table.THead>
          <Table.TBody>
            {Array.isArray(Menu) && Menu.map((menuList) => {
              console.log(menuList.name);
              return (
                <Table.TR key={menuList.id}>
                  <Table.TD>
                    <Table.TD.Checkbox valueId={menuList.id} />
                  </Table.TD>
                  <Table.TD className='w-1/4 text-center'>{menuList.name}</Table.TD>
                  <Table.TD className='w-1/4 text-center lowercase'>{menuList.link}</Table.TD>
                  <Table.TD className='w-1/5 text-center'>{menuList.parent ? menuList.parent.name : 'No Parent'}</Table.TD>
                  <Table.TD className='w-1/5 text-center'>
                    <div className='mx-auto flex w-fit'>
                      <ActionDropdown>
                        <ActionDropdown.Trigger>
                          <TbDotsVertical className={`cursor-pointer size-4.25`} />
                        </ActionDropdown.Trigger>
                        <ActionDropdown.Context className={`flex flex-col gap-0.75 shadow-[2px_2px_3px_2px] shadow-secondary`}>
                          <ActionDropdown.List onClick={() => EditLine(menuList)}>
                            Edit
                          </ActionDropdown.List>
                          <ActionDropdown.List className={` hover:bg-red-500`}>
                            Delete
                          </ActionDropdown.List>
                        </ActionDropdown.Context>
                      </ActionDropdown>
                    </div>
                  </Table.TD>
                </Table.TR>
              )
            })}
          </Table.TBody>
        </Table>
      </div>
      {/* Form */}
      <div className='w-3/10 pl-2.5'>
        <form onSubmit={(e) => onSubmithandle(e)} className='w-full bg-accent rounded-md shadow-md p-5 flex flex-col gap-2'>
          <h4 className='text-heading font-medium font-oswald text-lg'>
            {FormId ? 'Update Menu' : 'Create Menu'}
          </h4>
          <p className='text-heading font-medium font-oswald text-sm'>
            {FormId ? 'Update the selected Menu' : 'Do you want to create a new Menu?'}
          </p>

          <div className='flex flex-col gap-2 mt-4'>
            <TextInput
              className='text-sm'
              value={Name}
              onChange={(val) => SetName(val.target.value)}
              placeholder='Enter Menu Name'
            />
            <Dropdown>
              <Dropdown.Trigger>
                <span className="inline-flex rounded-md w-full">
                  <button
                    type="button"
                    className={`${input} w-full flex items-center justify-between h-10 px-3 text-res text-sm`}
                  >
                    {Parent?.name || 'Select Parent'}
                    <RiExpandUpDownLine />
                  </button>
                </span>
              </Dropdown.Trigger>
              <Dropdown.Content>
                {
                  Array.isArray(Options) && Options.map((option) => {
                    return (
                      <Dropdown.List onClick={() => SetParent(option)}>
                        {option.name}
                      </Dropdown.List>
                    )
                  })
                }
              </Dropdown.Content>
            </Dropdown>
            {/* Status Dropdown */}
            <TextInput
              className='text-sm'
              value={Link}
              onChange={(val) => SetLink(val.target.value)}
              placeholder='Enter Menu Link'
            />
            <div className='grid mt-5 grid-cols-2 w-full gap-5'>
              <PrimaryButton
                type="button"
                onClick={resetForm}
                className='col-span-1 h-10 !bg-transparent border-2 !border-primary flex items-center justify-center !text-primary'
              >
                Reset
              </PrimaryButton>
              <PrimaryButton
                type="submit"
                className='col-span-1 h-10 !bg-primary flex justify-center text-white'
              >
                Submit
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default Menu;
Menu.layout = (view) => <AdminLayout>{view}</AdminLayout>;