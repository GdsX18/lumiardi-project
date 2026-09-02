'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PricingTable } from '@/components/ui/PricingTable';
import { ShieldCheck, Building2, UserCheck, Check, HardDrive, Search, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function PlanosPage() {
  const [planCategory, setPlanCategory] = useState<'criadoras' | 'agencias'>('criadoras');
  const [isYearly, setIsYearly] = useState(true);
  const { t } = useLanguage();
  // Helper para direcionar SEMPRE ao cadastro/qualificação do plano selecionado
  const getPlanLink = (planId: string, category: 'criadoras' | 'agencias', yearly: boolean) => {
    const billingParam = yearly ? 'yearly' : 'monthly';
    return category === 'criadoras'
      ? `/qualificacao?plan=${planId}&billing=${billingParam}`
      : `/qualificacao/agencia?plan=${planId}&billing=${billingParam}`;
  };

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-[#0B0B0B] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      {/* Hero dos Planos */}
      <section className="pt-36 pb-20 bg-[#0B0B0B] text-ivory relative overflow-hidden border-b border-[#C9A96B]/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9A96B]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-[#C9A96B]/30 bg-[#C9A96B]/5 text-[#C9A96B] text-xs font-sans tracking-[0.3em] uppercase">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.2]" />
            <span>{t('plans_hero_tag')}</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl font-light text-ivory tracking-tight leading-[1.05] max-w-4xl mx-auto">
            {t('plans_hero_title')}
          </h1>

          <p className="font-sans text-base md:text-xl text-ivory/70 font-light leading-relaxed max-w-2xl mx-auto">
            {t('plans_hero_desc')}
          </p>

          {/* Toggle de Categoria: Criadoras vs Agências */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-3">
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

            {/* Switch Mensal / Anual com Badge de Economia */}
            <div className="inline-flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 py-1.5 text-xs font-sans uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                  !isYearly ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                {t('sub_interval_monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 py-1.5 text-xs font-sans uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  isYearly ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                <span>{t('sub_interval_yearly')}</span>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-500 text-black-matte font-bold rounded-full">
                  {t('sub_save_10')}
                </span>
              </button>
            </div>
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
                <div className="bg-white border border-[#0B0B0B]/10 p-8 shadow-xl space-y-6 relative hover:border-[#C9A96B] transition-all flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                        {t('plan_glow_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_glow_title')}</h3>
                      <div className="space-y-0.5">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 17,91' : 'R$ 19,90'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? t('plans_billed_annually').replace('{amount}', 'R$ 214,92') : t('plans_billed_monthly')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                      {t('plan_glow_sub')}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_glow_1')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_glow_2')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_glow_3')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_glow_4')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('glow', 'criadoras', isYearly)}
                      className="w-full py-4 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#8C6B2F] transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>{t('plans_subscribe_btn').replace('{plan}', 'Glow')}</span>
                    </Link>
                  </div>
                </div>

                {/* Radiance */}
                <div className="bg-white border border-[#0B0B0B]/10 p-8 shadow-xl space-y-6 relative hover:border-[#C9A96B] transition-all flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                        {t('plan_radiance_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_radiance_title')}</h3>
                      <div className="space-y-0.5">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 62,91' : 'R$ 69,90'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? t('plans_billed_annually').replace('{amount}', 'R$ 754,92') : t('plans_billed_monthly')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                      {t('plan_radiance_sub')}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_radiance_1')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_radiance_2')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_radiance_3')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_radiance_4')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('radiance', 'criadoras', isYearly)}
                      className="w-full py-4 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#8C6B2F] transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>{t('plans_subscribe_btn').replace('{plan}', 'Radiance')}</span>
                    </Link>
                  </div>
                </div>

                {/* Icon */}
                <div className="bg-white border-2 border-[#C9A96B] p-8 shadow-2xl space-y-6 relative flex flex-col justify-between">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A96B] text-[#0B0B0B] text-[9px] uppercase tracking-[0.25em] font-bold px-4 py-1 shadow-md">
                    {t('plan_icon_rec_badge')}
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                        {t('plan_icon_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_icon_title')}</h3>
                      <div className="space-y-0.5">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 116,91' : 'R$ 129,90'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? t('plans_billed_annually').replace('{amount}', 'R$ 1.402,92') : t('plans_billed_monthly')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                      {t('plan_icon_sub')}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_icon_1')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_icon_2')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_icon_3')}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_icon_4')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('icon', 'criadoras', isYearly)}
                      className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] text-center text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#D4B87A] transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                      <span>{t('plans_subscribe_btn').replace('{plan}', 'Icon')}</span>
                    </Link>
                  </div>
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
                <div className="bg-white border border-[#0B0B0B]/10 p-10 shadow-2xl space-y-8 relative hover:border-[#C9A96B] transition-all flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] bg-[#C9A96B]/15 border border-[#C9A96B]/30 px-3 py-1 font-sans font-semibold inline-block">
                        {t('plan_select_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-4xl font-light text-[#0B0B0B]">
                        {t('plan_select_title')}
                      </h3>
                      <div className="space-y-0.5 pt-1">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 233,10' : 'R$ 259,00'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? t('plans_billed_annually').replace('{amount}', 'R$ 2.797,20') : t('plans_billed_monthly')}
                        </span>
                      </div>
                      <p className="font-serif-lumiardi italic text-lg text-[#A97745] pt-1">
                        {t('plan_select_quote')}
                      </p>
                    </div>

                    <p className="text-sm text-[#0B0B0B]/80 font-sans font-light leading-relaxed">
                      {t('plan_select_sub')}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-sm font-sans text-[#0B0B0B]/90">
                      <li className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_select_1')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_select_2')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_select_3')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_select_4')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{t('plans_feat_select_5')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('select', 'agencias', isYearly)}
                      className="w-full py-4 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.25em] uppercase font-bold hover:bg-[#8C6B2F] transition-all block cursor-pointer shadow-lg"
                    >
                      <span>{t('plans_subscribe_btn').replace('{plan}', 'Select')}</span>
                    </Link>
                  </div>
                </div>

                {/* Lumiardi Signature */}
                <div className="bg-[#0B0B0B] text-ivory border-2 border-[#C9A96B] p-10 shadow-2xl space-y-8 relative flex flex-col justify-between">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A96B] text-[#0B0B0B] text-[9px] uppercase tracking-[0.25em] font-bold px-4 py-1 shadow-md">
                    {t('plan_sig_rec_badge')}
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] bg-[#C9A96B]/15 border border-[#C9A96B]/30 px-3 py-1 font-sans font-semibold inline-block">
                        {t('plan_sig_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-4xl font-light text-ivory">
                        {t('plan_sig_title')}
                      </h3>
                      <div className="space-y-0.5 pt-1">
                        <div className="text-3xl font-serif-lumiardi text-[#F5D77F]">
                          {isYearly ? 'R$ 441,00' : 'R$ 490,00'} <span className="text-xs font-sans text-ivory/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-ivory/50 font-sans block">
                          {isYearly ? t('plans_billed_annually').replace('{amount}', 'R$ 5.292,00') : t('plans_billed_monthly')}
                        </span>
                      </div>
                      <p className="font-serif-lumiardi italic text-lg text-[#C9A96B] pt-1">
                        {t('plan_sig_quote')}
                      </p>
                    </div>

                    <p className="text-sm text-ivory/80 font-sans font-light leading-relaxed">
                      {t('plan_sig_sub')}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-white/10 text-sm font-sans text-ivory/90">
                      <li className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{t('plans_feat_signature_1')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{t('plans_feat_signature_2')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{t('plans_feat_signature_3')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{t('plans_feat_signature_4')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <HardDrive className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{t('plans_feat_signature_5')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('signature', 'agencias', isYearly)}
                      className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] text-center text-xs tracking-[0.25em] uppercase font-bold hover:bg-[#D4B87A] transition-all block cursor-pointer shadow-xl"
                    >
                      <span>{t('plans_subscribe_btn').replace('{plan}', 'Signature')}</span>
                    </Link>
                  </div>
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

