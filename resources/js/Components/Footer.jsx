import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LiaHeadsetSolid } from "react-icons/lia";
import { IoMdPaperPlane } from "react-icons/io";
import { 
    FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiMail, FiPhone, 
    FiMapPin, FiArrowUp, FiShieldOff, FiSend, FiCheckCircle,
    FiTruck, FiRefreshCw, FiHeadphones, FiLock
} from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcApplePay, FaFacebookF, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import ImageViwer from './Admin/ImageViwer';
import { RiArrowUpLine, RiArrowUpSLine, RiArrowUpWideLine, RiInstagramFill, RiLinkedinBoxFill, RiPinterestFill, RiTwitterXFill, RiWhatsappFill, RiWhatsappLine, RiYoutubeFill } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';

const Footer = () => {
    const { setting, auth } = usePage().props;
    const { __ } = useLang();
    const siteName = setting?.site?.name?.value ?? 'TechMarket';

    const scrollToTop = () => {
        window.scrollTo({ top: 0 });
    };
    const FooterSetting= setting.layout.Footer;
    const logo_path = setting.site[FooterSetting.footer_logo].value 
    const socialLinks = [
        { icon: <FaFacebook />, href: '#', name: 'Facebook', color: "" },
        { icon: <RiTwitterXFill />, href: '#', name: 'Twitter' },
        { icon: <RiInstagramFill />, href: '#', name: 'Instagram' },
        { icon: <RiYoutubeFill />, href: '#', name: 'YouTube' },
        { icon: <RiWhatsappLine />, href: '#', name: 'WhatsApp' },
        { icon: <RiPinterestFill />, href: '#', name: 'Pintrest' },
        { icon: <RiLinkedinBoxFill />, href: '#', name: 'LinkedIn' },
    ];

    const quickLinks = [
        __('Laptops & Computers'),
        __('Cameras & Photography'),
        __('Smart Phones & Tablets'),
        __('Video Games & Consoles'),
        __('TV & Audio'),
        __('Gadgets & Electronics'),
        __('Car Electronic & GPS')
    ];

    const careLinks = [
        __('My Account'),
        __('Order Tracking'),
        __('Wish List'),
        __('Customer Service'),
        __('Returns / Exchange'),
        __('FAQs'),
        __('Product Support')
    ];

    const infoLinks = [
        __('About Us'),
        __('Contact Us'),
        __('All Collections'),
        __('Privacy Policy'),
        __('Terms & Conditions'),
        __('Blog'),
        __('Site Map')
    ];

    const trustBadges = [
        { icon: FiShieldOff, label: 'Secure payment' },
        { icon: FiTruck, label: 'Fast shipping' },
        { icon: FiRefreshCw, label: 'Easy returns' },
        { icon: FiHeadphones, label: '24/7 support' }
    ];

    return (
        <footer className="relative overflow-hidden border-t-4 border-[#fed700] bg-bg text-gray-300">

            <div className="relative border-b border-gray-700/60 bg-primary">
                <div className="container mx-auto px-5 py-3">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fed700] text-2xl font-bold text-slate-900">
                                <IoMdPaperPlane className='' size={32} />
                            </div>
                            <span className="text-xl font-medium text-text">
                                   {__('Sign up to Newsletter')}
                            </span>
                        </div>

                        <form onSubmit={(e) => e.preventDefault()} className="flex overflow-hidden rounded-full bg-white">
                            <input
                                type="email"
                                placeholder={__('Enter your email address')}
                                    className="w-80 bg-transparent border-none outline-none ring-0 px-5 h-10.5 text-base text-text placeholder:text-text/70 focus:outline-none"
                                required
                            />
                            <button
                                type="submit"
                                className="flex text-white items-center bg-dynamic gap-2 whitespace-nowrap px-6 h-10.5 text-xs font-extrabold uppercase tracking-[0.15em] text-slate-900 transition-colors cursor-pointer"
                            >
                               {auth.user ? __('Subscribe') : __('Sign up')} <FiSend />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="relative container mx-auto px-6 py-14">

                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-4">
                        <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white">
                          <ImageViwer image={logo_path} />
                        </Link>

                        <div className="space-y-4">
                            <p className="max-w-sm text-sm leading-7 text-gray-400">
                                {__('Premium tech essentials designed for everyday life, delivered with fast support and reliable quality.')}
                            </p>

                            <div className="flex gap-4">
                            <LiaHeadsetSolid className='size-13 text-primary' />

                                <div className='flex flex-col'>
                                <p className="text-sm text-text">{__('Got Questions ? Call us 24/7!')}</p>
                                <div className="mt-2 text-2xl font-medium text-heading">{setting.site.phone.value}</div>
                            </div></div>

                            <div className="flex flex-col items-start gap-3 text-sm text-text">
                                <div className="mt-1 flex items-center justify-center text-heading  font-medium">
                                   {__('Contact Info')}
                                </div>
                                <span>{setting.site.address.value}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 pt-2">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    aria-label={social.name}
                                    className="flex items-center text-[24px] justify-center  transition-colors text-accent"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="mb-5 inline-block pb-2 text-sm font-bold uppercase text-heading">
                            {__('Find it fast')}
                        </h4>
                        <ul className="space-y-2.5 text-sm text-text">
                            {quickLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link href="#" className="transition-colors duration-200 hover:text-primary">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="mb-5 inline-block pb-2 text-sm font-extrabold uppercase text-heading">
                            {__('Customer care')}
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            {careLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link href="#" className="text-text font-normal transition-colors duration-200 hover:text-primary">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="mb-5 inline-block pb-2 text-sm font-bold uppercase text-heading">
                            {__('Information')}
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            {infoLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link href="#" className="text-text transition-colors duration-200 hover:text-primary">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="relative border-t bg-common">
                <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-2 text-sm text-gray-400 md:flex-row">
                    <p>
                        © {new Date().getFullYear()} <span className="font-bold text-heading">{siteName}</span>. {__('All Rights Reserved.')}
                    </p>

                    <div className="flex items-center gap-3 text-2xl text-gray-400">
                        <ImageViwer image={'/assets/image/patment-icon1.webp'} />
                    </div>

                    <button
                        onClick={scrollToTop}
                        aria-label={__('Scroll to top')}
                        className="flex h-10 w-10 z-30 fixed bottom-10 right-10 cursor-pointer hover:text-white items-center justify-center rounded-full text-primary bg-white border-2 border-primary transition-colors hover:bg-[#fed700] hover:text-slate-900"
                    >
                        <RiArrowUpSLine className='text-sm size-5' />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
