import AdminLayout from '@/Layouts/AdminLayout';
import Form from '@/Components/Admin/Form';
function Edit({ Data = [], initialData = {} }) {
    return (
        <Form
            initialData={initialData}
            rows={Data}
            mode="edit"
            routes={route('post.submit',{'post': 'product', 'id': initialData.id})}
        />
    );
}
export default Edit;
Edit.layout = (page) => <AdminLayout>{page}</AdminLayout>;