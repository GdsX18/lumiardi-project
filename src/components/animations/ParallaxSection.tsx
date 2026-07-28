'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  speed = 0.2,
  className,
}) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!targetRef.current) return;

      gsap.to(targetRef.current, {
        yPercent: speed * 50,
        ease: 'none',
        scrollTrigger: {
          trigger: targetRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    },
    { scope: targetRef }
  );

  return (
    <div ref={targetRef} className={className}>
      {children}
    </div>
  );
};
