'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const PositioningSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardIsRef = useRef<HTMLDivElement>(null);
  const cardIsNotRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Color shift background transition (shift from dark to ivory)
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

      // Reveal text animation for main title
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 50 },
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

      // Parallax effect on asymmetric cards
      if (cardIsRef.current && cardIsNotRef.current) {
        gsap.fromTo(
          cardIsRef.current,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardIsRef.current,
              start: 'top 85%',
            },
          }
        );

        gsap.fromTo(
          cardIsNotRef.current,
          { opacity: 0, y: 100 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardIsNotRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    },
    { scope: containerRef }
  );

  const isList = [
    t('pos_is_1'),
    t('pos_is_2'),
    t('pos_is_3'),
    t('pos_is_4'),
    t('pos_is_5'),
  ];

  const isNotList = [
    t('pos_isnot_1'),
    t('pos_isnot_2'),
    t('pos_isnot_3'),
    t('pos_isnot_4'),
    t('pos_isnot_5'),
  ];

  return (
    <section
      ref={containerRef}
      id="posicionamento"
      className="w-full min-h-screen bg-[#F7F3EC] text-[#0B0B0B] py-28 md:py-40 relative overflow-hidden transition-colors duration-700"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        {/* Editorial Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end mb-24">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium">
              <ShieldCheck className="w-4 h-4 stroke-[1.2]" />
              <span>{t('pos_tag')}</span>
            </div>

            <h2
              ref={titleRef}
              className="font-serif-lumiardi text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-[#0B0B0B] leading-[0.95] tracking-tight"
            >
              {t('pos_title_1')} <br />
              {t('pos_title_2')} <br />
              <span className="text-[#A97745] italic font-normal">{t('pos_title_3')}</span>
            </h2>
          </div>

          <div className="lg:col-span-5 space-y-4 lg:pl-10">
            <p className="text-xl md:text-3xl font-serif-lumiardi text-[#A97745] font-light leading-snug">
              {t('pos_subtitle_1')}
            </p>
            <p className="text-base md:text-lg text-[#0B0B0B]/80 font-sans font-light leading-relaxed">
              {t('pos_subtitle_2')}
            </p>
          </div>
        </div>

        {/* Asymmetric Cards Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start pt-8">
          {/* Main Heroized Card: A LUMIARDI É */}
          <div
            ref={cardIsRef}
            className="lg:col-span-7 bg-white p-8 md:p-14 border border-[#0B0B0B]/10 shadow-2xl space-y-8 relative group hover:border-[#C9A96B] transition-all duration-500"
          >
            <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#A97745] font-sans font-medium block">
                  {t('pos_identity_tag')}
                </span>
                <h3 className="font-serif-lumiardi text-3xl md:text-5xl font-light text-[#0B0B0B] mt-1 tracking-tight">
                  {t('pos_is_title')}
                </h3>
              </div>
              <div className="p-3 bg-[#C9A96B]/15 text-[#8C6B2F] border border-[#C9A96B]/30">
                <ShieldCheck className="w-6 h-6 stroke-[1.2]" />
              </div>
            </div>

            <ul className="space-y-6">
              {isList.map((item, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full mt-0.5 shrink-0">
                    <Check className="w-4 h-4 stroke-[1.2]" />
                  </span>
                  <span className="text-lg md:text-xl text-[#0B0B0B]/90 font-sans font-light leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Secondary Shifted Card: A LUMIARDI NÃO É */}
          <div
            ref={cardIsNotRef}
            className="lg:col-span-5 bg-[#FAF7F2] p-8 md:p-12 border border-rose-950/10 shadow-lg space-y-8 lg:mt-16 group hover:border-rose-900/30 transition-all duration-500"
          >
            <div className="flex items-center justify-between border-b border-rose-950/10 pb-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-rose-900/70 font-sans font-medium block">
                  {t('pos_diff_tag')}
                </span>
                <h3 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-rose-950/80 mt-1 tracking-tight">
                  {t('pos_isnot_title')}
                </h3>
              </div>
              <div className="p-3 bg-rose-900/10 text-rose-900 border border-rose-900/20">
                <X className="w-6 h-6 stroke-[1.2]" />
              </div>
            </div>

            <ul className="space-y-6">
              {isNotList.map((item, index) => (
                <li key={index} className="flex items-start gap-4 opacity-80">
                  <span className="p-1.5 bg-rose-900/10 text-rose-900 rounded-full mt-0.5 shrink-0">
                    <X className="w-4 h-4 stroke-[1.2]" />
                  </span>
                  <span className="text-base md:text-lg text-[#0B0B0B]/75 font-sans font-light leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
