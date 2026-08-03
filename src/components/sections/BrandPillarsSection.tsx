'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { IconL3D } from '@/components/3d/IconL3D';
import { ShieldCheck, Sparkles, EyeOff, Flame, Award } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const BrandPillarsSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const pillars = [
    {
      number: '01',
      title: t('pillar_1_title'),
      subtitle: t('pillar_1_sub'),
      desc: t('pillar_1_desc'),
      icon: <ShieldCheck className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-7',
      isHero: true,
    },
    {
      number: '02',
      title: t('pillar_2_title'),
      subtitle: t('pillar_2_sub'),
      desc: t('pillar_2_desc'),
      icon: <Sparkles className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-5',
      isHero: false,
    },
    {
      number: '03',
      title: t('pillar_3_title'),
      subtitle: t('pillar_3_sub'),
      desc: t('pillar_3_desc'),
      icon: <EyeOff className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-12',
      isHero: true,
      fullWidth: true,
    },
    {
      number: '04',
      title: t('pillar_4_title'),
      subtitle: t('pillar_4_sub'),
      desc: t('pillar_4_desc'),
      icon: <Flame className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-5',
      isHero: false,
    },
    {
      number: '05',
      title: t('pillar_5_title'),
      subtitle: t('pillar_5_sub'),
      desc: t('pillar_5_desc'),
      icon: <Award className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-7',
      isHero: true,
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;

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

      if (pillarsRef.current) {
        const pillarCards = Array.from(pillarsRef.current.children);
        gsap.fromTo(
          pillarCards,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: pillarsRef.current,
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
      id="pilares"
      className="w-full min-h-screen bg-[#F7F3EC] text-[#0B0B0B] py-28 md:py-40 relative overflow-hidden"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        {/* Editorial Header with Floating 3D Icon L */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-8 space-y-6">
            <span className="text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium block">
              {t('pillars_tag')}
            </span>
            <h2
              ref={titleRef}
              className="font-serif-lumiardi text-5xl sm:text-7xl md:text-8xl font-light text-[#0B0B0B] tracking-tight leading-[0.95]"
            >
              {t('pillars_title')}
            </h2>
            <p className="text-lg md:text-2xl text-[#0B0B0B]/80 font-sans font-light leading-relaxed max-w-2xl">
              {t('pillars_desc')}
            </p>
          </div>

          {/* 3D Icon L Floating Element */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <IconL3D className="w-56 h-56 md:w-72 md:h-72" />
          </div>
        </div>

        {/* Asymmetric Pillars Layout */}
        <div ref={pillarsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {pillars.map((pillar) => (
            <div
              key={pillar.number}
              className={`${pillar.colSpan} ${
                pillar.fullWidth
                  ? 'bg-[#FAF7F2] border border-[#C9A96B]/40 p-10 md:p-16'
                  : pillar.isHero
                  ? 'bg-white border border-[#0B0B0B]/10 p-8 md:p-12 shadow-xl hover:border-[#C9A96B]'
                  : 'bg-white/70 border border-[#0B0B0B]/10 p-8 md:p-10 shadow-md hover:border-[#A97745]'
              } flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 group`}
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-serif-lumiardi text-5xl md:text-6xl font-light text-[#8C6B2F] tracking-widest">
                    {pillar.number}
                  </span>
                  <div className="p-2.5 bg-[#C9A96B]/10 border border-[#C9A96B]/20">
                    {pillar.icon}
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-semibold text-[#A97745] block mb-2">
                  {pillar.subtitle}
                </span>

                <h3 className="font-serif-lumiardi text-3xl md:text-5xl font-light text-[#0B0B0B] tracking-tight mb-4 group-hover:text-[#8C6B2F] transition-colors">
                  {pillar.title}
                </h3>
              </div>

              <p className="text-base md:text-lg font-sans font-light text-[#0B0B0B]/80 leading-relaxed mt-4">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
