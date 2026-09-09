import Form from '@/Components/Admin/Form';
import AdminLayout from '@/Layouts/AdminLayout';
import React from 'react';

function Edit({ data, category, type }) {
    return (
        <Form
            initialData={category}
            rows={data}
            mode="edit"
            routes={route('taxonomy.submit', { type: type, id: category.id })}
            type={type}
            redirectUrl={route('taxonomy.index', { type: type, ...(category.parent_id ? { id: category.parent_id } : {}) })}
        />
    );
}

Edit.layout = (page) => <AdminLayout title="Edit">{page}</AdminLayout>;
export default Edit;
