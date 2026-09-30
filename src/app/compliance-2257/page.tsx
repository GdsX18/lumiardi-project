'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { ShieldCheck, FileCheck2, Scale } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Compliance2257Page() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-24 max-w-4xl mx-auto px-6 md:px-8 space-y-12">
        {/* Cabeçalho */}
        <div className="text-center space-y-4 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[10px] font-sans uppercase tracking-[0.3em]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('lgm_2257_tag')}</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl font-light text-ivory tracking-tight">
            {t('lgm_2257_title')}
          </h1>
          <p className="text-xs font-sans text-ivory/60 uppercase tracking-widest">
            {t('lgm_2257_subtitle')}
          </p>
        </div>

        {/* Conteúdo Jurídico */}
        <div className="space-y-8 text-sm text-ivory/80 font-light leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              {t('lgm_2257_s1_title')}
            </h2>
            <p>
              {t('lgm_2257_s1_before')} <strong>{t('footer_company_name')}</strong> {t('lgm_2257_s1_after')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              {t('lgm_2257_s2_title')}
            </h2>
            <p>
              {t('lgm_2257_s2_text')}
            </p>
            <div className="p-4 bg-[#141414] border border-white/10 space-y-1 text-xs font-mono text-ivory/70">
              <p><strong>{t('lgm_2257_custodian_label')}</strong> Lumiardi Compliance & Legal Affairs Department</p>
              <p><strong>{t('lgm_2257_address_label')}</strong> Av. Brigadeiro Faria Lima, São Paulo - SP, Brasil</p>
              <p><strong>{t('lgm_2257_email_label')}</strong> compliance@lumiardi.com</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              {t('lgm_2257_s3_title')}
            </h2>
            <p>
              {t('lgm_2257_s3_text')}
            </p>
          </section>
        </div>

        {/* Links Rápidos */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-xs">
          <div className="flex gap-4">
            <Link href="/termos" className="text-[#C9A96B] hover:underline">
              ← {t('footer_legal_terms')}
            </Link>
            <Link href="/privacidade" className="text-[#C9A96B] hover:underline">
              {t('lgm_2257_link_privacy')} →
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 transition-all font-semibold uppercase tracking-wider"
          >
            {t('lgm_2257_back_dashboard')}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
