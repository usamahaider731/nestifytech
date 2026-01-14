import Form from '@/Components/Admin/Form';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import React from 'react';
function Edit({attribute, data }) {
    const { post } = useForm();
    
    return (
        <Form
            initialData={attribute}
            rows={data}
            mode="Edit"
            type="Attribute"
            routeMethod="put"
            routes={route('admin.attributes.update',{'id':attribute.id})}
        />
    );
}
export default Edit;
Edit.layout = (page) => <AdminLayout>{page}</AdminLayout>;