'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Star, Search, UserCheck, Lock, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const ShowcaseSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const showcaseItems = [
    {
      name: 'Aura Management',
      type: t('showcase_agency_type'),
      location: 'São Paulo · Paris',
      badge: t('showcase_verified_badge'),
      rating: '5.0',
      hero: true,
      image: '/images/agency_aura.jpg',
    },
    {
      name: 'Elena Vance',
      type: t('showcase_creator_type'),
      location: 'Rio de Janeiro · Lisboa',
      badge: 'TOP CREATOR',
      rating: '4.9',
      hero: false,
      image: '/images/creator_elena.jpg',
    },
    {
      name: 'Vanguard Talent Co.',
      type: t('showcase_agency_type'),
      location: 'Londres · Nova York',
      badge: t('showcase_verified_badge'),
      rating: '5.0',
      hero: false,
      image: '/images/agency_vanguard.jpg',
    },
    {
      name: 'SOPHIA M.',
      type: t('showcase_creator_type'),
      location: 'Milão · Ibiza',
      badge: 'ICON',
      rating: '5.0',
      hero: false,
      image: '/images/creator_sophia.jpg',
    },
  ];

  const filteredItems = showcaseItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.to(containerRef.current, {
        backgroundColor: '#0B0B0B',
        color: '#F7F3EC',
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
      id="vitrine"
      className="w-full min-h-screen bg-[#0B0B0B] text-ivory py-28 md:py-40 relative overflow-hidden transition-colors duration-700"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        {/* Header */}
        <div className="max-w-4xl space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-gold font-sans font-medium">
            <Sparkles className="w-4 h-4 stroke-[1.2]" />
            <span>{t('showcase_tag')}</span>
          </div>

          <h2 className="font-serif-lumiardi text-5xl sm:text-7xl md:text-8xl font-light text-ivory tracking-tight leading-[0.95]">
            {t('showcase_title')}
          </h2>

          <p className="text-lg md:text-2xl text-ivory/70 font-sans font-light leading-relaxed max-w-2xl">
            {t('showcase_desc')}
          </p>
        </div>

        {/* Dual CTAs Asymmetric */}
        <div className="flex flex-col md:flex-row gap-6 mb-20">
          <button
            onClick={() => router.push('/qualificacao')}
            className="flex-1 p-8 bg-[#C9A96B] text-[#0B0B0B] hover:bg-[#D4B87A] transition-all duration-300 flex items-center justify-between group cursor-pointer shadow-xl"
          >
            <div className="flex items-center gap-4">
              <UserCheck className="w-6 h-6 stroke-[1.2]" />
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-[0.25em] block opacity-80">
                  {t('showcase_creators_label')}
                </span>
                <span className="font-serif-lumiardi text-2xl md:text-3xl font-light">
                  {t('showcase_cta_creators')}
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-6 h-6 stroke-[1.2] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 p-8 bg-transparent border border-ivory/30 text-ivory hover:border-gold hover:text-gold transition-all duration-300 flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <Lock className="w-6 h-6 stroke-[1.2]" />
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-[0.25em] block text-ivory/50 group-hover:text-gold/70">
                  {t('showcase_agencies_label')}
                </span>
                <span className="font-serif-lumiardi text-2xl md:text-3xl font-light">
                  {t('showcase_cta_agencies')}
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-6 h-6 stroke-[1.2] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-12 pb-6 border-b border-white/10">
          <h3 className="font-serif-lumiardi text-3xl font-light text-ivory">
            {t('showcase_search_title')}
          </h3>
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder={t('showcase_search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141414] border border-white/15 px-4 py-3 pl-11 text-sm text-ivory placeholder-ivory/40 focus:outline-none focus:border-gold transition-colors font-sans"
            />
            <Search className="w-4 h-4 text-ivory/50 absolute left-4 top-1/2 -translate-y-1/2 stroke-[1.2]" />
          </div>
        </div>

        {/* Showcase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.name}
              className={`p-8 bg-[#121212] border ${
                item.hero ? 'border-gold/50 lg:-translate-y-4' : 'border-white/10'
              } hover:border-gold transition-all duration-500 group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span
                    className={`text-[9px] uppercase tracking-[0.25em] px-3 py-1 font-sans border ${
                      item.badge === 'ICON'
                        ? 'border-gold text-gold bg-gold/10'
                        : 'border-white/20 text-ivory/70'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <div className="flex items-center gap-1.5 text-gold text-xs font-sans">
                    <Star className="w-3.5 h-3.5 fill-gold stroke-none" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <div className="relative w-full h-64 mb-6 bg-gradient-to-t from-black to-bronze/20 overflow-hidden border border-white/10">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                </div>

                <span className="text-[10px] uppercase tracking-[0.25em] text-gold/70 font-sans block mb-1">
                  {item.type}
                </span>
                <h4 className="font-serif-lumiardi text-2xl font-light text-ivory group-hover:text-gold transition-colors">
                  {item.name}
                </h4>
                <p className="text-xs text-ivory/50 font-sans mt-1">
                  {item.location}
                </p>
              </div>

              <div
                onClick={() => router.push('/qualificacao')}
                className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gold font-sans font-medium cursor-pointer"
              >
                <span>{t('showcase_view_portfolio')}</span>
                <ArrowUpRight className="w-4 h-4 stroke-[1.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
