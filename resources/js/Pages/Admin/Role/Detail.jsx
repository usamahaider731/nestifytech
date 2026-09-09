import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import  React from 'react';

function Detail({ role, data }) {
    const initial = {};

    data.forEach(section => {
        section.fields.forEach(field => {
            if (field.type === 'checkbox') {
                initial[field.label] = role?.permission?.[field.name] === 1;
            } else {
                initial[field.label] = role?.[field.name] ?? field.value ?? '';
            }
        });
    });

    return (
        <div className="w-full px-8 pb-8 mx-auto shadow-lg mt-8">
            <div className="flex justify-between mb-5 items-center">
                <h1 className="text-xl font-medium capitalize text-primary">{role.title}</h1>
                <Link
                    href={route('edit.role', { id: role.id })}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    Edit Role
                </Link>
            </div>

            <table className="w-full table-auto bg-accent overflow-hidden">
                <thead className="bg-permanent text-heading text-left">
                    <tr className="h-14">
                        <th className="px-6 py-2 text-sm font-semibold w-1/2">Permission</th>
                        <th className="px-6 py-2 text-sm font-semibold w-1/2 text-center">Access</th>
                    </tr>
                </thead>
                <tbody className="">
                    {Object.entries(initial).map(([key, value]) => (
                        <tr key={key} className=" even:bg-permanent transition">
                            <td className="px-6 py-3 text-heading font-medium text-sm">{key}</td>
                            <td className="px-6 py-3 text-center">
                                {typeof value === 'boolean' ? (
                                    <div className={`inline-flex items-center gap-2 font-medium text-sm ${value ? 'text-green-600' : 'text-red-500'}`}>
                                        <div className={`h-3 w-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                        {value ? 'Granted' : 'Denied'}
                                    </div>
                                ) : (
                                    <span className="text-base text-heading font-semibold uppercase">{value}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Detail;

Detail.layout = (page) => <AdminLayout title="Detail">{page}</AdminLayout>;
