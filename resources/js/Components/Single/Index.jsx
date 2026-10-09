import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { RiFlagFill, RiFlagLine, RiMessage3Line, RiSendPlaneFill, RiStarFill, RiStarLine, RiThumbUpFill, RiThumbUpLine, RiUserLine } from 'react-icons/ri';
import Textarea from '../Textarea';
import { useLang } from '@/contexts/LanguageContext';

const TABS = [
    { id: 'description', label: 'Description' },
    { id: 'properties', label: 'Properties' },
    { id: 'reviews', label: 'Reviews' },
];

const StarRating = ({ value, size = 'text-base' }) => (
    <span className={`inline-flex gap-0.5 ${size}`}>
        {[1, 2, 3, 4, 5].map((s) =>
            s <= value
                ? <RiStarFill key={s} className="text-amber-400" />
                : <RiStarLine key={s} className="text-border" />
        )}
    </span>
);

const InteractiveStars = ({ value, onChange }) => (
    <span className="inline-flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => onChange(s)}
                className="text-2xl transition-transform hover:scale-110 focus:outline-none">
                {s <= value
                    ? <RiStarFill className="text-amber-400" />
                    : <RiStarLine className="text-border" />}
            </button>
        ))}
    </span>
);

const Avatar = ({ name, size = 'size-9' }) => {
    const initials = name ? name.charAt(0).toUpperCase() : '?';
    const colors = ['bg-violet-500', 'bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];
    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    return (
        <span className={`${size} ${color} shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
            {initials}
        </span>
    );
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const RatingSummary = ({ reviews }) => {
    const total = reviews.length;
    const avg = total ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total).toFixed(1) : 0;
    const counts = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
    }));
    return (
        <div className="flex flex-col sm:flex-row gap-6 p-6 bg-accent rounded-2xl border border-border/60">
            <div className="flex flex-col items-center justify-center min-w-[110px]">
                <span className="text-5xl font-black text-heading">{avg}</span>
                <StarRating value={Math.round(avg)} size="text-lg" />
                <span className="text-xs text-res mt-1">{total} review{total !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 justify-center">
                {counts.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-right text-res font-medium">{star}</span>
                        <RiStarFill className="text-amber-400 shrink-0" />
                        <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                style={{ width: total ? `${(count / total) * 100}%` : '0%' }}
                            />
                        </div>
                        <span className="w-4 text-res">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ReviewCard = ({ review, onAction, replyTo, setReplyTo, replyForm, setReplyForm, onReplySubmit, submitting, __ }) => {
    const isReplying = replyTo === review.id;
    return (
        <div className="flex flex-col gap-4 p-5 bg-permanent rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar name={review.user?.name} />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-heading leading-tight">{review.user?.name ?? 'Guest'}</span>
                        <span className="text-[11px] text-res">{timeAgo(review.created_at)}</span>
                    </div>
                </div>
                {review.rating > 0 && (
                    <div className="flex flex-col items-end gap-0.5">
                        <StarRating value={review.rating} size="text-sm" />
                        <span className="text-[11px] text-res">{review.rating}/5</span>
                    </div>
                )}
            </div>
            {review.comment && (
                <p className="text-sm text-text leading-relaxed pl-12">{review.comment}</p>
            )}
            <div className="flex items-center gap-2 pl-12 flex-wrap">
                <button
                    onClick={() => setReplyTo(isReplying ? null : review.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dynamic text-res text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                >
                    <RiMessage3Line className="text-sm" />
                    {review.replies?.length > 0 ? `${review.replies.length} ${__('Replies')}` : __('Reply')}
                </button>
                <button
                    onClick={() => onAction(review.id, 'like')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${review.is_liked ? 'bg-primary/10 text-primary' : 'bg-dynamic text-res hover:bg-primary/10 hover:text-primary'}`}
                >
                    {review.is_liked ? <RiThumbUpFill /> : <RiThumbUpLine />}
                    {review.likes || 0} {__(review.is_liked ? 'Liked' : 'Like')}
                </button>
                <button
                    onClick={() => onAction(review.id, 'report')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${review.is_reported ? 'bg-red-50 text-red-500' : 'bg-dynamic text-res hover:bg-red-50 hover:text-red-500'}`}
                >
                    {review.is_reported ? <RiFlagFill /> : <RiFlagLine />}
                    {__(review.is_reported ? 'Reported' : 'Report')}
                </button>
            </div>
            {isReplying && (
                <form onSubmit={(e) => onReplySubmit(e, review.id)} className="pl-12 flex flex-col gap-2">
                    <Textarea
                        rows={2}
                        value={replyForm.comment}
                        onChange={(e) => setReplyForm({ comment: e.target.value })}
                        placeholder={__('Write a reply…')}
                        className="text-sm resize-none rounded-xl border-border bg-bg"
                    />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setReplyTo(null)}
                            className="px-4 py-1.5 text-xs font-semibold rounded-full bg-dynamic text-res hover:bg-border transition-colors">
                            {__('Cancel')}
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-primary text-white disabled:opacity-60">
                            <RiSendPlaneFill /> {__('Reply')}
                        </button>
                    </div>
                </form>
            )}
            {review.replies?.length > 0 && (
                <div className="pl-12 flex flex-col gap-3 border-l-2 border-border/40 ml-4">
                    {review.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 items-start">
                            <Avatar name={reply.user?.name} size="size-7" />
                            <div className="flex flex-col gap-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-heading">{reply.user?.name ?? 'Guest'}</span>
                                    <span className="text-[10px] text-res">{timeAgo(reply.created_at)}</span>
                                </div>
                                <p className="text-xs text-text leading-relaxed">{reply.comment}</p>
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => onAction(reply.id, 'like')}
                                        className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${reply.is_liked ? 'text-primary bg-primary/10' : 'text-res bg-dynamic hover:text-primary hover:bg-primary/10'}`}>
                                        {reply.is_liked ? <RiThumbUpFill /> : <RiThumbUpLine />} {reply.likes || 0}
                                    </button>
                                    <button onClick={() => onAction(reply.id, 'report')}
                                        className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${reply.is_reported ? 'text-red-500 bg-red-50' : 'text-res bg-dynamic hover:text-red-500 hover:bg-red-50'}`}>
                                        {reply.is_reported ? <RiFlagFill /> : <RiFlagLine />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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
            const g = attr.group || __('General');
            if (!groups[g]) groups[g] = [];
            groups[g].push(attr);
        });
        return groups;
    }, [attributes, __]);

    const fetchReviews = () => {
        setReviewsLoading(true);
        axios.get(route('api.reviews.product', { postId: product.id }))
            .then((res) => setReviews(res.data?.data ?? res.data ?? []))
            .finally(() => setReviewsLoading(false));
    };

    useEffect(() => {
        if (activeTab !== 'reviews' || !product?.id) return;
        fetchReviews();
    }, [activeTab, product?.id]);

    const handleReviewAction = async (reviewId, action) => {
        try {
            const res = await axios.post(route(`api.reviews.${action}`, { id: reviewId }));
            if (res.data?.success === false) alert(res.data.message);
            else fetchReviews();
        } catch (err) { alert(err.response?.data?.message || 'Something went wrong.'); }
    };

    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!product?.id) return;
        setSubmitting(true);
        try {
            await axios.post(route('api.reviews.store'), { post_id: product.id, comment: replyForm.comment, type: 'general', parent_id: parentId });
            setReplyForm({ comment: '' });
            setReplyTo(null);
            fetchReviews();
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!product?.id) return;
        setSubmitting(true);
        setSubmitMessage(null);
        try {
            await axios.post(route('api.reviews.store'), { post_id: product.id, rating: reviewForm.rating, comment: reviewForm.comment, type: 'general' });
            setSubmitMessage({ type: 'success', text: __('Thank you! Your review was submitted for approval.') });
            setReviewForm({ rating: 5, comment: '' });
            fetchReviews();
        } catch {
            setSubmitMessage({ type: 'error', text: __('Could not submit your review. Please try again.') });
        } finally { setSubmitting(false); }
    };

    const descriptionHtml = product?.description || product?.meta?.description?.value || `<p class="text-text">${__('No description available for this product.')}</p>`;

    return (
        <div className="flex flex-col w-full gap-6">
            <div className="flex flex-wrap gap-1 border-b border-border">
                {TABS.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-res hover:text-heading'}`}>
                        {__(tab.label)}
                    </button>
                ))}
            </div>

            <div className="min-h-[12rem]">
                {activeTab === 'description' && (
                    <div className="prose prose-sm max-w-none text-text [&_p]:mb-3" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
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
                                            <div key={`${item.key}-${idx}`} className="flex justify-between gap-4 px-5 py-2 border-b border-border/60 text-sm">
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
                        {reviews.length > 0 && <RatingSummary reviews={reviews} />}

                        {reviewsLoading ? (
                            <div className="flex flex-col gap-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-28 bg-accent animate-pulse rounded-2xl" />)}
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-res">
                                <RiUserLine className="text-4xl opacity-30" />
                                <p className="text-sm">{__('No reviews yet. Be the first to review this product.')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {reviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        onAction={handleReviewAction}
                                        replyTo={replyTo}
                                        setReplyTo={setReplyTo}
                                        replyForm={replyForm}
                                        setReplyForm={setReplyForm}
                                        onReplySubmit={handleReplySubmit}
                                        submitting={submitting}
                                        __={__}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="border-t border-border/60 pt-8">
                            <h3 className="text-heading font-semibold text-base mb-5">{__('Write a Review')}</h3>
                            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-5 max-w-xl">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-res uppercase tracking-wide">{__('Your Rating')}</label>
                                    <InteractiveStars value={reviewForm.rating} onChange={(v) => setReviewForm((p) => ({ ...p, rating: v }))} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-res uppercase tracking-wide">{__('Your Review')}</label>
                                    <Textarea
                                        rows={4}
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                                        placeholder={__('Share your experience with this product…')}
                                        className="rounded-xl border-border bg-bg text-text text-sm resize-none"
                                    />
                                </div>
                                {submitMessage && (
                                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${submitMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                        {submitMessage.text}
                                    </div>
                                )}
                                <button type="submit" disabled={submitting}
                                    className="self-start flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-60 hover:bg-primary/90 transition-colors">
                                    <RiSendPlaneFill />
                                    {submitting ? __('Submitting…') : __('Submit Review')}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SingleProductTabs;
