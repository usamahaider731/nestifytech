import React from 'react';
import { Link } from '@inertiajs/react';
import { BiMapPin, BiStore } from 'react-icons/bi';
import { RiArrowRightLine, RiBuilding4Line } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

// Attractive curated gradient accents for city cards
const CITY_GRADIENTS = [
    'from-rose-500/10 via-amber-500/10 to-transparent border-rose-200/80 hover:border-rose-400',
    'from-blue-500/10 via-indigo-500/10 to-transparent border-blue-200/80 hover:border-blue-400',
    'from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-200/80 hover:border-emerald-400',
    'from-purple-500/10 via-pink-500/10 to-transparent border-purple-200/80 hover:border-purple-400',
    'from-amber-500/10 via-orange-500/10 to-transparent border-amber-200/80 hover:border-amber-400',
];

export default function ShopByCitySection({ cities = [] }) {
    const { __ } = useLang();

    if (!cities || cities.length === 0) {
        return null;
    }

    return (
        <section className="py-10 lg:py-14">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2.5">
                        <BiMapPin size={14} />
                        <span>{__('Localized Shopping')}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight font-poppins">
                        {__('Shop by City & Nearby Stores')}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-res max-w-xl">
                        {__('Browse items currently available from official branch stores in your neighborhood for faster pickup & local delivery.')}
                    </p>
                </div>

                <Link
                    href={route('store.locator')}
                    className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors shrink-0"
                >
                    <BiStore size={16} />
                    <span>{__('View All Store Locations')}</span>
                    <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* City Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                {cities.map((city, idx) => {
                    const grad = CITY_GRADIENTS[idx % CITY_GRADIENTS.length];
                    return (
                        <Link
                            key={city.id}
                            href={route('shop', { city: city.id })}
                            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${grad} p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white flex flex-col justify-between min-h-[130px] sm:min-h-[145px]`}
                        >
                            {/* Decorative City Icon Watermark */}
                            <div className="absolute -right-3 -bottom-3 text-slate-100 group-hover:text-primary/10 transition-colors pointer-events-none">
                                <RiBuilding4Line size={72} />
                            </div>

                            {/* Top badge */}
                            <div className="flex items-center justify-between relative z-10">
                                <div className="size-8 sm:size-9 rounded-xl bg-white shadow-sm border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <BiMapPin size={18} />
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-heading group-hover:bg-primary group-hover:text-white transition-colors">
                                    {city.product_count ?? 0} {__('Products')}
                                </span>
                            </div>

                            {/* Bottom City Name */}
                            <div className="relative z-10 mt-4">
                                <h3 className="font-bold text-sm sm:text-base text-heading group-hover:text-primary transition-colors line-clamp-1">
                                    {city.title}
                                </h3>
                                <p className="text-[11px] text-res flex items-center gap-1 mt-0.5 group-hover:text-primary transition-colors font-medium">
                                    <span>{__('Browse Local Stock')}</span>
                                    <RiArrowRightLine size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
