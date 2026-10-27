import React, { useEffect, useState } from 'react';
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
import { RiArrowUpLine, RiArrowUpSLine, RiArrowUpWideLine, RiInstagramFill, RiLinkedinBoxFill, RiPinterestFill, RiTwitterXFill, RiWhatsappFill, RiWhatsappLine, RiYoutubeFill, RiGlobalLine } from 'react-icons/ri';
import { FaTiktok, FaXTwitter, FaYoutube, FaLinkedin, FaGithub, FaSnapchat, FaPinterest, FaDiscord } from 'react-icons/fa6';
import { useLang } from '@/contexts/LanguageContext';
import axios from 'axios';

const Footer = () => {
    const { setting, auth } = usePage().props;
    const { __ } = useLang();
    const siteName = setting?.site?.name?.value ?? 'TechMarket';

    const scrollToTop = () => {
        window.scrollTo({ top: 0 });
    };
    const [FooterMenuList, SetFooterMenuList] = useState({ name: '', menus: [] });
    const FooterSetting = setting.layout.Footer;
    const FooterMenu = FooterSetting.footer_menu_lists;
    useEffect(() => {
        if (!FooterMenu || FooterMenu.length === 0) return;

        const fetchPromises = FooterMenu.map((menu) =>
            axios.get(route('menu', { 'location': menu.menu_location }))
                .then((response) => ({
                    name: menu.title,
                    menus: response.data.map((item) => ({
                        title: item.name,
                        url: item.link
                    }))
                }))
        );

        Promise.all(fetchPromises)
            .then((completedMenus) => {
                SetFooterMenuList(completedMenus);
            })
            .catch((error) => {
                console.error('Failed to load footer menus:', error);
            });
    }, [FooterMenu]);
    const logo_path = setting.site[FooterSetting.footer_logo]?.value;

    // Platform icon map
    const platformIcons = {
        facebook: <FaFacebook size={18} />,
        instagram: <FaInstagram size={18} />,
        tiktok: <FaTiktok size={18} />,
        twitter: <FaXTwitter size={18} />,
        x: <FaXTwitter size={18} />,
        youtube: <FaYoutube size={18} />,
        linkedin: <FaLinkedin size={18} />,
        github: <FaGithub size={18} />,
        snapchat: <FaSnapchat size={18} />,
        pinterest: <FaPinterest size={18} />,
        discord: <FaDiscord size={18} />,
        whatsapp: <RiWhatsappLine size={18} />,
    };

    // Parse dynamic social media from setting.site.social_media
    const rawSiteSocial = setting?.site?.social_media?.value;
    let parsedSiteSocial = [];
    if (Array.isArray(rawSiteSocial)) {
        parsedSiteSocial = rawSiteSocial;
    } else if (typeof rawSiteSocial === 'string' && rawSiteSocial.startsWith('[')) {
        try {
            parsedSiteSocial = JSON.parse(rawSiteSocial);
        } catch (e) { }
    }

    // Filter active social media items
    const dynamicSocialLinks = parsedSiteSocial
        .filter((item) => (item.status === undefined || item.status === '1' || item.status === 1 || item.status === true) && item.url)
        .map((item) => {
            const key = (item.platform || '').toLowerCase().trim();
            return {
                name: item.title || item.platform,
                href: item.url,
                icon: platformIcons[key] || (item.icon ? <i className={item.icon} /> : <RiGlobalLine size={18} />),
            };
        });

    const fallbackSocialLinks = [
        { icon: <FaFacebook size={18} />, href: '#', name: 'Facebook' },
        { icon: <FaXTwitter size={18} />, href: '#', name: 'Twitter' },
        { icon: <FaInstagram size={18} />, href: '#', name: 'Instagram' },
        { icon: <FaYoutube size={18} />, href: '#', name: 'YouTube' },
        { icon: <RiWhatsappLine size={18} />, href: '#', name: 'WhatsApp' },
    ];

    const socialLinks = dynamicSocialLinks.length > 0 ? dynamicSocialLinks : fallbackSocialLinks;

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

                <div className="grid gap-10 grid-cols-1 sm:grid-cols-4 lg:grid-cols-13">
                    <div className="space-y-6 sm:col-span-4 lg:col-span-4">
                        <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white">
                            <ImageViwer image={logo_path} className='max-w-40' />
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

                        <div className="flex items-center flex-wrap gap-3.5 pt-2">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.name}
                                    title={social.name}
                                    className="flex items-center justify-center size-9 rounded-full bg-border/20 text-accent hover:text-white hover:bg-primary transition-all text-base shadow-2xs"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {Array.isArray(FooterMenuList) && FooterMenuList.length > 0 ? (
                        FooterMenuList.map((menu, index) => (
                            <div key={index} className="lg:col-span-3 sm:col-span-2">
                                <h4 className="mb-5 inline-block pb-2 text-sm font-bold uppercase text-heading">
                                    {menu.name}
                                </h4>
                                <ul className="space-y-2.5 text-sm text-text">
                                    {menu?.menus?.map((link, idx) => (
                                        <li key={idx}>
                                            <Link href={link.url || link.link || '#'} className="transition-colors duration-200 hover:text-primary">
                                                {link.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="lg:col-span-3">
                                <h4 className="mb-5 inline-block pb-2 text-sm font-bold uppercase text-heading">
                                    {__('Customer Care')}
                                </h4>
                                <ul className="space-y-2.5 text-sm text-text">
                                    <li>
                                        <Link href={route('faqs')} className="transition-colors duration-200 hover:text-primary font-medium text-primary">
                                            {__('Help & FAQs')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/blog" className="transition-colors duration-200 hover:text-primary">
                                            {__('Latest News & Blog')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/page/contact" className="transition-colors duration-200 hover:text-primary">
                                            {__('Customer Service')}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="lg:col-span-3">
                                <h4 className="mb-5 inline-block pb-2 text-sm font-bold uppercase text-heading">
                                    {__('Quick Links')}
                                </h4>
                                <ul className="space-y-2.5 text-sm text-text">
                                    <li>
                                        <Link href="/faqs" className="transition-colors duration-200 hover:text-primary">
                                            {__('Shipping & Returns')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/page/about" className="transition-colors duration-200 hover:text-primary">
                                            {__('About NestifyTech')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/page/privacy" className="transition-colors duration-200 hover:text-primary">
                                            {__('Privacy Policy')}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}
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
