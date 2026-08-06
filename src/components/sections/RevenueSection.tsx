'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserCheck, Lock, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const RevenueSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      if (!containerRef.current) return;

      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 80%',
            },
          }
        );
      }

      if (cardsRef.current) {
        const cards = Array.from(cardsRef.current.children);
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.2,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
            },
          }
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="receita"
      className="w-full min-h-screen bg-[#F7F3EC] text-[#0B0B0B] py-28 md:py-40 relative overflow-hidden"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        {/* Editorial Title Section */}
        <div className="max-w-4xl space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium">
            <Sparkles className="w-4 h-4 stroke-[1.2]" />
            <span>{t('rev_tag')}</span>
          </div>

          <h2
            ref={titleRef}
            className="font-serif-lumiardi text-5xl sm:text-7xl md:text-8xl font-light text-[#0B0B0B] tracking-tight leading-[0.95]"
          >
            {t('rev_title')}
          </h2>

          <p className="text-lg md:text-2xl text-[#0B0B0B]/80 font-sans font-light leading-relaxed max-w-2xl">
            {t('rev_desc')}
          </p>
        </div>

        {/* Asymmetric Cards Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Card Criadores (Featured Dominant) */}
          <div className="lg:col-span-7 bg-white border border-[#0B0B0B]/10 p-8 md:p-14 shadow-2xl space-y-8 relative group hover:border-[#C9A96B] transition-all duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#0B0B0B]/10 pb-6 gap-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 stroke-[1.2] text-[#8C6B2F]" />
                <h3 className="font-serif-lumiardi text-3xl md:text-5xl font-light text-[#0B0B0B] tracking-tight">
                  {t('rev_creators_title')}
                </h3>
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] bg-[#C9A96B]/15 border border-[#C9A96B]/30 px-4 py-1.5 font-sans font-semibold self-start sm:self-auto">
                {t('rev_creators_badge')}
              </span>
            </div>

            <p className="text-lg md:text-xl text-[#0B0B0B]/85 leading-relaxed font-sans font-light">
              {t('rev_creators_p1')}
            </p>

            <div className="p-6 md:p-8 bg-[#FAF7F2] border border-[#C9A96B]/30 space-y-3">
              <div className="text-[#8C6B2F] font-serif-lumiardi text-2xl md:text-3xl font-light tracking-wide flex items-center gap-2">
                <Sparkles className="w-5 h-5 stroke-[1.2]" />
                <span>{t('rev_creators_box_title')}</span>
              </div>
              <p className="text-sm md:text-base text-[#0B0B0B]/80 leading-relaxed font-sans font-light">
                {t('rev_creators_box_p')}
              </p>
            </div>

            <ul className="space-y-5">
              <li className="flex items-center gap-4">
                <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full shrink-0">
                  <Check className="w-4 h-4 stroke-[1.2]" />
                </span>
                <span className="text-base md:text-lg text-[#0B0B0B]/90 font-sans font-light">
                  {t('rev_creators_f1')}
                </span>
              </li>
              <li className="flex items-center gap-4">
                <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full shrink-0">
                  <Check className="w-4 h-4 stroke-[1.2]" />
                </span>
                <span className="text-base md:text-lg text-[#0B0B0B]/90 font-sans font-light">
                  {t('rev_creators_f2')}
                </span>
              </li>
              <li className="flex items-center gap-4">
                <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full shrink-0">
                  <Check className="w-4 h-4 stroke-[1.2]" />
                </span>
                <span className="text-base md:text-lg text-[#0B0B0B]/90 font-sans font-light">
                  {t('rev_creators_f3')}
                </span>
              </li>
            </ul>
          </div>

          {/* Card Agências (Offset Vertical) */}
          <div className="lg:col-span-5 bg-white/80 border border-[#0B0B0B]/10 p-8 md:p-12 shadow-xl space-y-8 lg:mt-16 group hover:border-[#A97745] transition-all duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#0B0B0B]/10 pb-6 gap-4">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 stroke-[1.2] text-[#0B0B0B]" />
                <h3 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-tight">
                  {t('rev_agencies_title')}
                </h3>
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#0B0B0B] bg-[#0B0B0B]/10 border border-[#0B0B0B]/20 px-4 py-1.5 font-sans font-semibold self-start sm:self-auto">
                {t('rev_agencies_badge')}
              </span>
            </div>

            <p className="text-base md:text-lg text-[#0B0B0B]/85 leading-relaxed font-sans font-light">
              {t('rev_agencies_p1')}
            </p>

            <div className="p-6 bg-[#FAF7F2] border border-[#0B0B0B]/15 space-y-3">
              <div className="text-[#0B0B0B] font-serif-lumiardi text-xl md:text-2xl font-light tracking-wide">
                {t('rev_agencies_box_title')}
              </div>
              <p className="text-sm md:text-base text-[#0B0B0B]/80 leading-relaxed font-sans font-light">
                {t('rev_agencies_box_p')}
              </p>
            </div>

            <ul className="space-y-4">
              <li className="flex items-center gap-3.5">
                <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full shrink-0">
                  <Check className="w-4 h-4 stroke-[1.2]" />
                </span>
                <span className="text-base md:text-lg text-[#0B0B0B]/90 font-sans font-light">
                  {t('rev_agencies_f1')}
                </span>
              </li>
              <li className="flex items-center gap-3.5">
                <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full shrink-0">
                  <Check className="w-4 h-4 stroke-[1.2]" />
                </span>
                <span className="text-base md:text-lg text-[#0B0B0B]/90 font-sans font-light">
                  {t('rev_agencies_f2')}
                </span>
              </li>
              <li className="flex items-center gap-3.5">
                <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full shrink-0">
                  <Check className="w-4 h-4 stroke-[1.2]" />
                </span>
                <span className="text-base md:text-lg text-[#0B0B0B]/90 font-sans font-light">
                  {t('rev_agencies_f3')}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
