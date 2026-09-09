import AdminLayout from '@/Layouts/AdminLayout';
import Form from '@/Components/Admin/Form';
function Edit({ Data = [], initialData = {} }) {
    return (
        <Form
            initialData={initialData}
            rows={Data}
            mode="edit"
            routes={route('post.submit',{'type': 'product', 'id': initialData.id})}
            redirectUrl={route('post.index', { type: 'product' })}
        />
    );
}
export default Edit;
Edit.layout = (page) => <AdminLayout title="Edit">{page}</AdminLayout>;