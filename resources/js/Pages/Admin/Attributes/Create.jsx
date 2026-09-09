import Form from '@/Components/Admin/Form';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import React from 'react';
function Create({ data }) {
    const { post } = useForm();
    
    return (
        <Form
            initialData={{}}
            rows={data}
            mode="create"
            type="Attribute"
            routes={route('admin.attributes.store')}
        />
    );
}
export default Create;
Create.layout = (page) => <AdminLayout title="Create">{page}</AdminLayout>;