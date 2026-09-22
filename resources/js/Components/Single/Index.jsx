import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { RiExpandUpDownFill, RiExpandUpDownLine, RiStarFill, RiStarLine } from 'react-icons/ri';
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

    useEffect(() => {
        if (activeTab !== 'reviews' || !product?.id) {
            return;
        }
        setReviewsLoading(true);
        axios
            .get(`/api/reviews/product/${product.id}`)
            .then((res) => setReviews(res.data?.data ?? res.data ?? []))
            .catch(() => setReviews([]))
            .finally(() => setReviewsLoading(false));
    }, [activeTab, product?.id]);

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
                                        className="flex flex-col gap-2 pb-5 border-b border-border/60 last:border-0"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <StarRating value={review.rating} />
                                            <span className="text-sm font-semibold text-heading">
                                                {review.user?.name ?? __('Customer')}
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-text leading-relaxed">{review.comment}</p>
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
