import Form from '@/Components/Admin/Form';
import AdminLayout from '@/Layouts/AdminLayout';
import React from 'react';

function Create({ data, type }) {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const parentId = urlParams ? urlParams.get('parent_id') : null;
    
    return (
        <Form
            initialData={parentId ? { parent_id: Number(parentId) } : {}}
            rows={data}
            mode="create"
            type={type}
            routes={route('taxonomy.submit', { type: type })}
            redirectUrl={route('taxonomy.index', { type: type, ...(parentId ? { id: parentId } : {}) })}
        />
    );
}

Create.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Create;
