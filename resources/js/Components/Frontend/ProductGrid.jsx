import React, { useEffect, useState, useRef } from 'react';
import ProductCard from '@/Components/ProductCard';
import { MOCK_PRODUCTS } from './mockProducts';
import { useLang } from '@/contexts/LanguageContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Responsive product grid using the settings-driven ProductCard (V1 or V2).
 */
export default function ProductGrid({
    products,
    title,
    subtitle,
    id = 'products',
    widthType = 100,
    className = '',
    useMockFallback = false,
    headingStyle = 'default',
}) {
    const titleRef = useRef(null);
    const textRef = useRef(null);
    const sectionRef = useRef(null);
    const { __ } = useLang();
    // Apply translations to default values if not provided
    const translatedTitle = title ? title : __('Featured Products');
    const translatedSubtitle = subtitle ? subtitle : __('Discover our hand-picked selection of top-rated products');
    const displayProducts =
        products?.length > 0 ? products : useMockFallback ? MOCK_PRODUCTS : [];

    if (displayProducts.length === 0) {
        return null;
    }
    const [classN, SetClassN] = useState("grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-8 gap-6 md:gap-8");
    useEffect(() => {
        if (widthType === 100) {
            SetClassN('grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-8 gap-6 md:gap-8');

        }
        if (widthType === 75) {
            SetClassN('grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6 md:gap-8');
        }
    }
        , [classN])

    console.log(widthType)
    const titleClass = headingStyle === 'underline'
        ? 'relative inline-block pb-2 text-2xl font-extrabold text-heading before:absolute before:-bottom-1 before:left-0 before:h-1 before:w-14 before:rounded-full before:bg-primary before:content-[""] md:text-3xl'
        : 'text-2xl font-extrabold tracking-tight text-heading md:text-4xl';

    const gridRef = useRef(null);

    useEffect(() => {
        if (!displayProducts.length) return;
        let ctx = gsap.context(() => {
            const chars = titleRef.current.querySelectorAll('.char');
            gsap.from(chars, {
                yPercent: "random(-200, 200)",
                rotation: "random(-20, 20)",
                opacity: 0,
                stagger: 0.02,
                ease: "back.out(1.2)",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 75%",
                    end: "top 20%",
                    scrub: 1
                }
            });

            // Text effect for description
            gsap.fromTo(textRef.current,
                { opacity: 0.4, filter: "blur(3px)", x: -50 },
                {
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 90%",
                        scrub: 1,
                        toggleActions: "play reverse play reverse",
                    },
                    opacity: 1,
                    filter: "blur(0px)",
                    x: 0,
                    duration: .4,
                    ease: "power2.out"
                }
            );

            // Animate cards staggering




        }, sectionRef);

        let ctx2 = gsap.context(() => {
            gsap.from('.product-card-gsap-wrapper', {
                scrollTrigger: {
                    trigger: gridRef.current,
                    start: "top 85%",
                    toggleActions: "play reverse play reverse",
                },
                y: 50,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power3.out",
                clearProps: "all"
            });
        }, gridRef);

        return () => ctx.revert() && ctx2.revert();
    }, [displayProducts]);
    const renderSplitText = (text) => {
        return text.split(' ').map((word, wordIndex) => (
            <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap mr-3">
                {word.split('').map((char, charIndex) => (
                    <span key={`char-${charIndex}`} className="char inline-block">
                        {char}
                    </span>
                ))}
            </span>
        ));
    };
    return (
        <section id={id} ref={sectionRef} className={`py-16 md:py-24 ${className}`}>
            <div className="mb-10 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between md:mb-12">
                <div className="max-w-2xl">
                    <h2 className={titleClass} ref={titleRef}>{renderSplitText(__(translatedTitle))}</h2>
                    {translatedSubtitle && (
                        <p ref={textRef} className="mt-4 text-sm leading-relaxed text-res md:text-base">
                            {__(translatedSubtitle)}
                        </p>
                    )}
                </div>
                <div className="flex items-center">
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                        {__(':count items', { count: displayProducts.length })}
                    </span>
                </div>
            </div>

            <div className={classN} ref={gridRef}>
                {displayProducts.map((product, index) => (
                    <div key={product.id ?? index} className="product-card-gsap-wrapper h-full">
                        <ProductCard product={product} className="h-full" />
                    </div>
                ))}
            </div>
        </section>
    );
}
