import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang } from '@/contexts/LanguageContext';
import { RiRocketLine, RiSpeedUpLine, RiShieldCheckLine } from 'react-icons/ri';

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedScrollSection() {
    const { __ } = useLang();
    const sectionRef = useRef(null);
    const titleRef = useRef(null);
    const textRef = useRef(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        let ctx = gsap.context(() => {
            // Custom SplitText animation
            const chars = titleRef.current.querySelectorAll('.char');
            gsap.from(chars, {
                yPercent: "random(-200, 200)",
                rotation: "random(-20, 20)",
                opacity: 0,
                stagger: 0.02,
                ease: "back.out(1.2)",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 85%",
                    end: "top 20%",
                    scrub: 1
                }
            });

            // Text effect for description
            gsap.fromTo(textRef.current,
                { opacity: 0, filter: "blur(5px)", x: -150 },
                {
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 75%",
                    scrub: 1,
                        toggleActions: "play reverse play reverse",
                    },
                    opacity: 1,
                    filter: "blur(0px)",
                    x: 0,
                    duration: 1.4,
                    ease: "power2.out"
                }
            );

            // Animate cards staggering
            gsap.from(cardsRef.current, {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 60%",
                    scrub: 1,
                    toggleActions: "play reverse play reverse",
                },
                x: -60,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                
                ease: "back.out(1.2)"
            });
            
            // Parallax effect on background elements
            gsap.to('.bg-shape', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                },
                y: (i) => -150 * (i + 1),
                ease: "none"
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const addToRefs = (el) => {
        if (el && !cardsRef.current.includes(el)) {
            cardsRef.current.push(el);
        }
    };

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
        <section ref={sectionRef} className="relative w-full overflow-hidden bg-gradient-to-br from-bg to-white py-24 my-10 border-y border-border shadow-sm">
            {/* Animated Background Shapes */}
            <div className="bg-shape absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
            <div className="bg-shape absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>
            <div className="bg-shape absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="container mx-auto px-5 z-10">
                <div className="text-center max-w-3xl mx-auto mb-20 relative">
                    <h2 ref={titleRef} className="text-3xl md:text-5xl font-extrabold text-heading tracking-tight mb-6">
                        {renderSplitText(__('Experience the Next Generation'))}
                    </h2>
                    <p ref={textRef} className="text-lg text-res">
                        {__('Discover our curated collection of premium electronics designed to elevate your everyday life with cutting-edge innovation and uncompromised performance.')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div ref={addToRefs} className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                            <RiRocketLine size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-heading mb-3">{__('Lightning Fast')}</h3>
                        <p className="text-res leading-relaxed">
                            {__('Get your products delivered in record time with our optimized global shipping network.')}
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div ref={addToRefs} className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 md:-translate-y-6">
                        <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6">
                            <RiSpeedUpLine size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-heading mb-3">{__('Unmatched Performance')}</h3>
                        <p className="text-res leading-relaxed">
                            {__('Every item is rigorously tested to ensure it meets our strict quality and performance standards.')}
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div ref={addToRefs} className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                        <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6">
                            <RiShieldCheckLine size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-heading mb-3">{__('Secure & Protected')}</h3>
                        <p className="text-res leading-relaxed">
                            {__('Shop with confidence knowing your data is encrypted and purchases are fully protected.')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
