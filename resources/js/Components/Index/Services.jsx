import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import {
    RiTruckLine,
    RiSecurePaymentLine,
    RiRefund2Line,
    RiCustomerService2Line,
    RiShieldCheckLine,
    RiArrowRightLine,
    RiArrowRightSLine
} from 'react-icons/ri';
import { Link, usePage } from '@inertiajs/react';
import ImageViwer from '../Admin/ImageViwer';

const Services = () => {
    const { __ } = useLang();
    const { setting } = usePage().props
    const services = setting.layout.Home.services;
    console.log(services)
    // const services = [
    //     {
    //         icon: RiTruckLine,
    //         title: __('Fast Delivery'),
    //         full_description: __("Our dedicated customer service team is always ready to assist you with any inquiries or issues."),
    //         description: __('Experience lightning-fast shipping on all our premium products, delivered straight to your doorstep.'),
    //         image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=600&auto=format&fit=crop'
    //     },
    //     {
    //         icon: RiSecurePaymentLine,
    //         title: __('Secure Checkout'),
    //         full_description: __("Our dedicated customer service team is always ready to assist you with any inquiries or issues."),
    //         description: __('Shop with confidence using our state-of-the-art encrypted payment gateway for 100% secure transactions.'),
    //         image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop'
    //     },
    //     {
    //         icon: RiRefund2Line,
    //         title: __('Hassle-Free Returns'),
    //         full_description: __("Our dedicated customer service team is always ready to assist you with any inquiries or issues."),
    //         description: __('Not satisfied? Return your products easily within 30 days for a full refund, no questions asked.'),
    //         image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop'
    //     },
    //     {
    //         icon: RiCustomerService2Line,
    //         title: __('24/7 Support'),
    //         full_description: __("Our dedicated customer service team is always ready to assist you with any inquiries or issues."),
    //         description: __('Our dedicated customer service team is always ready to assist you with any inquiries or issues.'),
    //         image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=600&auto=format&fit=crop'
    //     },
    // ];

    return (
        <div className="w-full bg-white py-16 md:py-24 border-y border-border relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl -z-10"></div>

            <div className="container mx-auto px-5">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                        <RiShieldCheckLine className="text-primary text-xl" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-heading font-poppins mb-4">
                        {__('Why Choose Us?')}
                    </h2>
                    <p className="text-res text-base">
                        {__('We go above and beyond to provide you with the best shopping experience, premium quality, and unmatched reliability.')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {services.map((service, index) => {
                        return (
                            <div
                                key={index}
                                className="group relative overflow-hidden h-[450px] text-center flex flex-col items-center justify-center cursor-pointer border border-border hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20"
                            >
                                {/* Background Image with Zoom and Rotate effect */}
                                <div className="absolute inset-0 w-full h-full">
                                    <ImageViwer
                                        image={service.service_background_image}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-125 group-hover:rotate-2"
                                    />
                                </div>

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 group-hover:from-black/95 group-hover:via-black/70 group-hover:to-black/50 transition-colors duration-500"></div>

                                {/* Content */}
                                <div className="absolute z-10 p-6 flex flex-col items-center h-full w-full justify-between transition-transform duration-500 group-hover:-translate-x-full">
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md shadow-sm border border-white/20 flex items-center justify-center mt-4 group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-500 group-hover:rotate-[360deg]">
                                        <ImageViwer image={service.service_icon} alt={service.title} className="size-3/4 text-white fill-white" />
                                    </div>
                                    <div className="mt-auto w-full flex flex-col items-center">
                                        <h3 className="text-xl font-bold font-poppins text-white mb-2">{service.title}</h3>
                                        <p className="text-sm text-gray-300 mb-6 leading-relaxed opacity-90">{service.description}</p>
                                    </div>
                                </div>
                                <div className='relative z-11 flex flex-col items-center justify-center p-6 h-full translate-x-full transition-transform duration-500 group-hover:-translate-x-0'>
                                    <p className='text-base font-medium font-roboto text-white'>{service.description}</p>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Services;
