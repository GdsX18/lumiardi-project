'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface RevealTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className,
  as: Component = 'h2',
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const words = containerRef.current.querySelectorAll('.reveal-word');

      gsap.fromTo(
        words,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: containerRef }
  );

  const wordList = text.split(' ');

  return (
    <Component ref={containerRef} className={className}>
      {wordList.map((word, idx) => (
        <span key={idx} className="reveal-word inline-block mr-[0.25em] opacity-0">
          {word}
        </span>
      ))}
    </Component>
  );
};
