import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
    RiSendPlaneFill,
    RiUserLine,
    RiMailLine,
    RiPhoneLine,
    RiChat3Line,
    RiCheckDoubleLine,
    RiAlertLine,
    RiShieldCheckLine,
    RiCustomerService2Fill,
    RiTimeLine,
    RiSparkling2Line,
    RiRobotLine,
    RiCloseLine,
    RiArrowRightLine,
} from 'react-icons/ri';
import axios from 'axios';
import { useLang } from '@/contexts/LanguageContext';

export default function DynamicContactForm({ className = '' }) {
    const { __ } = useLang();
    const { flash = {}, errors: serverErrors = {} } = usePage().props;
    const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiBox, setShowAiBox] = useState(true);

    const quickAiQuestions = [
        'How can I track my order?',
        'What are shipping delivery times?',
        'How do promotional gift cards work?',
        'What is your return & refund policy?',
    ];

    const handleAskAi = async (questionToAsk) => {
        const query = (questionToAsk || aiQuery).trim();
        if (!query) return;

        setAiLoading(true);
        setAiResponse(null);
        try {
            const res = await axios.post('/api/ai/contact-assistant', { message: query });
            if (res.data?.success && res.data?.reply) {
                setAiResponse(res.data.reply);
            } else {
                setAiResponse("I couldn't fetch an instant answer right now. Please feel free to submit your inquiry via the form below!");
            }
        } catch (err) {
            setAiResponse("Our AI service is currently busy. You can submit your message below and our team will get back to you shortly.");
        } finally {
            setAiLoading(false);
        }
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        website_hp: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();

        post(route('contact.submit'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSubmittedSuccessfully(true);
                setTimeout(() => {
                    setSubmittedSuccessfully(false);
                }, 9000);
            },
        });
    };

    const isSuccess = submittedSuccessfully || !!flash?.success;

    return (
        <div className={`relative bg-bg rounded-lg border border-border/70 p-6 sm:p-8 lg:p-10 shadow-sm ${className}`}>
            {/* Header / Intro */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                    <RiCustomerService2Fill size={15} />
                    <span>{__('Send Us a Message')}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-heading font-oswald tracking-tight">
                    {__('Get in Touch With Our Specialists')}
                </h3>
                <p className="mt-2 text-sm text-res/80 leading-relaxed">
                    {__('Have a custom question, need bulk order quotes, or request order assistance? Complete the form below and our team will get back to your email directly.')}
                </p>
            </div>

            {/* Success Banner */}
            {isSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-start gap-3 animate-fadeIn">
                    <RiCheckDoubleLine size={22} className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold">{__('Message Sent Successfully!')}</h4>
                        <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                            {flash?.success || __('Thank you for contacting us! We have dispatched your request to our support inbox and sent an automated confirmation to your email.')}
                        </p>
                    </div>
                </div>
            )}

            {/* Rate limit error */}
            {serverErrors?.rate_limit && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-3">
                    <RiAlertLine size={22} className="shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold leading-relaxed">
                        {serverErrors.rate_limit}
                    </p>
                </div>
            )}

            {/* ── AI Instant Contact Assistant ── */}
            {showAiBox && (
                <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-primary/10 border border-purple-500/20 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                                <RiSparkling2Line size={16} />
                            </span>
                            <div>
                                <h4 className="text-sm font-bold text-heading flex items-center gap-2">
                                    <span>{__('AI Instant Answers')}</span>
                                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                                        {__('Fast')}
                                    </span>
                                </h4>
                                <p className="text-[11px] text-res/80">
                                    {__('Need quick information about your order, shipping, returns, or gift cards? Ask below!')}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAiBox(false)}
                            className="text-res/60 hover:text-heading p-1 text-xs"
                            title={__('Dismiss AI suggestions')}
                        >
                            <RiCloseLine size={18} />
                        </button>
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {quickAiQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                type="button"
                                disabled={aiLoading}
                                onClick={() => {
                                    setAiQuery(q);
                                    handleAskAi(q);
                                }}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-bg hover:bg-bg/80 text-heading border border-purple-500/20 transition-all hover:border-purple-500/50 hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                            >
                                💡 {q}
                            </button>
                        ))}
                    </div>

                    {/* AI Query Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAskAi();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder={__('Type any question for instant response...')}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-purple-500/30 bg-bg text-xs text-heading placeholder:text-res/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={aiLoading || !aiQuery.trim()}
                            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {aiLoading ? (
                                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <RiSparkling2Line size={14} />
                            )}
                            <span className="hidden sm:inline">{aiLoading ? __('Thinking...') : __('Ask AI')}</span>
                        </button>
                    </form>

                    {/* AI Answer Box */}
                    {aiResponse && (
                        <div className="mt-4 p-4 rounded-xl bg-bg/95 border border-purple-500/30 text-xs text-heading shadow-sm animate-fadeIn">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                                <span className="font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                                    <RiRobotLine size={15} /> {__('NestifyAI Answer:')}
                                </span>
                                <span className="text-[10px] text-res/60 font-medium">
                                    {__('Instant Assistance')}
                                </span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-line text-heading/90">
                                {aiResponse}
                            </p>
                            <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-res/70 border-t border-border/30">
                                <span>{__('Still need to speak with human support? Submit the detailed form below.')}</span>
                                <button
                                    type="button"
                                    onClick={() => setAiResponse(null)}
                                    className="text-primary hover:underline font-semibold"
                                >
                                    {__('Clear')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot field (hidden from legitimate humans) */}
                <input
                    type="text"
                    name="website_hp"
                    value={data.website_hp}
                    onChange={(e) => setData('website_hp', e.target.value)}
                    tabIndex="-1"
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                            {__('Your Full Name')} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-res/60">
                                <RiUserLine size={18} />
                            </span>
                            <input
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={__('e.g. John Doe')}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-heading placeholder:text-res/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                                    errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-border/70 hover:border-border'
                                }`}
                                autoComplete='off'
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                                <RiAlertLine size={13} /> {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                            {__('Email Address')} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-res/60">
                                <RiMailLine size={18} />
                            </span>
                            <input
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder={__('e.g. john@example.com')}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-sm text-heading placeholder:text-res/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-border/70 hover:border-border'
                                }`}
                                autoComplete='off'
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                                <RiAlertLine size={13} /> {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Phone Number (Optional) */}
                    <div>
                        <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                            {__('Phone Number')} <span className="text-res/60 text-[10px] lowercase">({__('optional')})</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-res/60">
                                <RiPhoneLine size={18} />
                            </span>
                            <input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder={__('e.g. +1 (555) 000-0000')}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-sm text-heading placeholder:text-res/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                                    errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-border/70 hover:border-border'
                                }`}
                            />
                        </div>
                        {errors.phone && (
                            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                                <RiAlertLine size={13} /> {errors.phone}
                            </p>
                        )}
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                            {__('Subject / Inquired Topic')}
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-res/60">
                                <RiChat3Line size={18} />
                            </span>
                            <input
                                type="text"
                                value={data.subject}
                                onChange={(e) => setData('subject', e.target.value)}
                                placeholder={__('e.g. Order Tracking #1234 or Wholesale Inquiry')}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-sm text-heading placeholder:text-res/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                                    errors.subject ? 'border-rose-400 bg-rose-50/20' : 'border-border/70 hover:border-border'
                                }`}
                            />
                        </div>
                        {errors.subject && (
                            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                                <RiAlertLine size={13} /> {errors.subject}
                            </p>
                        )}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
                        {__('How can we assist you?')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        required
                        rows={5}
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        placeholder={__('Please describe your question, requested products, or issue in detail...')}
                        className={`w-full p-4 rounded-xl border bg-white text-sm text-heading placeholder:text-res/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y ${
                            errors.message ? 'border-rose-400 bg-rose-50/20' : 'border-border/70 hover:border-border'
                        }`}
                    />
                    <div className="flex justify-between items-center mt-1">
                        {errors.message ? (
                            <p className="text-xs text-rose-500 flex items-center gap-1">
                                <RiAlertLine size={13} /> {errors.message}
                            </p>
                        ) : (
                            <span className="text-[11px] text-res/60">
                                {__('Minimum 10 characters required.')}
                            </span>
                        )}
                        <span className="text-[11px] text-res/50">
                            {data.message.length} / 3000
                        </span>
                    </div>
                </div>

                {/* Submit button & Security assurance */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-res/70">
                        <RiShieldCheckLine size={16} className="text-emerald-500" />
                        <span>{__('Encrypted & Confidential Transmission')}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-wider shadow-md shadow-primary/25 hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {processing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{__('Sending Request...')}</span>
                            </>
                        ) : (
                            <>
                                <span>{__('Send Inquiry')}</span>
                                <RiSendPlaneFill size={16} />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Quick response badge */}
            <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-res/70">
                <div className="flex items-center gap-2">
                    <RiTimeLine size={16} className="text-primary shrink-0" />
                    <span>{__('Average Response Time: Within 2 to 6 business hours')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <RiMailLine size={16} className="text-primary shrink-0" />
                    <span>{__('Copies are automatically dispatched to your email')}</span>
                </div>
            </div>
        </div>
    );
}
