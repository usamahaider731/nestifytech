import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiMail, FiPhone, 
    FiMapPin, FiArrowUp, FiShieldOff, FiSend, FiCheckCircle,
    FiTruck, FiRefreshCw, FiHeadphones, FiLock
} from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcApplePay } from 'react-icons/fa';

const Footer = () => {
    const { setting } = usePage().props;
    const siteName = setting?.site?.name?.value ?? 'TechMarket';

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-[#2c3e50] text-gray-300 font-sans border-t-4 border-[#fed700] mt-16">
            
            {/* 1. TechMarket Newsletter Banner */}
            <div className="bg-[#333e48] py-8 border-b border-gray-700/60">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#fed700] flex items-center justify-center text-slate-900 text-2xl font-bold">
                                <FiMail />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                                    Sign Up For Newsletter
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    ...and receive <span className="text-[#fed700] font-bold">$20 coupon</span> for first shopping
                                </p>
                            </div>
                        </div>

                        <form onSubmit={(e) => e.preventDefault()} className="flex w-full lg:w-auto max-w-md">
                            <input 
                                type="email" 
                                placeholder="Enter your email address..." 
                                className="w-full px-5 py-3.5 rounded-l-full bg-white text-gray-800 placeholder-gray-400 focus:outline-none text-sm font-medium border-0"
                                required
                            />
                            <button 
                                type="submit" 
                                className="px-8 py-3.5 rounded-r-full bg-[#fed700] hover:bg-yellow-400 text-slate-900 font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap shadow-md"
                            >
                                Subscribe <FiSend />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* 2. Main Footer Links */}
            <div className="container mx-auto px-6 py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
                    
                    {/* Brand Column (4 cols) */}
                    <div className="lg:col-span-4 space-y-5">
                        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-white uppercase tracking-tight">
                            <span className="w-9 h-9 rounded-lg bg-[#fed700] text-slate-900 flex items-center justify-center font-black">TM</span>
                            Tech<span className="text-[#fed700]">Market</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                            Got Question? Call us 24/7!
                        </p>
                        <div className="text-2xl font-extrabold text-[#fed700]">
                            (800) 8001-8588, (0600) 874 548
                        </div>

                        <div className="space-y-2 text-xs text-gray-400">
                            <p className="font-semibold text-white">Contact Info:</p>
                            <p>17 Princess Road, London, Greater London NW1 8JR, UK</p>
                        </div>

                        {/* Social Icons */}
                        <div className="flex items-center gap-2 pt-2">
                            {[
                                { icon: <FiFacebook />, href: "#", name: "Facebook" },
                                { icon: <FiTwitter />, href: "#", name: "Twitter" },
                                { icon: <FiInstagram />, href: "#", name: "Instagram" },
                                { icon: <FiYoutube />, href: "#", name: "YouTube" }
                            ].map((social, index) => (
                                <a 
                                    key={index} 
                                    href={social.href}
                                    aria-label={social.name}
                                    className="w-9 h-9 rounded-full bg-[#3e5165] flex items-center justify-center text-gray-300 hover:text-slate-900 hover:bg-[#fed700] transition-colors"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Find It Fast (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="text-white font-bold text-base border-b-2 border-[#fed700] pb-2 inline-block uppercase text-xs tracking-wider">
                            Find It Fast
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            {['Laptops & Computers', 'Cameras & Photography', 'Smart Phones & Tablets', 'Video Games & Consoles', 'TV & Audio', 'Gadgets & Electronics', 'Car Electronic & GPS'].map((link, idx) => (
                                <li key={idx}>
                                    <Link href="#" className="text-gray-400 hover:text-[#fed700] transition-colors">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Care (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="text-white font-bold text-base border-b-2 border-[#fed700] pb-2 inline-block uppercase text-xs tracking-wider">
                            Customer Care
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            {['My Account', 'Order Tracking', 'Wish List', 'Customer Service', 'Returns / Exchange', 'FAQs', 'Product Support'].map((link, idx) => (
                                <li key={idx}>
                                    <Link href="#" className="text-gray-400 hover:text-[#fed700] transition-colors">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Info (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-white font-bold text-base border-b-2 border-[#fed700] pb-2 inline-block uppercase text-xs tracking-wider">
                            Information
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            {['About Us', 'Contact Us', 'All Collections', 'Privacy Policy', 'Terms & Conditions', 'Blog', 'Site Map'].map((link, idx) => (
                                <li key={idx}>
                                    <Link href="#" className="text-gray-400 hover:text-[#fed700] transition-colors">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            {/* 3. Bottom Copyright Bar */}
            <div className="bg-[#243342] py-6 border-t border-gray-700/50">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                    <p>© {new Date().getFullYear()} <span className="text-white font-bold">TechMarket</span>. All Rights Reserved.</p>
                    
                    {/* Payment Gateways */}
                    <div className="flex items-center gap-3 text-2xl text-gray-400">
                        <FaCcVisa className="hover:text-white transition-colors" title="Visa" />
                        <FaCcMastercard className="hover:text-white transition-colors" title="MasterCard" />
                        <FaCcPaypal className="hover:text-[#fed700] transition-colors" title="PayPal" />
                        <FaCcApplePay className="hover:text-white transition-colors" title="Apple Pay" />
                    </div>

                    {/* Scroll to top */}
                    <button 
                        onClick={scrollToTop}
                        aria-label="Scroll to top"
                        className="w-8 h-8 rounded bg-[#333e48] hover:bg-[#fed700] hover:text-slate-900 flex items-center justify-center transition-colors text-gray-300"
                    >
                        <FiArrowUp />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
