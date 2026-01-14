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

function Index({ tags }) {
  const [Tag, SetTag] = useState(tags.data);
  const [StatusVal, SetStatusVal] = useState('Publish');
  const [Title, SetTitle] = useState('');
  const [description, SetDescription] = useState('');
  const [FormId, SetFormId] = useState(null);

  const resetForm = () => {
    SetTitle('');
    SetDescription('');
    SetStatusVal('Publish');
    SetFormId(null);
  };

  const onSubmithandle = async (e) => {
    e.preventDefault();
    let r = toast.loading("Form is submitting...");
    let Routes = route('tags.submit');

    if (FormId !== null) {
      Routes = route('tags.update', { id: FormId });
    }

    const formData = new FormData();
    formData.append('title', Title);
    formData.append('description', description);
    formData.append('status', StatusVal);

    try {
      const response = await axios.post(Routes, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.dismiss(r);
      toast.success(`Tag successfully ${FormId !== null ? 'updated' : 'created'}`);
      UpdateTable(response.data);
      resetForm();
    } catch (error) {
      toast.dismiss(r);
      toast.error(`Failed to ${FormId !== null ? 'update' : 'create'} tag`);
    }
  };

  const UpdateTable = (data) => {
    SetTag(prev => {
      const updatedData = [...prev];
      const index = updatedData.findIndex(tag => tag.id === data.id);

      if (index !== -1) {
        updatedData[index] = data; // Update
      } else {
        updatedData.push(data); // Add
      }

      return { ...prev, data: updatedData };
    });
  };
  const EditLine = (TagData) => {
    SetDescription(TagData.description)
    SetTitle(TagData.title)
    SetStatusVal(TagData.status)
    SetFormId(TagData.id)
  }
  return (
    <div className='flex items-start py-5 px-6 mx-auto'>
      {/* Table */}
      <div className='w-7/10 pr-2.5'>
        <Table values={Tag}>
          <Table.THead>
            <Table.TR>
              <Table.TH className='w-1/10'>
                <Table.TH.Checkbox />
              </Table.TH>
              <Table.TH className='w-1/4'>Tag</Table.TH>
              <Table.TH className='w-1/4'>Description</Table.TH>
              <Table.TH className='w-1/5'>Status</Table.TH>
              <Table.TH className='w-1/5'>Action</Table.TH>
            </Table.TR>
          </Table.THead>
          <Table.TBody>
            {Array.isArray(Tag) && Tag.map((taglo) => {
              return (
                <Table.TR key={taglo.id}>
                  <Table.TD>
                    <Table.TD.Checkbox valueId={taglo.id} />
                  </Table.TD>
                  <Table.TD className='w-1/4 text-center'>{taglo.title}</Table.TD>
                  <Table.TD className='w-1/4 text-center'>{taglo.description}</Table.TD>
                  <Table.TD className='w-1/5 text-center'>{taglo.status}</Table.TD>
                  <Table.TD className='w-1/5 text-center'>
                    <ActionDropdown>
                      <ActionDropdown.Trigger>
                        <TbDotsVertical className={`cursor-pointer size-4.25`} />
                      </ActionDropdown.Trigger>
                      <ActionDropdown.Context className={`flex flex-col gap-0.75 shadow-[2px_2px_3px_2px] shadow-secondary`}>
                        <ActionDropdown.List onClick={() => EditLine(taglo)}>
                          Edit
                        </ActionDropdown.List>
                        <ActionDropdown.List className={` hover:bg-red-500`}>
                          Delete
                        </ActionDropdown.List>
                      </ActionDropdown.Context>
                    </ActionDropdown>
                  </Table.TD>
                </Table.TR>
              )
            })}

          </Table.TBody>
        </Table>
      </div>

      {/* Form */}
      <div className='w-3/10 pl-2.5'>
        <form onSubmit={onSubmithandle} className='w-full bg-accent rounded-md shadow-md p-5 flex flex-col gap-2'>
          <h4 className='text-heading font-medium font-oswald text-lg'>
            {FormId ? 'Update Tag' : 'Create Tag'}
          </h4>
          <p className='text-heading font-medium font-oswald text-sm'>
            {FormId ? 'Update the selected tag' : 'Do you want to create a new tag?'}
          </p>

          <div className='flex flex-col gap-2 mt-4'>
            <TextInput
              className='text-sm'
              value={Title}
              onChange={(val) => SetTitle(val.target.value)}
              placeholder='Enter Tag Title'
            />

            {/* Status Dropdown */}
            <Dropdown>
              <Dropdown.Trigger>
                <span className="inline-flex rounded-md w-full">
                  <button
                    type="button"
                    className={`${input} w-full flex items-center justify-between h-10 px-3 text-res text-sm`}
                  >
                    {StatusVal || 'Select Status'}
                    <RiExpandUpDownLine />
                  </button>
                </span>
              </Dropdown.Trigger>
              <Dropdown.Content>
                <Dropdown.List
                  onClick={() => SetStatusVal('Publish')}
                  className={`w-full cursor-pointer ${StatusVal === 'Publish' && 'bg-primary !hover:bg-primary text-res'}`}
                >
                  Publish
                </Dropdown.List>
                <Dropdown.List
                  onClick={() => SetStatusVal('Draft')}
                  className={`w-full cursor-pointer ${StatusVal === 'Draft' && 'bg-primary !hover:bg-primary text-res'}`}
                >
                  Draft
                </Dropdown.List>
              </Dropdown.Content>
            </Dropdown>

            <Textarea
              onChange={(val) => SetDescription(val.target.value)}
              value={description}
              className='bg-transparent '
              rows={6}
              placeholder='Description'
            />
            <p className='text-xs font-normal text-res'>Description max 300 words.</p>

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
    </div >
  );
}

export default Index;
Index.layout = (view) => <AdminLayout>{view}</AdminLayout>;