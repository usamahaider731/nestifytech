import React from 'react'
import Form from '@/Components/Admin/Form';
import AdminLayout from '@/Layouts/AdminLayout';

function LayoutSetting({ data = [], type = 'home' }) {
  // Build initial data from config
  const initialData = {};
  data.forEach(section => {
    if (section.fields) {
      section.fields.forEach(field => {
        let value = field.value !== undefined ? field.value : '';
        // Try to parse if it's a stringified JSON
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            value = JSON.parse(value);
          } catch (e) {}
        }
        initialData[field.name] = value;
      });
    }
  });

  return (
    <div>
      <Form
        initialData={initialData}
        rows={data}
        mode="edit"
        type='Layout'
        routes={route('layout.submit', { 'type': type })}
      />
    </div>
  )
}
export default LayoutSetting;
LayoutSetting.layout = (view) => {
  return (
    <AdminLayout title="LayoutSetting" children={view}></AdminLayout>
  );
}