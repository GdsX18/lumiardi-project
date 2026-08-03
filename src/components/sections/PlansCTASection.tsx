'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, UserCheck, Building2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const PlansCTASection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="planos-resumo" className="w-full bg-[#F7F3EC] text-[#0B0B0B] py-24 md:py-32 relative overflow-hidden border-t border-[#0B0B0B]/10">
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        <div className="bg-white border border-[#0B0B0B]/10 p-8 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A96B]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Esquerda: Conteúdo & Título */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium">
                <Sparkles className="w-4 h-4 stroke-[1.2]" />
                <span>{t('plans_tag')}</span>
              </div>

              <h2 className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl font-light text-[#0B0B0B] tracking-tight leading-[1.05]">
                {t('plans_title_1')}{' '}
                <span className="text-[#A97745] italic font-normal">{t('plans_title_creators')}</span>{' '}
                {t('plans_title_and')}{' '}
                <span className="text-[#A97745] italic font-normal">{t('plans_title_agencies')}</span>
              </h2>

              <p className="text-base md:text-xl text-[#0B0B0B]/75 font-sans font-light leading-relaxed max-w-2xl">
                {t('plans_desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-[#FAF7F2] border border-[#0B0B0B]/10 flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-[#8C6B2F] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif-lumiardi text-lg font-normal text-[#0B0B0B]">{t('plans_for_creators_title')}</h4>
                    <p className="text-xs text-[#0B0B0B]/70 font-sans mt-0.5">{t('plans_for_creators_sub')}</p>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF7F2] border border-[#0B0B0B]/10 flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-[#0B0B0B] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif-lumiardi text-lg font-normal text-[#0B0B0B]">{t('plans_for_agencies_title')}</h4>
                    <p className="text-xs text-[#0B0B0B]/70 font-sans mt-0.5">{t('plans_for_agencies_sub')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direita: CTA Principal para a Página de Planos */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
              <div className="w-full bg-[#0B0B0B] text-ivory p-8 md:p-10 space-y-6 text-center lg:text-left border border-[#C9A96B]/30 shadow-xl">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96B] font-sans font-semibold block">
                  {t('plans_detail_tag')}
                </span>

                <h3 className="font-serif-lumiardi text-2xl md:text-3xl font-light text-ivory leading-snug">
                  {t('plans_compare_title')}
                </h3>

                <p className="text-xs md:text-sm text-ivory/70 font-sans font-light leading-relaxed">
                  {t('plans_compare_desc')}
                </p>

                <Link
                  href="/planos"
                  className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] font-sans text-xs tracking-[0.25em] uppercase font-medium hover:bg-[#D4B87A] transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg cursor-pointer"
                >
                  <span>{t('plans_cta_btn')}</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[1.2] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
