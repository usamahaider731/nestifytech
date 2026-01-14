import Form from '@/Components/Admin/Form';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import React from 'react';
function Edit({ data,category }) {
    return (
        <Form
            initialData={category}
            rows={data}
            mode="edit"
            routes={route('edit.category',{id: category.id})}
            type="Category"
        />
    );
}
export default Edit;
Edit.layout = (page) => <AdminLayout>{page}</AdminLayout>;