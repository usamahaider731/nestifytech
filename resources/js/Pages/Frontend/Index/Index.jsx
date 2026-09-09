import React from 'react';
import { usePage } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import MainSlider from '@/Components/Index/MainSlider';
import CategorySlider from '@/Components/Index/CategorySlider';
import LatestProducts from '@/Components/Index/LatestProducts';
import ImageViwer from '@/Components/Admin/ImageViwer';
import HeroBanner from '@/Components/Frontend/HeroBanner';

function Index({ data }) {
    const { setting } = usePage().props;
    const containerClass =
        setting.layout.Home.container_type === 'container' ? 'container mx-auto' : 'w-full';

    return (
        <div className="w-full bg-slate-50 min-h-screen font-sans">
            {/* Main Carousel with subtle shadow & rounding */}
            {data.main_slider && (
                <div className=" mb-12">
                    <MainSlider data={data.main_slider} />
                </div>
            )}
            {/* Top Section: Sliders & Categories */}
            <div className={`${containerClass} px-4 sm:px-6 lg:px-8 pt-6 pb-12 md:pb-20`}>


                {/* Categories Slider */}
                {data.categories && (
                    <div className="mt-12 md:mt-16">
                        <CategorySlider categories={data.categories} />
                    </div>
                )}
            </div>

            {/* Middle Section: Products (White Background for contrast) */}
            <div className="bg-white w-full border-y border-slate-100 shadow-sm relative z-10">
                <div className={`${containerClass} px-4 sm:px-6 lg:px-8`}>
                    {data.latest_products && (
                        <LatestProducts products={data.latest_products} />
                    )}
                </div>
            </div>

            {/* Bottom Section: Promotional Banner */}
            <div className="bg-slate-50 w-full py-16 md:py-24 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className={`${containerClass} px-4 sm:px-6 lg:px-8 relative z-10`}>
                    {setting.layout.Home.banner_image_toggle && (
                        <div className="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.12)] transition-shadow duration-500 group">
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
