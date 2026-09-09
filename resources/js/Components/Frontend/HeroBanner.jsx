import React from 'react';
import { Link } from '@inertiajs/react';
import { RiArrowRightLine, RiSparkling2Line } from 'react-icons/ri';
import ImageViwer from '@/Components/Admin/ImageViwer';

const DEFAULT_HERO = {
    badge: 'New Arrivals',
    title: 'Upgrade Your Tech Today',
    subtitle: 'Premium devices, unbeatable prices',
    description:
        'Shop the latest smartphones, wearables, and accessories. Free delivery on orders over PKR 50,000.',
    ctaText: 'Shop Now',
    ctaHref: '#products',
    image: '/assets/image/mobiles.webp',
};

/**
 * @param {Object} props
 * @param {string} [props.badge]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {string} [props.description]
 * @param {string} [props.ctaText]
 * @param {string} [props.ctaHref]
 * @param {string|Object} [props.image]
 * @param {string} [props.className]
 */
export default function HeroBanner({
    badge = DEFAULT_HERO.badge,
    title = DEFAULT_HERO.title,
    subtitle = DEFAULT_HERO.subtitle,
    description = DEFAULT_HERO.description,
    ctaText = DEFAULT_HERO.ctaText,
    ctaHref = DEFAULT_HERO.ctaHref,
    image = DEFAULT_HERO.image,
    className = '',
}) {
    const isExternal = ctaHref?.startsWith('http');
    const isHashLink = ctaHref?.startsWith('#');

    const ctaClasses =
        'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm md:text-base font-bold text-text shadow-lg shadow-primary/25 transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98]';

    const ctaButton =
        isExternal || isHashLink ? (
            <a href={ctaHref} className={ctaClasses}>
                {ctaText}
                <RiArrowRightLine className="size-5" />
            </a>
        ) : (
            <Link href={ctaHref} className={ctaClasses}>
                {ctaText}
                <RiArrowRightLine className="size-5" />
            </Link>
        );

    return (
        <section
            className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white ${className}`}
        >
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--color-primary),_transparent_50%)]" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center p-6 sm:p-8 md:p-10 lg:p-14">
                <div className="flex flex-col gap-4 md:gap-5 z-10">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-xs md:text-sm font-semibold text-primary border border-white/10">
                        <RiSparkling2Line className="size-4" />
                        {badge}
                    </span>

                    {subtitle && (
                        <p className="text-sm md:text-base font-medium text-slate-300 uppercase tracking-wider">
                            {subtitle}
                        </p>
                    )}

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white">
                        {title}
                    </h1>

                    {description && (
                        <p className="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
                            {description}
                        </p>
                    )}

                    {ctaButton}
                </div>

                <div className="relative flex items-center justify-center min-h-[220px] sm:min-h-[280px] lg:min-h-[360px]">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent" />
                    {typeof image === 'string' ? (
                        <img
                            src={image}
                            alt={title}
                            className="relative z-10 max-h-[280px] md:max-h-[360px] w-full object-contain drop-shadow-2xl"
                        />
                    ) : (
                        <ImageViwer
                            image={image}
                            className="relative z-10 max-h-[280px] md:max-h-[360px] w-full object-contain drop-shadow-2xl"
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
