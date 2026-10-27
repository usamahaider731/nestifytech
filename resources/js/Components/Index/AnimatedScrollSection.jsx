import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang } from '@/contexts/LanguageContext';
import { RiRocketLine, RiSpeedUpLine, RiShieldCheckLine } from 'react-icons/ri';
import ImageViwer from '../Admin/ImageViwer';

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedScrollSection({ data = [] }) {
    console.log(data)
    const { __, locale } = useLang();
    const sectionRef = useRef(null);
    const titleRef = useRef(null);
    const textRef = useRef(null);
    const cardsRef = useRef([]);

useEffect(() => {
    let ctx = gsap.context(() => {
        const chars = titleRef.current.querySelectorAll('.char');
        
        // 1. Title character animation
        gsap.from(chars, {
            yPercent: "random(-50, 70)",
            rotation: "random(-20, 20)",
            opacity: 0,
            stagger: 0.02,
            ease: "back.out(1.2)",
scrollTrigger: {
    trigger: sectionRef.current,
    start: "top 80%",
    toggleActions: "play none none reverse" // <--- Plays smoothly once when scrolled into view, reverses when scrolled back up
}
        });

        // 2. Text effect for description (removed conflicting toggleActions)
        gsap.fromTo(textRef.current,
            { opacity: 0, filter: "blur(3px)", x: -100 },
            {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 95%",
                    scrub: 1,
                },
                opacity: 1,
                filter: "blur(0px)",
                x: 0,
                ease: "power2.out"
            }
        );

        // 3. Animate cards staggering
        gsap.from(cardsRef.current, {
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 98%",
                scrub: 1,
            },
            x: -40,
            opacity: 0,
            stagger: 0.2,
            ease: "power2.out"
        });

        // 4. Parallax effect on background elements
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
        <section ref={sectionRef} className="relative w-full overflow-hidden bg-gradient-to-br from-bg to-white py-10 border-y border-border shadow-sm">
            {/* Animated Background Shapes */}
            <div className="bg-shape absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
            <div className="bg-shape absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>
            <div className="bg-shape absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10"></div>

            <div className="container mx-auto px-5 z-10">
                <div className="text-center mx-auto mb-20 relative">
                    <h2 ref={titleRef} className="text-3xl md:text-5xl font-bold text-heading tracking-tight font-poppins mb-6">
                        {renderSplitText(__('Experience the Next Generation'))}
                    </h2>
                    <p ref={textRef} className="text-base max-w-3xl mx-auto text-res">
                        {__('Discover our curated collection of premium electronics designed to elevate your everyday life with cutting-edge innovation and uncompromised performance.')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {
                        data.length > 0 && data.map((item, index) => (
                            <div ref={addToRefs} className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ color: item.shopping_benefit_icon_color, backgroundColor: item.shopping_benefit_icon_color / 10 }}>
                                    <ImageViwer image={item.shopping_benefit_icon} className={`size-7`} />
                                </div>
                                <h3 className="text-xl font-bold text-heading mb-3">{__(item.title)}</h3>
                                <p className="text-res leading-relaxed">
                                    {__(item.description)}
                                </p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </section>
    );
}