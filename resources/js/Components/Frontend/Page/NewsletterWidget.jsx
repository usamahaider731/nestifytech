import React, { useState } from 'react';
import { RiMailSendLine, RiCheckLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

export default function NewsletterWidget({ className = '' }) {
    const { __ } = useLang();
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSubscribed(true);
            setEmail('');
        }, 600);
    };

    return (
        <div className={`bg-bg rounded border border-border/60 p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <RiMailSendLine size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-heading font-oswald uppercase tracking-wider">
                        {__('Stay Informed')}
                    </h3>
                    <p className="text-[11px] text-res/70">{__('Subscribe for updates')}</p>
                </div>
            </div>

            <p className="text-xs text-res/80 leading-relaxed mb-4">
                {__('Get notified about new policies, product arrivals, and exclusive announcements.')}
            </p>

            {subscribed ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-xs font-semibold">
                    <RiCheckLine size={18} className="shrink-0" />
                    <span>{__('Thank you for subscribing!')}</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={__('Enter your email address...')}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-dynamic text-xs text-heading placeholder:text-res/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-60 shadow-sm"
                    >
                        {loading ? __('Subscribing...') : __('Subscribe Now')}
                    </button>
                    <p className="text-[10px] text-res/60 text-center">
                        {__('We respect your privacy. Unsubscribe at any time.')}
                    </p>
                </form>
            )}
        </div>
    );
}
