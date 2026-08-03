'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Sparkles, Shield, User, Building } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const ContentSystemSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const columns = [
    {
      title: t('cs_col1_title'),
      subtitle: t('cs_col1_sub'),
      icon: <Shield className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-4',
      items: [
        t('cs_col1_i1'),
        t('cs_col1_i2'),
        t('cs_col1_i3'),
        t('cs_col1_i4'),
        t('cs_col1_i5'),
      ],
    },
    {
      title: t('cs_col2_title'),
      subtitle: t('cs_col2_sub'),
      icon: <User className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-4',
      items: [
        t('cs_col2_i1'),
        t('cs_col2_i2'),
        t('cs_col2_i3'),
        t('cs_col2_i4'),
        t('cs_col2_i5'),
      ],
    },
    {
      title: t('cs_col3_title'),
      subtitle: t('cs_col3_sub'),
      icon: <Building className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      colSpan: 'lg:col-span-4',
      items: [
        t('cs_col3_i1'),
        t('cs_col3_i2'),
        t('cs_col3_i3'),
        t('cs_col3_i4'),
        t('cs_col3_i5'),
      ],
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current.querySelectorAll('.content-col'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="comunicacao"
      className="w-full min-h-screen bg-[#F7F3EC] text-[#0B0B0B] py-28 md:py-40 relative overflow-hidden"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium">
            <Sparkles className="w-4 h-4 stroke-[1.2]" />
            <span>{t('cs_tag')}</span>
          </div>

          <h2 className="font-serif-lumiardi text-5xl sm:text-7xl md:text-8xl font-light text-[#0B0B0B] tracking-tight leading-[0.95]">
            {t('cs_title')}
          </h2>

          <p className="text-lg md:text-2xl text-[#0B0B0B]/80 font-sans font-light leading-relaxed max-w-2xl">
            {t('cs_desc')}
          </p>
        </div>

        {/* Asymmetric Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {columns.map((col, idx) => (
            <div
              key={col.title}
              className={`content-col ${col.colSpan} bg-white border border-[#0B0B0B]/10 p-8 md:p-12 shadow-xl hover:border-[#C9A96B] transition-all duration-500 flex flex-col justify-between ${
                idx === 1 ? 'lg:-translate-y-4' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-6 mb-8">
                  <div>
                    <span className="font-sans text-[10px] tracking-[0.3em] text-[#A97745] font-semibold uppercase block">
                      {col.title}
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl md:text-3xl text-[#0B0B0B] font-light mt-1">
                      {col.subtitle}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-[#C9A96B]/15 border border-[#C9A96B]/30">
                    {col.icon}
                  </div>
                </div>

                <ul className="space-y-4">
                  {col.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3.5">
                      <span className="p-1 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full mt-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[1.2]" />
                      </span>
                      <span className="text-sm md:text-base text-[#0B0B0B]/85 font-sans font-light leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-6 border-t border-[#0B0B0B]/10 text-right">
                <span className="text-[10px] text-[#A97745] uppercase tracking-widest font-sans font-semibold">
                  LUMIARDI STANDARD 0{idx + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
