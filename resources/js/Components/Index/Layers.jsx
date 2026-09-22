import React, { useRef, useContext } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TransitionContext } from '@/contexts/TransitionContext';
// import { useGSAP } from '@gsap/react';
gsap.registerPlugin(ScrollTrigger);

export default function Layers() {
  const main = useRef(null);
  const { completed } = useContext(TransitionContext);
  const scrollTween = useRef();
  const snapTriggers = useRef([]);

  const { contextSafe } = gsap.context(
    () => {
      if (!completed) return;
      const panels = gsap.utils.toArray('.panel');
      let scrollStarts = [0];
      let snapScroll = (value) => value;

      panels.forEach((panel, i) => {
        snapTriggers.current[i] = ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
        });
      });

      ScrollTrigger.addEventListener('refresh', () => {
        scrollStarts = snapTriggers.current.map((trigger) => trigger.start);
        snapScroll = ScrollTrigger.snapDirectional(scrollStarts);
      });

      ScrollTrigger.observe({
        type: 'wheel,touch',
        onChangeY(self) {
          if (!scrollTween.current) {
            const scroll = snapScroll(
              self.scrollY() + self.deltaY,
              self.deltaY > 0 ? 1 : -1
            );
            goToSection(scrollStarts.indexOf(scroll));
          }
        },
      });

      ScrollTrigger.refresh();
    },
    {
      dependencies: [completed],
      scope: main,
      revertOnUpdate: true,
    }
  );

  const goToSection = contextSafe((i) => {
    console.log('scroll to', i);
    scrollTween.current = gsap.to(window, {
      scrollTo: { y: snapTriggers.current[i].start, autoKill: false },
      duration: 1,
      onComplete: () => (scrollTween.current = null),
      overwrite: true,
    });
  });

  return (
    <main ref={main} className="relative">
      <section className="description panel light p-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Layered Pinning</h1>
          <p className="mb-4">Use pinning to layer panels on top of each other as you scroll.</p>
          <div className="scroll-down flex items-center">
            Scroll down
            <div className="arrow ml-2 w-4 h-4 border-b-2 border-r-2 border-primary transform rotate-45"></div>
          </div>
        </div>
      </section>
      <section className="panel dark p-8">ONE</section>
      <section className="panel purple p-8">TWO</section>
      <section className="panel orange p-8">THREE</section>
      <section className="panel red p-8">FOUR</section>
    </main>
  );
}
