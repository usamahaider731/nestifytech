import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useLang } from '@/contexts/LanguageContext';

export default function PromoAnimation() {
    const { __ } = useLang();
    const containerRef = useRef(null);
    const boxRef = useRef(null);
    const textRef = useRef(null);
    const badgeRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Floating animation for the whole box
            gsap.to(boxRef.current, {
                y: -10,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut',
            });

            // Badge pulse animation
            gsap.to(badgeRef.current, {
                scale: 1.1,
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            // Entrance animation
            gsap.from([boxRef.current, textRef.current, badgeRef.current], {
                opacity: 0,
                y: 30,
                duration: 1,
                stagger: 0.2,
                ease: 'back.out(1.7)',
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full flex justify-center sticky top-20">
            <div
                ref={boxRef}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-secondary p-1 shadow-2xl"
            >
                <div className="bg-white dark:bg-bg rounded-xl h-full p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>

                    <div
                        ref={badgeRef}
                        className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider shadow-lg z-10"
                    >
                        {__('Limited Offer')}
                    </div>

                    <h3
                        ref={textRef}
                        className="text-xl md:text-2xl font-extrabold text-heading mb-2 z-10"
                    >
                        {__('Free Delivery')}
                    </h3>

                    <p className="text-res text-sm z-10 mb-5">
                        {__('On all orders over $100. Upgrade your tech today without extra costs.')}
                    </p>

                    <button className="z-10 w-full py-2.5 bg-heading hover:bg-primary text-white rounded-lg font-semibold transition-colors duration-300">
                        {__('Shop More')}
                    </button>
                </div>
            </div>
        </div>
    );
}
