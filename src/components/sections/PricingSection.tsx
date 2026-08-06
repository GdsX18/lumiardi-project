'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PricingTable } from '@/components/ui/PricingTable';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const PricingSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.to(containerRef.current, {
        backgroundColor: '#F7F3EC',
        color: '#0B0B0B',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'top 30%',
          scrub: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="planos"
      className="w-full min-h-screen bg-[#F7F3EC] text-[#0B0B0B] py-28 md:py-40 relative overflow-hidden transition-colors duration-700"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium">
            <Sparkles className="w-4 h-4 stroke-[1.2]" />
            <span>{t('pricing_tag')}</span>
          </div>

          <h2 className="font-serif-lumiardi text-5xl sm:text-7xl md:text-8xl font-light text-[#0B0B0B] tracking-tight leading-[0.95]">
            {t('pricing_title')}
          </h2>

          <p className="text-lg md:text-2xl text-[#0B0B0B]/80 font-sans font-light leading-relaxed max-w-2xl">
            {t('pricing_desc')}
          </p>
        </div>

        <PricingTable />
      </div>
    </section>
  );
};
