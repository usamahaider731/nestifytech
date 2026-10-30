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
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function DynamicContactForm({ className = '' }) {
    const { __ } = useLang();
    const { flash = {}, errors: serverErrors = {} } = usePage().props;
    const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

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
