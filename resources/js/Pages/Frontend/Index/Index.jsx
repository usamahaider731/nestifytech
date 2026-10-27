import React, { useState } from 'react';
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
import AdsRender from '@/Components/Frontend/AdsRender';
import PopularProducts from '@/Components/Index/PopluarProducts';
import TrendingProducts from '@/Components/Index/TrendingProducts';
import ForYouProducts from '@/Components/Index/ForYouProducts';
import RecentlyViewedProducts from '@/Components/Index/RecentlyViewedProducts';
import BrandSlider from '@/Components/BrandSlider';
import Services from '@/Components/Index/Services';
import LatestBlogs from '@/Components/Index/LatestBlogs';

function Index({ data }) {
    const { setting } = usePage().props;
    const { __ } = useLang();
    const containerClass =
        setting.layout.Home.container_type === 'container' ? 'container mx-auto' : 'w-full';
    const [services, SetServices] = useState(setting.layout.Home.services ?? [])
    return (
        <div className="min-h-screen w-full bg-bg font-primary text-res">
            {data.main_slider && (
                <div className="border-b border-border">
                    <MainSlider data={data.main_slider} />
                </div>
            )}

            <div className="border-b border-border">
                <div className={`${containerClass} grid grid-cols-2 divide-x divide-border px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8`}>
                    {services.map((service, index) => (
                        <div key={index} className="flex items-center lg:gap-3 gap-2 px-2 lg:px-3 first:pl-0 last:pr-0 md:px-5">
                            <ImageViwer image={service.service_icon} alt={service.title} className="shrink-0 lg:text-2xl lg:h-8 lg:w-8 text-xl size-6 text-primary" />
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold lg:font-bold uppercase tracking-wide text-heading">{service.title}</p>
                                <p className="mt-1 truncate text-[10px] lg:text-[11px] text-res">{service.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${containerClass} px-4 pb-12 pt-8 sm:px-6 lg:pb-16 lg:px-8`}>
                {!data.main_slider && <HeroBanner />}
                {data.categories && (
                    <div className="mt-8 lg:mt-14">
                        <CategorySlider categories={data.categories} />
                    </div>
                )}
            </div>
            <div className='w-full'>
                <AdsRender type='main' placement='home_after_categories' className='w-full' />
            </div>
            <div className="relative z-10 w-full border-y border-border bg-white">
                <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                    {data.latest_products && (
                        <LatestProducts products={data.latest_products} />
                    )}
                </div>
            </div>
            {
                setting.layout.Home.shopping_benefits_toggle &&
                <AnimatedScrollSection data={setting.layout.Home.shopping_benefits} />
            }

            <div className="w-full overflow-hidden">
                <div className={``}>
                    {setting.layout.Home.banner_image_toggle && (
                        <div className="group mx-auto w-full overflow-hidden">
                            <ImageViwer
                                image={setting.layout.Home.banner_image}
                                className="w-full h-auto"
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 w-full border-y border-border bg-white">
                <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                    {data.trending_products && data.trending_products.length > 0 && (
                        <TrendingProducts products={data.trending_products} />
                    )}
                </div>
            </div>

            <Services />

            <div className="relative z-10 w-full border-y border-border bg-white">
                <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                    {data.popluar_products && (
                        <PopularProducts products={data.popluar_products} cardType={setting.layout.Home.popular_product_card_type} />
                    )}
                </div>
            </div>

            {/* Personalized "For You" Section */}
            {setting.layout.Home.products_for_you_toggle && data.for_you_products && data.for_you_products.length > 0 && (
                <div className="relative z-10 w-full border-b border-border bg-gradient-to-b from-primary/5 via-bg to-bg">
                    <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                        <ForYouProducts

                            products={data.for_you_products}
                            interestTags={data.matched_interests || []}
                            cardType={setting.layout.Home.products_for_you_card_type}
                        />
                    </div>
                </div>
            )}

            {/* Recently Viewed Products Section */}
            {setting.layout.Home.recently_viewed_toggle && data.recently_viewed_products && data.recently_viewed_products.length > 0 && (
                <div className="relative z-10 w-full border-b border-border bg-white">
                    <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                        <RecentlyViewedProducts
                            products={data.recently_viewed_products}
                            cardType={setting.layout.Home.products_recently_card_type}
                        />
                    </div>
                </div>
            )}

            {/* Latest Blogs Section */}
            {setting.layout.Home.blog_toggle && data.latest_blogs && data.latest_blogs.length > 0 && (
                <div className={`${containerClass} px-4 sm:px-6 lg:px-8 border-t border-border`}>
                    <LatestBlogs blogs={data.latest_blogs} />
                </div>
            )}

            <div className='w-full pt-5'>
                <div className={``}>
                    <AdsRender type='main' placement='home_bottom' className='w-full' />
                </div>
            </div>
            <div className='bg-white'>
                <BrandSlider />
            </div>

        </div>
    );
}

export default Index;

Index.layout = (page) => <FrontendLayout title="TechMarket Store">{page}</FrontendLayout>;
