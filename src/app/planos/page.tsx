'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PricingTable } from '@/components/ui/PricingTable';
import { Sparkles, Building2, UserCheck, Check, Star } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function PlanosPage() {
  const [planCategory, setPlanCategory] = useState<'criadoras' | 'agencias'>('criadoras');
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-[#0B0B0B] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      {/* Hero dos Planos */}
      <section className="pt-36 pb-20 bg-[#0B0B0B] text-ivory relative overflow-hidden border-b border-[#C9A96B]/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9A96B]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-[#C9A96B]/30 bg-[#C9A96B]/5 text-[#C9A96B] text-xs font-sans tracking-[0.3em] uppercase">
            <Sparkles className="w-3.5 h-3.5 stroke-[1.2]" />
            <span>{t('plans_hero_tag')}</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl font-light text-ivory tracking-tight leading-[1.05] max-w-4xl mx-auto">
            {t('plans_hero_title')}
          </h1>

          <p className="font-sans text-base md:text-xl text-ivory/70 font-light leading-relaxed max-w-2xl mx-auto">
            {t('plans_hero_desc')}
          </p>

          {/* Toggle de Categoria: Criadoras vs Agências */}
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              onClick={() => setPlanCategory('criadoras')}
              className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-sans tracking-[0.2em] uppercase font-medium transition-all duration-300 cursor-pointer ${
                planCategory === 'criadoras'
                  ? 'bg-[#C9A96B] text-[#0B0B0B] shadow-lg'
                  : 'bg-transparent border border-white/20 text-ivory/70 hover:border-[#C9A96B] hover:text-[#C9A96B]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{t('plans_tab_creators')}</span>
            </button>

            <button
              onClick={() => setPlanCategory('agencias')}
              className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-sans tracking-[0.2em] uppercase font-medium transition-all duration-300 cursor-pointer ${
                planCategory === 'agencias'
                  ? 'bg-[#C9A96B] text-[#0B0B0B] shadow-lg'
                  : 'bg-transparent border border-white/20 text-ivory/70 hover:border-[#C9A96B] hover:text-[#C9A96B]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('plans_tab_agencies')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Conteúdo da Seção de Planos */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {planCategory === 'criadoras' ? (
            <div className="space-y-16">
              {/* Cards Resumo dos Planos das Criadoras */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Glow */}
                <div className="bg-white border border-[#0B0B0B]/10 p-8 shadow-xl space-y-6 relative hover:border-[#C9A96B] transition-all">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                      {t('plan_glow_badge')}
                    </span>
                    <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_glow_title')}</h3>
                    <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                      R$ 19,90 <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                    {t('plan_glow_sub')}
                  </p>

                  <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_glow_f1')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_glow_f2')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_glow_f3')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_glow_f4')}</span>
                    </li>
                  </ul>

                  <Link
                    href="/checkout?plan=glow&category=criadoras"
                    className="w-full py-3 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#8C6B2F] transition-colors block"
                  >
                    {t('plan_glow_cta')}
                  </Link>
                </div>

                {/* Radiance */}
                <div className="bg-white border border-[#0B0B0B]/10 p-8 shadow-xl space-y-6 relative hover:border-[#C9A96B] transition-all">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                      {t('plan_radiance_badge')}
                    </span>
                    <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_radiance_title')}</h3>
                    <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                      R$ 69,90 <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                    {t('plan_radiance_sub')}
                  </p>

                  <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_radiance_f1')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_radiance_f2')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_radiance_f3')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_radiance_f4')}</span>
                    </li>
                  </ul>

                  <Link
                    href="/checkout?plan=radiance&category=criadoras"
                    className="w-full py-3 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#8C6B2F] transition-colors block"
                  >
                    {t('plan_radiance_cta')}
                  </Link>
                </div>

                {/* Icon */}
                <div className="bg-white border-2 border-[#C9A96B] p-8 shadow-2xl space-y-6 relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A96B] text-[#0B0B0B] text-[9px] uppercase tracking-[0.25em] font-semibold px-3 py-1">
                    {t('plan_icon_rec_badge')}
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                      {t('plan_icon_badge')}
                    </span>
                    <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_icon_title')}</h3>
                    <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                      R$ 129,90 <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                    {t('plan_icon_sub')}
                  </p>

                  <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_icon_f1')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_icon_f2')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_icon_f3')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_icon_f4')}</span>
                    </li>
                  </ul>

                  <Link
                    href="/checkout?plan=icon&category=criadoras"
                    className="w-full py-3 bg-[#C9A96B] text-[#0B0B0B] text-center text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#D4B87A] transition-colors block"
                  >
                    {t('plan_icon_cta')}
                  </Link>
                </div>
              </div>

              {/* Tabela Comparativa Detalhada */}
              <div className="space-y-6 pt-10">
                <div className="text-center space-y-2">
                  <h3 className="font-serif-lumiardi text-3xl font-light text-[#0B0B0B]">
                    {t('plans_table_title')}
                  </h3>
                  <p className="text-sm text-[#0B0B0B]/70 font-sans">
                    {t('plans_table_desc')}
                  </p>
                </div>

                <PricingTable />
              </div>
            </div>
          ) : (
            /* Planos para Agências */
            <div className="space-y-16">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#A97745] font-sans font-medium">
                  {t('plan_agencies_sol_tag')}
                </span>
                <h2 className="font-serif-lumiardi text-4xl md:text-5xl font-light text-[#0B0B0B]">
                  {t('plan_agencies_title')}
                </h2>
                <p className="text-sm md:text-base text-[#0B0B0B]/75 font-sans font-light">
                  {t('plan_agencies_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                {/* Lumiardi Select */}
                <div className="bg-white border border-[#0B0B0B]/10 p-10 shadow-2xl space-y-8 relative hover:border-[#C9A96B] transition-all">
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] bg-[#C9A96B]/15 border border-[#C9A96B]/30 px-3 py-1 font-sans font-semibold inline-block">
                      {t('plan_select_badge')}
                    </span>
                    <h3 className="font-serif-lumiardi text-4xl font-light text-[#0B0B0B]">
                      {t('plan_select_title')}
                    </h3>
                    <p className="font-serif-lumiardi italic text-xl text-[#A97745]">
                      {t('plan_select_quote')}
                    </p>
                  </div>

                  <p className="text-sm text-[#0B0B0B]/80 font-sans font-light leading-relaxed">
                    {t('plan_select_sub')}
                  </p>

                  <ul className="space-y-4 pt-4 border-t border-[#0B0B0B]/10 text-sm font-sans text-[#0B0B0B]/90">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_select_f1')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_select_f2')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_select_f3')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#8C6B2F] shrink-0" />
                      <span>{t('plan_select_f4')}</span>
                    </li>
                  </ul>

                  <Link
                    href="/checkout?plan=select&category=agencias"
                    className="w-full py-4 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.25em] uppercase font-medium hover:bg-[#8C6B2F] transition-colors block cursor-pointer"
                  >
                    {t('plan_select_cta')}
                  </Link>
                </div>

                {/* Lumiardi Signature */}
                <div className="bg-[#0B0B0B] text-ivory border-2 border-[#C9A96B] p-10 shadow-2xl space-y-8 relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A96B] text-[#0B0B0B] text-[9px] uppercase tracking-[0.25em] font-bold px-4 py-1">
                    {t('plan_sig_rec_badge')}
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] bg-[#C9A96B]/15 border border-[#C9A96B]/30 px-3 py-1 font-sans font-semibold inline-block">
                      {t('plan_sig_badge')}
                    </span>
                    <h3 className="font-serif-lumiardi text-4xl font-light text-ivory">
                      {t('plan_sig_title')}
                    </h3>
                    <p className="font-serif-lumiardi italic text-xl text-[#C9A96B]">
                      {t('plan_sig_quote')}
                    </p>
                  </div>

                  <p className="text-sm text-ivory/80 font-sans font-light leading-relaxed">
                    {t('plan_sig_sub')}
                  </p>

                  <ul className="space-y-4 pt-4 border-t border-white/10 text-sm font-sans text-ivory/90">
                    <li className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-[#C9A96B] shrink-0 fill-[#C9A96B]" />
                      <span>{t('plan_sig_f1')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#C9A96B] shrink-0" />
                      <span>{t('plan_sig_f2')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#C9A96B] shrink-0" />
                      <span>{t('plan_sig_f3')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#C9A96B] shrink-0" />
                      <span>{t('plan_sig_f4')}</span>
                    </li>
                  </ul>

                  <Link
                    href="/checkout?plan=signature&category=agencias"
                    className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] text-center text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#D4B87A] transition-colors block cursor-pointer"
                  >
                    {t('plan_sig_cta')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
