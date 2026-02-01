import Form from '@/Components/Admin/Form';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import React from 'react';
function Create({ data }) {
    
    return (
        <Form
            initialData={{}}
            rows={data}
            mode="create"
          
            
            type="Category"
            routes={route('create.category')}
        />
    );
}
export default Create;
Create.layout = (page) => <AdminLayout>{page}</AdminLayout>;