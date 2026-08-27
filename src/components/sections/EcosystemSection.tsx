'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Kanban, MessageSquare, HardDrive, BarChart3, Shield, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const EcosystemSection: React.FC = () => {
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
            stagger: 0.15,
            duration: 0.8,
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

  const features = [
    {
      icon: Kanban,
      badge: t('eco_badge_1'),
      title: t('eco_card_1_title'),
      description: t('eco_card_1_desc'),
      tag: t('eco_tag_1'),
    },
    {
      icon: MessageSquare,
      badge: t('eco_badge_2'),
      title: t('eco_card_2_title'),
      description: t('eco_card_2_desc'),
      tag: t('eco_tag_2'),
    },
    {
      icon: HardDrive,
      badge: t('eco_badge_3'),
      title: t('eco_card_3_title'),
      description: t('eco_card_3_desc'),
      tag: t('eco_tag_3'),
      isNew: true,
    },
    {
      icon: BarChart3,
      badge: t('eco_badge_4'),
      title: t('eco_card_4_title'),
      description: t('eco_card_4_desc'),
      tag: t('eco_tag_4'),
    },
  ];

  return (
    <section
      ref={containerRef}
      id="ecossistema"
      className="w-full bg-[#0B0B0B] text-ivory py-28 md:py-36 relative overflow-hidden border-t border-white/10"
    >
      {/* Glow de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C9A96B]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24 relative z-10">
        {/* Cabeçalho */}
        <div className="max-w-4xl space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#C9A96B] font-sans font-medium">
            <Shield className="w-4 h-4 stroke-[1.2]" />
            <span>{t('eco_tag')}</span>
          </div>

          <h2
            ref={titleRef}
            className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl font-light text-ivory tracking-tight leading-[1.05]"
          >
            {t('eco_title_1')}{' '}
            <span className="text-[#C9A96B] italic font-normal">{t('eco_title_2')}</span>
          </h2>

          <p className="text-lg md:text-xl text-ivory/70 font-sans font-light leading-relaxed max-w-2xl">
            {t('eco_desc')}
          </p>
        </div>

        {/* Grid de 4 recursos */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className={`bg-[#141414] border p-8 flex flex-col justify-between group hover:border-[#C9A96B] transition-all duration-300 relative ${
                  item.isNew ? 'border-[#C9A96B]/50 shadow-lg shadow-[#C9A96B]/5' : 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B]">
                      <IconComponent className="w-6 h-6 stroke-[1.2]" />
                    </div>
                    <span className={`text-[9px] uppercase tracking-[0.2em] font-sans px-2.5 py-1 ${
                      item.isNew ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold' : 'bg-white/5 text-ivory/60'
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory mb-3 group-hover:text-[#C9A96B] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs md:text-sm text-ivory/65 font-sans font-light leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#C9A96B] font-sans tracking-wider uppercase">
                  <span>{item.tag}</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[1.2] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA rápido para explorar o Dashboard */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-ivory/70 text-sm font-sans font-light">
            <Shield className="w-5 h-5 text-[#C9A96B] shrink-0" />
            <span>{t('eco_security_footer')}</span>
          </div>

          <Link
            href="/dashboard"
            className="px-8 py-3.5 bg-transparent border border-[#C9A96B]/50 text-[#C9A96B] hover:bg-[#C9A96B] hover:text-[#0B0B0B] text-xs font-sans tracking-[0.25em] uppercase font-medium transition-all duration-300 flex items-center gap-2 group shrink-0"
          >
            <span>{t('eco_cta')}</span>
            <ArrowUpRight className="w-4 h-4 stroke-[1.2]" />
          </Link>
        </div>
      </div>
    </section>
  );
};
