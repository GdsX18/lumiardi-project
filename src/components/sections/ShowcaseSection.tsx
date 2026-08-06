'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Star, Search, UserCheck, Lock, Sparkles, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ShowcaseItem {
  name: string;
  type: string;
  location: string;
  badge: string;
  rating: string;
  hero: boolean;
  image: string;
  bio?: string;
  metrics?: { label: string; value: string }[];
}

export const ShowcaseSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<ShowcaseItem | null>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const showcaseItems: ShowcaseItem[] = [
    {
      name: 'Aura Management',
      type: t('showcase_agency_type'),
      location: 'São Paulo · Paris',
      badge: t('showcase_verified_badge'),
      rating: '5.0',
      hero: true,
      image: '/images/agency_aura.jpg',
      bio: 'Agência de gestão internacional com foco em modelos e criadoras de alto ticket, contratos formais e representação global.',
      metrics: [
        { label: 'Talentos Agenciados', value: '42' },
        { label: 'Países de Atuação', value: '18+' },
        { label: 'Score de Governança', value: '99%' },
      ],
    },
    {
      name: 'Elena Vance',
      type: t('showcase_creator_type'),
      location: 'Rio de Janeiro · Lisboa',
      badge: 'TOP CREATOR',
      rating: '4.9',
      hero: false,
      image: '/images/creator_elena.jpg',
      bio: 'Criadora e modelo autoral focada em ensaios editoriais de luxo, campanhas de moda e presença digital internacional.',
      metrics: [
        { label: 'Presença Global', value: '12 Países' },
        { label: 'Engajamento Verificado', value: 'Alto' },
        { label: 'Status de Verificação', value: 'Auditada +18' },
      ],
    },
    {
      name: 'Vanguard Talent Co.',
      type: t('showcase_agency_type'),
      location: 'Londres · Nova York',
      badge: t('showcase_verified_badge'),
      rating: '5.0',
      hero: false,
      image: '/images/agency_vanguard.jpg',
      bio: 'Holding de gestão de talentos executivos e representação de criadoras em grande escala com sigilo de marca.',
      metrics: [
        { label: 'Talentos Ativos', value: '85' },
        { label: 'Campanha Média', value: 'R$ 150k+' },
        { label: 'Compliance', value: 'ISO 27001' },
      ],
    },
    {
      name: 'SOPHIA M.',
      type: t('showcase_creator_type'),
      location: 'Milão · Ibiza',
      badge: 'ICON',
      rating: '5.0',
      hero: false,
      image: '/images/creator_sophia.jpg',
      bio: 'Modelo editorial de alta performance com portfólio exclusivo para agências registradas Lumiardi Signature.',
      metrics: [
        { label: 'Segmento', value: 'Fashion & Luxury' },
        { label: 'Avaliação de Agências', value: '5.0 / 5.0' },
        { label: 'Sigilo', value: 'Anonimato Garantido' },
      ],
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
            onClick={() => router.push('/qualificacao/agencia')}
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

        {/* Showcase Cards Grid — Scroll horizontal em mobile, grid em desktop */}
        <div className="-mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory">
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8" style={{ minWidth: 'max-content' }}>
          {filteredItems.map((item) => (
            <div
              key={item.name}
              className={`snap-start w-72 md:w-auto flex-shrink-0 md:flex-shrink p-8 bg-[#121212] border ${
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
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
                onClick={() => setSelectedPortfolio(item)}
                className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gold font-sans font-medium cursor-pointer"
              >
                <span>{t('showcase_view_portfolio')}</span>
                <ArrowUpRight className="w-4 h-4 stroke-[1.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Modal de Visualização de Portfólio */}
        {selectedPortfolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#141414] border border-[#C9A96B]/50 w-full max-w-2xl text-ivory p-8 relative shadow-2xl space-y-6">
              <button
                onClick={() => setSelectedPortfolio(null)}
                className="absolute top-6 right-6 p-2 text-ivory/60 hover:text-gold transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>

              <div className="flex items-start gap-6 border-b border-white/10 pb-6">
                <div className="relative w-24 h-24 bg-white/5 border border-[#C9A96B]/30 shrink-0 overflow-hidden">
                  <Image
                    src={selectedPortfolio.image}
                    alt={selectedPortfolio.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] px-2.5 py-0.5 bg-[#C9A96B]/15 text-[#C9A96B] border border-[#C9A96B]/30 font-semibold">
                      {selectedPortfolio.badge}
                    </span>
                    <span className="text-xs text-ivory/60 font-sans flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C9A96B]" /> {t('showcase_verified_lumiardi')}
                    </span>
                  </div>
                  <h3 className="font-serif-lumiardi text-3xl font-light text-ivory mt-2">
                    {selectedPortfolio.name}
                  </h3>
                  <p className="text-xs text-ivory/60 font-sans">{selectedPortfolio.location} &bull; {selectedPortfolio.type}</p>
                </div>
              </div>

              <p className="text-sm text-ivory/80 font-sans leading-relaxed">
                {selectedPortfolio.bio}
              </p>

              {selectedPortfolio.metrics && (
                <div className="grid grid-cols-3 gap-4 py-4 bg-white/5 border border-white/10 px-4 text-center">
                  {selectedPortfolio.metrics.map((m, idx) => (
                    <div key={idx}>
                      <span className="text-[10px] uppercase text-ivory/50 block font-sans">{m.label}</span>
                      <span className="font-serif-lumiardi text-xl text-[#C9A96B]">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-sans">
                  <CheckCircle2 className="w-4 h-4" /> {t('showcase_verified_active')}
                </div>
                <button
                  onClick={() => {
                    setSelectedPortfolio(null);
                    router.push('/dashboard');
                  }}
                  className="px-6 py-3 bg-[#C9A96B] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.2em] font-semibold hover:bg-[#D4B87A] transition-colors cursor-pointer"
                >
                  {t('showcase_propose_connection')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

