import React from 'react';
import Form from '@/Components/Admin/Form';
import AdminLayout from '@/Layouts/AdminLayout';

function ModuleForm({ data, initialData, record, category, type, mode, routes, redirectUrl }) {
    // Some older components pass initialData as initialData, others as category or record
    const finalInitialData = initialData || record || category || {};
    
    // Fallback for routes if not provided explicitly by controller
    // (Though we should provide them for maximum control)
    const submitRoute = routes || (mode === 'edit' 
        ? route('module.submit', { type, id: finalInitialData.id }) 
        : route('module.submit', { type }));

    const finalRedirect = redirectUrl || route('module.index', { type });

    return (
        <Form
            initialData={finalInitialData}
            rows={data}
            mode={mode}
            type={type}
            routes={submitRoute}
            redirectUrl={finalRedirect}
        />
    );
}

ModuleForm.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default ModuleForm;
