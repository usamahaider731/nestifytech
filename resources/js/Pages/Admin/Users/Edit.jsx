import { useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Togglebox from '@/Components/Admin/Togglebox';
import ImageUploader from '@/Components/Admin/ImageUploader';
import axios from 'axios';
import Form from '@/Components/Admin/Form';
function Edit({ user, user_rows }) {
    const { post } = useForm();
    console.log(user.id)
    return (
        <Form
            initialData={user}
            rows={user_rows}
            mode="edit"
            routes={route('user.edit',{id: user.id})}
            redirectUrl={route('users')}
        />
    )
}
Edit.layout = (page) => <AdminLayout title="Edit">{page}</AdminLayout>;
export default Edit;