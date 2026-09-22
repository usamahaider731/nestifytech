import React from 'react';
import { usePage } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import MainSlider from '@/Components/Index/MainSlider';
import CategorySlider from '@/Components/Index/CategorySlider';
import LatestProducts from '@/Components/Index/LatestProducts';
import ImageViwer from '@/Components/Admin/ImageViwer';
import HeroBanner from '@/Components/Frontend/HeroBanner';
import AnimatedScrollSection from '@/Components/Index/AnimatedScrollSection';
import { RiCustomerService2Line, RiRefund2Line, RiSecurePaymentLine, RiTruckLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

function Index({ data }) {
    const { setting } = usePage().props;
    const { __ } = useLang();
    const containerClass =
        setting.layout.Home.container_type === 'container' ? 'container mx-auto' : 'w-full';

    return (
        <div className="min-h-screen w-full bg-bg font-primary text-res">
            {data.main_slider && (
                <div className="border-b border-border">
                    <MainSlider data={data.main_slider} />
                </div>
            )}

            <div className="border-b border-border">
                <div className={`${containerClass} grid grid-cols-2 divide-x divide-border px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8`}>
                    {[
                        [RiTruckLine, __('Free delivery'), __('On orders over your limit')],
                        [RiSecurePaymentLine, __('Secure payments'), __('Protected checkout')],
                        [RiRefund2Line, __('Easy returns'), __('Simple return policy')],
                        [RiCustomerService2Line, __('Expert support'), __('Here when you need us')],
                    ].map(([Icon, title, detail]) => (
                        <div key={title} className="flex items-center gap-3 px-3 first:pl-0 last:pr-0 md:px-5">
                            <Icon className="shrink-0 text-2xl text-primary" />
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold uppercase tracking-wide text-heading">{title}</p>
                                <p className="mt-1 truncate text-[11px] text-res">{detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${containerClass} px-4 pb-12 pt-8 sm:px-6 md:pb-16 lg:px-8`}>
                {!data.main_slider && <HeroBanner />}
                {data.categories && (
                    <div className="mt-10 md:mt-14">
                        <CategorySlider categories={data.categories} />
                    </div>
                )}
            </div>

            <div className="relative z-10 w-full border-y border-border bg-white">
                <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                    {data.latest_products && (
                        <LatestProducts products={data.latest_products} />
                    )}
                </div>
            </div>

            <AnimatedScrollSection />

            <div className="w-full overflow-hidden bg-bg py-12 md:py-20">
                <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                    {setting.layout.Home.banner_image_toggle && (
                        <div className="group mx-auto w-full max-w-6xl overflow-hidden rounded-xl border border-border bg-accent shadow-sm transition-shadow duration-300 hover:shadow-lg">
                            <ImageViwer
                                image={setting.layout.Home.banner_image}
                                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Index;

Index.layout = (page) => <FrontendLayout title="TechMarket Store">{page}</FrontendLayout>;
