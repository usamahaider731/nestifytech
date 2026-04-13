import React from 'react';
import { useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Togglebox from '@/Components/Togglebox';
import { toast } from 'react-toastify';

const Create = ({ Data, roles }) => {
  const id = roles?.id;

  const { data, setData, post, processing, errors } = useForm(() => {
    const initial = { id: roles?.id ?? null }; // ✅ Add id here

    Data.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'checkbox') {
          initial[field.name] = roles?.permission?.[field.name] === 1;
        } else {
          initial[field.name] = roles?.[field.name] ?? field.value ?? '';
        }
      });
    });

    return initial;
  });

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent page reload
  };

  const submitData = (status) => {
    // Convert checkbox values to 1/0
    const payload = {};
    Object.entries(data).forEach(([key, value]) => {
      payload[key] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
    });

    post(route('submit.role', { status }), {
      ...data,
      preserveScroll: true,
      onSuccess: () => {
        toast.success(id ? 'Upload Successfully': 'Create Successfully');
        router.visit(route('role'));
      },
      onsubmit: () => toast.loading("Form is Submmiting"),
      onError: () => toast.error(id ? 'Failed to Upload' : 'Failed to Create')
    });
  };

  return (
    <form className="py-7 w-full flex-wrap px-6 flex" onSubmit={handleSubmit}>
      {/* Top Bar */}
      <div className="w-full flex items-start justify-between">
        <div className="flex flex-col gap-1.5 items-start">
          <h4 className="text-2xl font-roboto text-heading font-medium">
            {id ? 'Edit Role' : 'Add a new Role'}
          </h4>
          <p className="text-base font-medium text-res font-roboto">
            Define access level for users
          </p>
        </div>
        <div className="flex gap-5 items-center">
          <button
            type="reset"
            className="rounded-md h-10 flex items-center bg-accent px-6 text-secondary text-[15px] cursor-pointer font-medium"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => submitData('draft')}
            className="rounded-md h-10 flex items-center bg-[color-mix(in_sRGB,var(--color-primary)_10%,_#2f3349)] px-6 text-primary text-[15px] cursor-pointer font-medium"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => submitData('publish')}
            className="rounded-md h-10 flex items-center bg-primary px-6 text-heading text-[15px] cursor-pointer font-medium"
          >
            Publish Role
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="w-full flex-wrap flex mt-7">
        <div className="w-7/10 flex flex-col gap-5">
          {Data.map((section, index) => (
            <div key={index} className="bg-accent rounded-[0.375rem]">
              <h2 className="text-lg font-medium font-roboto text-heading p-6">
                {section.title}
              </h2>
              <div className="grid grid-cols-6 gap-5 pb-6 px-6">
                {section.fields.map((field, fieldIndex) => {
                  const colSpan =
                    field.style === '2'
                      ? 'col-span-6'
                      : field.type === 'checkbox'
                        ? 'col-span-2'
                        : 'col-span-3';

                  if (field.type === 'text') {
                    return (
                      <div key={fieldIndex} className={`flex flex-col gap-2 ${colSpan}`}>
                        <InputLabel children={field.label} className="text-heading" />
                        <TextInput
                          type="text"
                          name={field.name}
                          placeholder={field.placeholder}
                          value={data[field.name]}
                          onChange={(e) => setData(field.name, e.target.value)}
                          required={field.attribute === 'required'}
                          className="border px-3 py-2 w-full rounded"
                        />
                        {errors[field.name] && (
                          <div className="text-sm text-red-500">{errors[field.name]}</div>
                        )}
                      </div>
                    );
                  }

                  if (field.type === 'checkbox') {
                    return (
                      <div key={fieldIndex} className={`flex flex-col gap-2 ${colSpan}`}>
                        <InputLabel children={field.label} className="text-heading" />
                        <Togglebox
                          name={field.name}
                          checked={!!data[field.name]}
                          onChange={(e) => setData(field.name, e.target.checked)}
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};

export default Create;

Create.layout = (page) => <AdminLayout>{page}</AdminLayout>;
