import { useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Togglebox from '@/Components/Togglebox';
import ImageUploader from '@/Components/Admin/ImageUploader';
import axios from 'axios';
import Form from '@/Components/Admin/Form';
function Edit({ user, user_rows }) {
    const { post } = useForm();
    return (
        <Form
            initialData={user}
            rows={user_rows}
            mode="edit"
            onSubmit={(e, formData) => {
                e.preventDefault();
                post(route('submit.user', { id: user?.id }), { ...formData });
            }}
        />
    )
}
Edit.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Edit;