import React from 'react'
import Form from '@/Components/Admin/Form';
import AdminLayout from '@/Layouts/AdminLayout';

function LayoutSetting({ data = [], type = 'home' }) {
  return (
    <div>
      
      <Form
        initialData={{}} // or build from config
        rows={data}
        mode="create"
        type='Layout'
        routes={route('layout.submit', { 'type': type })}
      />
    </div>
  )
}
export default LayoutSetting;
LayoutSetting.layout = (view) => {
  return (
    <AdminLayout children={view}></AdminLayout>
  );
}