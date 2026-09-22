import AdminLayout from '@/Layouts/AdminLayout'
import Table from '@/Components/Table'
import ActionDropdown from '@/Components/ActionDropdown'
import axios from 'axios'
import React, { useState } from 'react'
import { TbDotsVertical } from 'react-icons/tb'
import { RiStarFill, RiCheckLine, RiCloseLine, RiDeleteBinLine } from 'react-icons/ri'
import { toast } from 'react-toastify'

function ReviewIndex({ reviews: initialReviews }) {
    const [reviews, setReviews] = useState(initialReviews);

    const updateStatus = async (id, status) => {
        const r = toast.loading('Updating status...');
        try {
            await axios.post(route('admin.reviews.status', { id }), { status });
            setReviews(prev => prev.map(rev => rev.id === id ? { ...rev, status } : rev));
            toast.dismiss(r);
            toast.success(`Review ${status}!`);
        } catch {
            toast.dismiss(r);
            toast.error('Failed to update status');
        }
    };

    const deleteReview = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this review?')) return;
        const r = toast.loading('Deleting...');
        try {
            await axios.delete(route('admin.reviews.destroy', { id }));
            setReviews(prev => prev.filter(rev => rev.id !== id));
            toast.dismiss(r);
            toast.success('Review deleted');
        } catch {
            toast.dismiss(r);
            toast.error('Failed to delete review');
        }
    };

    const renderStars = (rating) => {
        return (
            <div className='flex gap-0.5 text-yellow-500'>
                {[...Array(5)].map((_, i) => (
                    <RiStarFill key={i} size={14} className={i < rating ? 'text-yellow-500' : 'text-res/20'} />
                ))}
            </div>
        );
    };
    return (
        <div className='py-5 px-6'>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-heading font-roboto">Product Reviews</h1>
                    <p className="text-sm text-res mt-1">Manage customer ratings and reviews across all products.</p>
                </div>
            </div>

            <div className='bg-accent rounded-xl border border-white/5 shadow-xl overflow-hidden'>
                <Table values={reviews}>
                    <Table.THead>
                        <Table.TR>
                            <Table.TH>Product</Table.TH>
                            <Table.TH>User</Table.TH>
                            <Table.TH>Rating</Table.TH>
                            <Table.TH>Comment</Table.TH>
                            <Table.TH>Status</Table.TH>
                            <Table.TH className='w-[80px]'>Actions</Table.TH>
                        </Table.TR>
                    </Table.THead>
                    <Table.TBody>
                        {reviews.length === 0 ? (
                            <Table.TR>
                                <Table.TD colSpan={6} className='text-center py-10 opacity-50'>No reviews yet.</Table.TD>
                            </Table.TR>
                        ) : (
                            reviews.map(rev => (
                                <Table.TR key={rev.id}>
                                    <Table.TD className="max-w-[150px] truncate text-heading font-medium">
                                        {rev.post?.title || 'Unknown Product'}
                                    </Table.TD>
                                    <Table.TD>
                                        <div className='flex flex-col'>
                                            <span className='font-bold text-xs'>{rev.user?.name || 'Guest'}</span>
                                            {rev.user?.email && <span className='text-[10px] text-res opacity-60'>{rev.user.email}</span>}
                                        </div>
                                    </Table.TD>
                                    <Table.TD>
                                        {renderStars(rev.rating)}
                                    </Table.TD>
                                    <Table.TD>
                                        <p className="text-xs text-res max-w-[300px] truncate">
                                            {rev.comment || <i className="opacity-50">No comment provided</i>}
                                        </p>
                                    </Table.TD>
                                    <Table.TD>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                            ${rev.status === 'approved' ? 'bg-green-500/10 text-green-500' : ''}
                                            ${rev.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : ''}
                                            ${rev.status === 'rejected' ? 'bg-red-500/10 text-red-500' : ''}
                                        `}>
                                            {rev.status}
                                        </span>
                                    </Table.TD>
                                    <Table.TD>
                                        <div className='mx-auto flex w-fit'>
                                            <ActionDropdown>
                                                <ActionDropdown.Trigger>
                                                    <TbDotsVertical className={`cursor-pointer size-4.25`} />
                                                </ActionDropdown.Trigger>
                                                <ActionDropdown.Context className={`flex flex-col gap-0.75 shadow-lg shadow-black/20`}>
                                                    {rev.status !== 'approved' && (
                                                        <ActionDropdown.List onClick={() => updateStatus(rev.id, 'approved')} className='text-green-500 hover:bg-green-500/10 hover:text-green-500'>
                                                            <RiCheckLine /> Approve
                                                        </ActionDropdown.List>
                                                    )}
                                                    {rev.status !== 'rejected' && (
                                                        <ActionDropdown.List onClick={() => updateStatus(rev.id, 'rejected')} className='text-orange-500 hover:bg-orange-500/10 hover:text-orange-500'>
                                                            <RiCloseLine /> Reject
                                                        </ActionDropdown.List>
                                                    )}
                                                    <ActionDropdown.List onClick={() => deleteReview(rev.id)} className='text-red-500 hover:bg-red-500/10 hover:text-red-500 mt-1 border-t border-white/5 pt-1'>
                                                        <RiDeleteBinLine /> Delete
                                                    </ActionDropdown.List>
                                                </ActionDropdown.Context>
                                            </ActionDropdown>
                                        </div>
                                    </Table.TD>
                                </Table.TR>
                            ))
                        )}
                    </Table.TBody>
                </Table>
            </div>
        </div>
    );
}

export default ReviewIndex;
ReviewIndex.layout = page => <AdminLayout title="Reviews">{page}</AdminLayout>;
