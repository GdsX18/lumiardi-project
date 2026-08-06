'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { QualificationSteps } from '@/components/sections/QualificationSteps';
import { RevealText } from '@/components/animations/RevealText';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, ShieldCheck, UserCheck, Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function QualificacaoPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-black-matte text-ivory font-sans">
      <Header />

      {/* Barra de progresso de etapas */}
      <div className="fixed top-0 left-0 right-0 z-40 h-[3px] bg-bronze/20 mt-16">
        <div
          className="h-full bg-gradient-to-r from-[#8C6B2F] to-[#C9A96B] transition-all duration-700"
          style={{ width: '33%' }}
        />
      </div>

      {/* Hero da Página de Qualificação */}
      <section className="pt-36 pb-16 bg-[#0B0B0B] border-b border-bronze/20">
        <div className="max-w-4xl mx-auto text-center px-6 space-y-6">
          <Badge variant="gold">{t('qual_badge')}</Badge>
          <RevealText
            text={t('qual_title')}
            as="h1"
            className="font-serif-lumiardi text-4xl md:text-6xl font-light text-ivory"
          />
          <p className="text-sm md:text-base text-ivory/70 font-sans max-w-2xl mx-auto leading-relaxed">
            {t('qual_desc')}
          </p>

          <QualificationSteps currentStep={1} />

          {/* Resumo do processo + CTA de candidatura */}
          <div className="mt-4 space-y-6 max-w-2xl mx-auto">
            <p className="text-sm text-ivory/60 font-sans leading-relaxed border-t border-bronze/20 pt-6">
              {t('qual_summary_desc')}
            </p>

            <button
              id="qual-cta-start"
              onClick={() => {
                const formSection = document.getElementById('qual-form-section');
                if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative overflow-hidden inline-flex items-center gap-3 px-8 py-4 bg-[#C9A96B] text-[#0B0B0B] font-sans text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#D4B87A] transition-all duration-300 shadow-lg hover:shadow-gold/20 group cursor-pointer"
            >
              {/* Shimmer sweep */}
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 animate-shimmer pointer-events-none"
                aria-hidden
              />
              <span>{t('qual_btn_start_candidacy')}</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5] transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Seção Identidade e Intenção na Entrevista Inicial */}
      <SectionWrapper bg="light" id="qual-form-section">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-bronze font-semibold">
              {t('qual_sub_tag')}
            </span>
            <h2 className="font-serif-lumiardi text-3xl md:text-5xl text-black-matte">
              {t('qual_sub_title')}
            </h2>
            <p className="text-sm text-black-matte/70 max-w-xl mx-auto">
              {t('qual_sub_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="p-8 bg-white border border-black-matte/10 space-y-4">
              <div className="p-3 bg-bronze/10 w-fit text-bronze">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif-lumiardi text-2xl font-medium text-black-matte">
                {t('qual_step1_title')}
              </h3>
              <p className="text-xs text-black-matte/75 leading-relaxed font-sans">
                {t('qual_step1_desc')}
              </p>
            </div>

            <div className="p-8 bg-white border border-black-matte/10 space-y-4">
              <div className="p-3 bg-bronze/10 w-fit text-bronze">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif-lumiardi text-2xl font-medium text-black-matte">
                {t('qual_step2_title')}
              </h3>
              <p className="text-xs text-black-matte/75 leading-relaxed font-sans">
                {t('qual_step2_desc')}
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Seção Comunicação e Presença Digital */}
      <SectionWrapper bg="dark">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
              {t('qual_culture_tag')}
            </span>
            <h2 className="font-serif-lumiardi text-3xl md:text-5xl text-ivory">
              {t('qual_culture_title')}
            </h2>
            <p className="text-sm text-ivory/60 max-w-xl mx-auto">
              {t('qual_culture_desc')}
            </p>
          </div>

          <div className="p-8 bg-[#0E0E0E] border border-bronze/30 space-y-6">
            <div className="flex items-center gap-3 border-b border-bronze/20 pb-4">
              <Lock className="w-5 h-5 text-gold" />
              <span className="font-serif-lumiardi text-xl text-ivory">
                {t('qual_checklist_title')}
              </span>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-ivory/80">
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>{t('qual_c1')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>{t('qual_c2')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>{t('qual_c3')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>{t('qual_c4')}</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => router.push('/qualificacao/limites')}
            >
              {t('qual_btn_next')}
            </Button>
          </div>
        </div>
      </SectionWrapper>

      <Footer />
    </main>
  );
}
