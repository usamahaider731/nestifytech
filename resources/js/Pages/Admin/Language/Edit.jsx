import Form from '@/Components/Admin/Form';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import React from 'react';
function Edit({ data, initialData }) {
    
    return (
        <Form
            initialData={initialData}
            rows={data}
            mode="edit"
          
            
            type="Language"
            routes={route('admin.lang.update', initialData.prefix)}
        />
    );
}
export default Edit;
Edit.layout = (page) => <AdminLayout>{page}</AdminLayout>;