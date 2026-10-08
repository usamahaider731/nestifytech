import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { RiExpandUpDownFill, RiExpandUpDownLine, RiFlagFill, RiFlagLine, RiMessage2Fill, RiMessage2Line, RiMessage3Line, RiStarFill, RiStarLine, RiThumbUpFill, RiThumbUpLine } from 'react-icons/ri';
import Dropdown from '../Dropdown';
import Textarea from '../Textarea';
import { useLang } from '@/contexts/LanguageContext';

const TABS = [
    { id: 'description', label: 'Description' },
    { id: 'properties', label: 'Properties' },
    { id: 'reviews', label: 'Reviews' },
];

const StarRating = ({ value, size = 'text-base' }) => (
    <span className={`inline-flex gap-0.5 ${size}`}>
        {[1, 2, 3, 4, 5].map((star) =>
            star <= value ? (
                <RiStarFill key={star} className="text-primary" />
            ) : (
                <RiStarLine key={star} className="text-border" />
            )
        )}
    </span>
);

const SingleProductTabs = ({ product }) => {
    const { __ } = useLang();

    const [activeTab, setActiveTab] = useState('description');
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    const [replyTo, setReplyTo] = useState(null);
    const [replyForm, setReplyForm] = useState({ comment: '' });

    const attributes = product?.attributes ?? [];

    const groupedProperties = useMemo(() => {
        const groups = {};
        attributes.forEach((attr) => {
            const groupName = attr.group || __('General');
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(attr);
        });
        return groups;
    }, [attributes, __]);

    const fetchReviews = () => {
        setReviewsLoading(true);
        axios
            .get(route('api.reviews.product', { postId: product.id }))
            .then((res) =>  setReviews(res.data?.data ?? res.data ?? []) )
            .finally(() => setReviewsLoading(false));
    };

    useEffect(() => {
        if (activeTab !== 'reviews' || !product?.id) {
            return;
        }
        fetchReviews();
    }, [activeTab, product?.id]);

    const handleReviewAction = async (reviewId, action) => {
        try {
            const response = await axios.post(route(`api.reviews.${action}`, { id: reviewId }));
            if (response.data && response.data.success === false) {
                alert(response.data.message);
            } else {
                fetchReviews();
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                alert(error.response.data.message);
            } else {
                console.error(error);
            }
        }
    };

    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!product?.id) return;
        setSubmitting(true);
        try {
            await axios.post(route('api.reviews.store'), {
                post_id: product.id,
                comment: replyForm.comment,
                type: "general",
                parent_id: parentId
            });
            setReplyForm({ comment: '' });
            setReplyTo(null);
            fetchReviews();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!product?.id) return;
        setSubmitting(true);
        setSubmitMessage(null);
        try {
            await axios.post(route('api.reviews.store'), {
                post_id: product.id,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                type: "general"
            });
            setSubmitMessage({ type: 'success', text: __('Thank you! Your review was submitted for approval.') });
            setReviewForm({ rating: 5, comment: '' });
        } catch {
            setSubmitMessage({ type: 'error', text: __('Could not submit your review. Please try again.') });
        } finally {
            setSubmitting(false);
        }
    };

    const descriptionHtml =
        product?.description ||
        product?.meta?.description?.value ||
        '<p class="text-text">' + __('No description available for this product.') + '</p>';

    return (
        <div className="flex flex-col w-full gap-6">
            <div className="flex flex-wrap gap-1 border-b border-border">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-res hover:text-heading'
                            }`}
                    >
                        {__(tab.label)}
                    </button>
                ))}
            </div>

            <div className="min-h-[12rem]">
                {activeTab === 'description' && (
                    <div
                        className="prose prose-sm max-w-none text-text [&_p]:mb-3"
                        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                )}

                {activeTab === 'properties' && (
                    <div className="flex flex-col gap-8">
                        {attributes.length === 0 ? (
                            <p className="text-sm text-res">{__('No properties listed for this product.')}</p>
                        ) : (
                            Object.entries(groupedProperties).map(([groupName, items]) => (
                                <div key={groupName} className="flex flex-col gap-3 border border-border bg-white">
                                    <h3 className="font-semibold text-base w-full px-5 py-2 bg-primary text-white">{groupName}</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                        {items.map((item, idx) => (
                                            <div
                                                key={`${item.key}-${idx}`}
                                                className="flex justify-between gap-4 px-5 py-2 border-b border-border/60 text-sm"
                                            >
                                                <dt className="text-heading font-medium">{item.key}</dt>
                                                <dd className="text-text text-right">{item.value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="flex flex-col gap-8">
                        {reviewsLoading ? (
                            <p className="text-sm text-res">{__('Loading reviews…')}</p>
                        ) : reviews.length === 0 ? (
                            <p className="text-sm text-res">{__('No reviews yet. Be the first to review this product.')}</p>
                        ) : (
                            <ul className="flex flex-col gap-5">
                                {reviews.map((review) => (
                                    <li
                                        key={review.id}
                                        className="flex flex-col gap-2 p-5 items-start border-b bg-white border-border/60 last:border-0"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-sm font-semibold bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center">
                                                {review.user?.name.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="text-sm font-semibold text-heading">
                                                {review.user?.name}
                                            </span>
                                            <StarRating value={review.rating} />
                                        </div>
                                        {review.comment && (
                                            <div className='text-sm bg-bg p-3 rounded-lg w-full'>
                                                <p className="text-sm text-text leading-relaxed">{review.comment}</p>
                                            </div>
                                        )}
                                        <div className=' flex w-full justify-end gap-3 mt-4'>
                                            <span onClick={() => setReplyTo(replyTo === review.id ? null : review.id)} className='text-res bg-common px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium cursor-pointer hover:bg-common/80'>
                                                <RiMessage2Line />
                                                {__('Reply')}
                                            </span>
                                            <span onClick={() => handleReviewAction(review.id, 'like')} className={`text-res bg-common px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium cursor-pointer hover:bg-common/80 ${review.is_liked ? 'text-primary' : ''}`}>
                                                {review.is_liked ? <RiThumbUpFill /> : <RiThumbUpLine />}
                                                {review.likes || 0} {__(review.is_liked ? 'Liked' : (review.likes > 1 ? 'Likes' : 'Like'))}
                                            </span>
                                            <span onClick={() => handleReviewAction(review.id, 'report')} className={`text-res bg-common px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium cursor-pointer hover:bg-common/80 ${review.is_reported ? 'text-red-500' : ''}`}>
                                                {review.is_reported ? <RiFlagFill /> : <RiFlagLine />}
                                                {review.reports || 0} {__(review.is_reported ? 'Reported' : 'Report')}
                                            </span>
                                        </div>
                                        
                                        {replyTo === review.id && (
                                            <form onSubmit={(e) => handleReplySubmit(e, review.id)} className="flex flex-col gap-3 w-full mt-3 pl-8">
                                                <Textarea
                                                    rows={2}
                                                    value={replyForm.comment}
                                                    onChange={(e) => setReplyForm({ comment: e.target.value })}
                                                    placeholder={__('Write a reply...')}
                                                    className="rounded-md border-border bg-white text-text text-sm resize-y"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setReplyTo(null)} className="px-4 py-1.5 rounded-md bg-common text-text text-sm font-semibold">{__('Cancel')}</button>
                                                    <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-60">{__('Submit Reply')}</button>
                                                </div>
                                            </form>
                                        )}
                                        
                                        {review.replies && review.replies.length > 0 && (
                                            <ul className="flex flex-col gap-3 w-full mt-3 pl-8 border-l-2 border-border/50">
                                                {review.replies.map(reply => (
                                                    <li key={reply.id} className="flex flex-col gap-2 p-3 bg-bg rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                                                                {reply.user?.name.charAt(0).toUpperCase()}
                                                            </span>
                                                            <span className="text-xs font-semibold text-heading">
                                                                {reply.user?.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-text leading-relaxed">{reply.comment}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 max-w-lg">
                            <h3 className="text-heading font-semibold text-base">{__('Write a review')}</h3>
                            {submitMessage && (
                                <p
                                    className={`text-sm ${submitMessage.type === 'success' ? 'text-primary' : 'text-red-600'
                                        }`}
                                >
                                    {submitMessage.text}
                                </p>
                            )}
                            <label className="flex flex-col gap-2 text-sm font-medium text-heading">
                                {__('Rating')}
                                <Dropdown
                                    value={reviewForm.rating}
                                    onChange={(e) =>
                                        setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
                                    }

                                >
                                    <Dropdown.Trigger className="rounded-md border-border bg-white text-text font-medium text-sm h-10 border flex px-5 justify-between items-center">
                                        <span>
                                            {reviewForm.rating ? __(':count stars', { count: reviewForm.rating }) : __('Select Review')}
                                        </span>
                                        <RiExpandUpDownFill className='size-4 text-primary' />
                                    </Dropdown.Trigger>
                                    <Dropdown.Content align='left' className='w-full ' contentClasses='!ring-0 bg-white border-dynamic rounded-none'>
                                        {[5, 4, 3, 2, 1].map((n) => (
                                            <Dropdown.List onClick={() => setReviewForm((prev) => ({ ...prev, rating: n }))} key={n} value={n} className='px-5 text-sm text-text cursor-pointer'>
                                                {__(':count stars', { count: n })}
                                            </Dropdown.List>
                                        ))}
                                    </Dropdown.Content>
                                </Dropdown>
                            </label>
                            <label className="flex flex-col gap-2 text-sm font-medium text-heading">
                                {__('Comment')}
                                <Textarea
                                    rows={4}
                                    value={reviewForm.comment}
                                    onChange={(e) =>
                                        setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                                    }
                                    placeholder={__('Share your experience with this product…')}
                                    className="rounded-md border-border bg-white text-text text-sm resize-y"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="self-start px-6 py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-60"
                            >
                                {submitting ? __('Submitting…') : __('Submit review')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SingleProductTabs;
