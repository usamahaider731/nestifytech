import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import ProductCard from '@/Components/ProductCard';
import { useLang } from '@/contexts/LanguageContext';

/**
 * Simple slider that shows one product at a time.
 * Props:
 *  - products: array of product objects
 *  - title: optional section title (translated)
 *  - className: optional additional classes for the wrapper
 */
export default function LatestProductSlider({
    products = [],
    title = 'Latest Products',
    className = '',
}) {
    const { __ } = useLang();
    const [current, setCurrent] = useState(0);
    const containerRef = useRef(null);
    const sliderRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Gentle floating animation for the entire component
            gsap.to(containerRef.current, {
                y: -8,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut',
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    useEffect(() => {
        // Animate slide changes
        if (sliderRef.current) {
            gsap.to(sliderRef.current, {
                xPercent: -(current * 100),
                duration: 0.5,
                ease: "power2.out"
            });
        }
    }, [current]);
    if (!products || products.length === 0) {
        return null;
    }

    const total = products.length;
    const prev = () => setCurrent(prev => (prev - 1 + total) % total);
    const next = () => setCurrent(prev => (prev + 1) % total);

    return (
        <section ref={containerRef} className={`p-5 relative rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg border border-primary/20 ${className}`}>
            {/* Decorative blurs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl z-0 pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl z-0 pointer-events-none"></div>
            
            {title && (
                <div className="relative z-10 flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-heading">{__(title)}</h2>
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        {__('Hot')}
                    </span>
                </div>
            )}
            <div className="relative overflow-hidden z-10">
                <div ref={sliderRef} className="flex" style={{ transform: `translateX(0%)` }}>
                    {products.map((product, index) => (
                        <div key={product.id ?? index} className="w-full flex-shrink-0">
                            <ProductCard product={product} className='w-full shadow-m' />
                        </div>
                    ))}
                </div>
                <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-primary hover:text-white transition-colors rounded-full p-1.5 shadow-md z-20">
                    <RiArrowLeftSLine size={20} />
                </button>
                <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-primary hover:text-white transition-colors rounded-full p-1.5 shadow-md z-20">
                    <RiArrowRightSLine size={20} />
                </button>
            </div>
            <div className="mt-4 text-center text-xs font-semibold text-primary z-10 relative">
                <div className="inline-flex gap-1">
                    {products.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === current ? 'w-4 bg-primary' : 'w-1.5 bg-primary/30'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
