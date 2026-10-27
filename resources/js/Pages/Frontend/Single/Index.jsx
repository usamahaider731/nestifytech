import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { usePage } from '@inertiajs/react';
import ProductTopSection from '@/Components/Single/ProductTopSection';
import SingleProductTabs from '@/Components/Single/Index';
import { RiInformationLine, RiInstagramLine, RiMapPin2Fill, RiShare2Line, RiShareLine, RiTwitterXLine, RiWhatsappLine, RiShieldCheckLine, RiExchangeFundsLine, RiBankCardLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import { FaFacebookF, FaRegCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LatestProductSide from '@/Components/Frontend/LatestProductSide';
import SidebarAds from '@/Components/Single/SidebarAds';
import BottomAds from '@/Components/Single/BottomAds';
const SingleProduct = ({ product, latest_product, related_products = [], popular_products = [] }) => {
    const setting = usePage().props.setting.layout.Single
    const { __ } = useLang();
    const shareProduct = (link, type) => {
        // ... switch statement omitted for brevity ...
        switch (type) {
            case 'copy':
                navigator.clipboard.writeText(link);
                toast.success('Link copied to clipboard');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${link}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${link}`, '_blank');
                break;
            case 'instagram':
                window.open(`https://www.instagram.com/sharer/sharer.php?u=${link}`, '_blank');
                break;
            default:
                break;
        }
    }

    const pageRef = useRef(null);
    const locationName = [
        product?.store?.address,
        product?.store?.city,
        product?.store?.state,
        product?.store?.country,
        product?.meta?.address?.value,
        ...(Array.isArray(product?.city) ? product.city.map(c => c?.title) : [product?.city?.title]),
        ...(Array.isArray(product?.state) ? product.state.map(s => s?.title) : [product?.state?.title]),
        ...(Array.isArray(product?.country) ? product.country.map(c => c?.title) : [product?.country?.title || product?.meta?.country?.value]),
    ].filter(Boolean).join(', ');
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(locationName)}&t=k&z=17&output=embed`;

    useEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from('.animate-section', {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                clearProps: 'all' // removes inline styles after animation
            });
        }, pageRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={pageRef} className='flex flex-col relative'>
            <div className={`transition-all duration-500 bg-white ${setting.width_layout == "container" ? 'container mx-auto' : ''} p-5 flex flex-col`}>
                <div className='flex w-full'>
                    <ProductTopSection product={product} />
                </div>
            </div>
            <div className='w-full bg-bg'>
                <div className={`${setting.width_layout == "container" ? 'container mx-auto' : ''} p-5 gap-10 flex flex-col relative md:flex-row`}>
                    <div className='md:w-3/4 flex flex-col gap-5'>
                        <SingleProductTabs product={product} />
                        {setting.address &&
                            <div className='w-full'>
                                <iframe
                                    title={`Map for ${locationName}`}
                                    src={mapUrl}
                                    className="h-100 w-full rounded-lg border-0"
                                    loading="lazy"
                                    allowFullScreen
                                />
                            </div>
                        }
                    </div>
                    <div className='flex-1 sticky top-20 h-fit right-0 flex flex-col gap-4'>
                        {/* Location & Country Availability */}
                        {setting.address && (
                            <div className='w-full bg-white p-4 shadow-xs rounded border border-border/50'>
                                <h1 className='text-base font-semibold mb-3 text-heading'>{__('Available in your area')}</h1>
                                <div className='flex items-start gap-2.5'>
                                    <RiMapPin2Fill size={24} className='mt-0.5 text-secondary shrink-0' />
                                    <div className='flex flex-col gap-2 flex-1'>
                                        <h2 className='text-sm font-semibold text-primary'>{__('Location & Coverage')}</h2>

                                        {/* Assigned Store */}
                                        {product?.store && (
                                            <div className='flex flex-col gap-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20'>
                                                <span className='text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1'>
                                                    <span>🏪</span> {__('Fulfilled by Store / Branch')}
                                                </span>
                                                <span className='text-xs font-semibold text-heading'>{product.store.title}</span>
                                                {product.store.address && (
                                                    <span className='text-[11px] text-res leading-tight'>📍 {product.store.address}</span>
                                                )}
                                                {(product.store.city || product.store.state) && (
                                                    <span className='text-[11px] text-res leading-tight'>
                                                        {[product.store.city, product.store.state, product.store.country].filter(Boolean).join(', ')}
                                                    </span>
                                                )}
                                                {product.store.phone && (
                                                    <span className='text-[11px] text-primary leading-tight font-medium'>📞 {product.store.phone}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Countries */}
                                        {(() => {
                                            const countries = Array.isArray(product.country)
                                                ? product.country
                                                : product.country ? [product.country] : (product.store?.country ? [{ title: product.store.country }] : []);
                                            return countries.length > 0 && (
                                                <div className='flex flex-col gap-1'>
                                                    <span className='text-[11px] font-semibold text-res uppercase tracking-wide'>{__('Country')}</span>
                                                    <div className='flex flex-wrap gap-1.5'>
                                                        {countries.map((c, i) => (
                                                            <span key={i} className='text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium'>
                                                                {c?.title ?? c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* States */}
                                        {(() => {
                                            const states = Array.isArray(product.state)
                                                ? product.state
                                                : product.state ? [product.state] : (product.store?.state ? [{ title: product.store.state }] : []);
                                            return states.length > 0 && (
                                                <div className='flex flex-col gap-1'>
                                                    <span className='text-[11px] font-semibold text-res uppercase tracking-wide'>{__('State / Province')}</span>
                                                    <div className='flex flex-wrap gap-1.5'>
                                                        {states.map((s, i) => (
                                                            <span key={i} className='text-[11px] bg-secondary/10 text-secondary px-2 py-0.5 rounded font-medium'>
                                                                {s?.title ?? s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Cities */}
                                        {(() => {
                                            const cities = Array.isArray(product.city)
                                                ? product.city
                                                : product.city ? [product.city] : (product.store?.city ? [{ title: product.store.city }] : []);
                                            return cities.length > 0 ? (
                                                <div className='flex flex-col gap-1'>
                                                    <span className='text-[11px] font-semibold text-res uppercase tracking-wide'>{__('Cities')}</span>
                                                    <div className='flex flex-wrap gap-1.5'>
                                                        {cities.map((c, i) => (
                                                            <span key={i} className='text-[11px] bg-bg border border-border text-heading px-2 py-0.5 rounded font-medium'>
                                                                {c?.title ?? c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className='text-xs text-text leading-relaxed'>{__('Nationwide Delivery Available')}</p>
                                            );
                                        })()}

                                        {/* Street address if any */}
                                        {(product.meta?.address?.value || product.store?.address) && (
                                            <p className='text-[11px] text-res mt-1 leading-relaxed'>
                                                📍 {product.meta?.address?.value || product.store?.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Services, Warranty, Exchange & Installment */}
                        {(product.meta?.warranty?.value || product.meta?.exchange?.value || product.meta?.installment?.value) && (
                            <div className='w-full bg-white p-4 shadow-xs rounded border border-border/50'>
                                <h5 className='text-base font-semibold mb-3 text-heading flex items-center gap-2'>
                                    <RiShieldCheckLine className='text-primary text-lg shrink-0' />
                                    {__('Services & Policy')}
                                </h5>
                                <div className='flex flex-col gap-3 text-xs'>
                                    {product.meta?.warranty?.value && (
                                        <div className='flex items-start gap-2.5 p-2.5 rounded bg-bg/80 border border-border/40'>
                                            <RiShieldCheckLine className='text-emerald-600 text-base shrink-0 mt-0.5' />
                                            <div>
                                                <span className='font-semibold text-heading block'>{__('Warranty')}</span>
                                                <span className='text-res leading-relaxed'>{product.meta.warranty.value}</span>
                                            </div>
                                        </div>
                                    )}

                                    {product.meta?.exchange?.value && (
                                        <div className='flex items-start gap-2.5 p-2.5 rounded bg-bg/80 border border-border/40'>
                                            <RiExchangeFundsLine className='text-blue-600 text-base shrink-0 mt-0.5' />
                                            <div>
                                                <span className='font-semibold text-heading block'>{__('Exchange / Return')}</span>
                                                <span className='text-res leading-relaxed'>{product.meta.exchange.value}</span>
                                            </div>
                                        </div>
                                    )}

                                    {product.meta?.installment?.value && (
                                        <div className='flex items-start gap-2.5 p-2.5 rounded bg-bg/80 border border-border/40'>
                                            <RiBankCardLine className='text-amber-600 text-base shrink-0 mt-0.5' />
                                            <div>
                                                <span className='font-semibold text-heading block'>{__('Installment Plan')}</span>
                                                <span className='text-res leading-relaxed'>{product.meta.installment.value}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order & Price Information */}
                        {setting.information && (
                            <div className='w-full bg-white p-4 shadow-xs rounded border border-border/50'>
                                <h5 className='text-base font-semibold mb-3 flex items-center gap-2 text-heading'>
                                    <RiInformationLine className='text-primary text-lg shrink-0' />
                                    {__('Pricing & Discounts')}
                                </h5>
                                <p className='text-xs font-medium text-res leading-relaxed'>
                                    {__('The final price includes applicable category-based taxes and active discounts. Please review your cart total before proceeding to checkout to ensure all promotional rates are correctly applied.')}
                                </p>
                            </div>
                        )}

                        {/* Share Product */}
                        {setting.share && (
                            <div className='w-full bg-white p-4 shadow-xs rounded border border-border/50'>
                                <h5 className='text-base font-semibold mb-3 flex items-center gap-2 text-heading'>
                                    <RiShareLine className='text-primary text-lg shrink-0' />
                                    {__('Share')}
                                </h5>
                                <div className='flex gap-3 flex-wrap'>
                                    <button onClick={() => shareProduct(window.location.href, 'copy')} title={__('Copy Link')} className='bg-bg p-2.5 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <FaRegCopy size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'facebook')} title="Facebook" className='bg-bg p-2.5 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <FaFacebookF size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'twitter')} title="Twitter / X" className='bg-bg p-2.5 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <RiTwitterXLine size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'whatsapp')} title="WhatsApp" className='bg-bg p-2.5 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <RiWhatsappLine size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'instagram')} title="Instagram" className='bg-bg p-2.5 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <RiInstagramLine size={14} />
                                    </button>
                                </div>
                                <div className='mt-4'>
                                    <p className='text-[11px] font-medium italic text-res'>
                                        {__('Note: ') + __("You can't share the product if it is not published")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            <div className='w-full py-5 bg-white relative z-20'>
                <div className={`${setting.width_layout == "container" ? 'container mx-auto' : 'w-full'} p-5 flex gap-10`}>
                    <div className='flex w-3/4 flex-col gap-5'>
                        <div className='w-full'>

                            {setting.similar && related_products?.length > 0 && (
                                <ProductGrid
                                    widthType={75}
                                    products={related_products}
                                    title={__('Related Products')}
                                    subtitle=""
                                    headingStyle="underline"
                                />
                            )}
                        </div>

                        <div className='w-full'>

                            {setting.popular && popular_products?.length > 0 && (
                                <ProductGrid
                                    widthType={75}
                                    products={popular_products}
                                    title={__('Popular Products')}
                                    subtitle=""
                                    headingStyle="underline"
                                />
                            )}
                        </div>
                        <div className='w-full'>
                            <BottomAds />
                        </div>
                    </div>
                    <div className='flex-1 h-full sticky top-0'>
                        <SidebarAds />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SingleProduct;
SingleProduct.layout = (page) => <FrontendLayout children={page} />;