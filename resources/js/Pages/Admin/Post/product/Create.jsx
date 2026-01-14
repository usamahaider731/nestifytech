import AdminLayout from '@/Layouts/AdminLayout';
import Form from '@/Components/Admin/Form';
function Create({ Data = [] }) {
    return (
        <Form
            initialData={{}} // or build from config
            rows={Data}
            mode="create"
            routes={route('post.submit',{'post': 'product'})}
        />
    );
}
export default Create;
Create.layout = (page) => <AdminLayout>{page}</AdminLayout>;