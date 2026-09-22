import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { usePage } from '@inertiajs/react';
import ProductTopSection from '@/Components/Single/ProductTopSection';
import SingleProductTabs from '@/Components/Single/Index';
import { RiInformationLine, RiInstagramLine, RiMapPin2Fill, RiShare2Line, RiShareLine, RiTwitterXLine, RiWhatsappLine } from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import ProductGrid from '@/Components/Frontend/ProductGrid';
import LatestProductSlider from '@/Components/Frontend/LatestProductSlider';
import { FaFacebookF, FaRegCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';
const SingleProduct = ({ product, latest_products, related_products = [], popular_products = [] }) => {
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
                    <div className='md:w-3/4'>
                        <SingleProductTabs product={product} />
                    </div>
                    <div className='flex-1 sticky top-20 right-0'>
                        <div className='w-full bg-white p-4 mb-4'>
                            <h1 className='text-base font-semibold mb-4'>{__('Available in your area')}</h1>
                            <div className='flex items-start  gap-2'>
                                <RiMapPin2Fill size={16} className='mt-0.5' />
                                <div>
                                    <h1 className='text-base font-medium text-primary'>{__('Location')}</h1>
                                    <p className='text-sm'>{product.meta.address.value}, {product.city?.title}, {product.state.title}</p>
                                </div>
                            </div>
                        </div>
                        <div className='w-full'>
                            <div className='w-full bg-white p-4'>
                                <h5 className='text-base font-semibold mb-4 flex items-center '><RiInformationLine className='inline mr-2 text-lg text-primary' /> {__('Information')}</h5>
                                <p className='text-sm font-medium italic text-accent'>
                                    {__('The final price includes applicable category-based taxes and active discounts. Please review your cart total before proceeding to checkout to ensure all promotional rates are correctly applied.')}
                                </p>
                            </div>
                        </div>
                        <div className='mt-4 w-full'>
                            <div className='bg-white p-4 w-full'>
                                <h5 className='text-base font-semibold mb-4 flex items-center'>
                                    <RiShareLine className='inline mr-2 text-lg text-primary' /> {" "} {
                                        __('Share')
                                    }
                                </h5>
                                <div className='flex gap-4'>
                                    <button onClick={() => shareProduct(window.location.href, 'copy')} className='bg-bg p-2 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <FaRegCopy size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'facebook')} className='bg-bg p-2 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <FaFacebookF size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'twitter')} className='bg-bg p-2 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <RiTwitterXLine size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'whatsapp')} className='bg-bg p-2 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <RiWhatsappLine size={14} />
                                    </button>
                                    <button onClick={() => shareProduct(window.location.href, 'instagram')} className='bg-bg p-2 cursor-pointer rounded-full hover:bg-primary hover:text-white transition-all duration-300'>
                                        <RiInstagramLine size={14} />
                                    </button>
                                </div>
                                <div className='mt-6'>
                                    <p className='text-xs font-medium italic text-accent'>
                                        {__('Note: ') + __("You can't share the product if it is not published")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div className='w-full py-5 bg-white relative z-20'>
                <div className={`${setting.width_layout == "container" ? 'container mx-auto' : 'w-full'} p-5 flex gap-5`}>
                    <div className='flex flex-3/4 flex-col gap-5'>
                        <div className='w-full'>

                            {related_products?.length > 0 && (
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

                            {popular_products?.length > 0 && (
                                <ProductGrid
                                    widthType={75}
                                    products={popular_products}
                                    title={__('Popular Products')}
                                    subtitle=""
                                    headingStyle="underline"
                                />
                            )}
                        </div>
                    </div>
                    <div className='flex-1/4'>
                        {latest_products && <LatestProductSlider products={latest_products} title={__('Latest Products')} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SingleProduct;
SingleProduct.layout = (page) => <FrontendLayout children={page} />;