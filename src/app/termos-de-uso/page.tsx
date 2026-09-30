'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  Scale,
  ShieldAlert,
  Lock,
  FileCheck,
  AlertTriangle,
  Users,
  CreditCard,
  EyeOff,
  Gavel,
  CheckCircle2,
  FileText,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const VERSION_DATE = new Date(2026, 7, 24);

export default function TermosDeUsoPage() {
  const { t, formatDate } = useLanguage();
  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-28 max-w-5xl mx-auto px-6 md:px-12 space-y-16">
        {/* Cabeçalho Editorial */}
        <header className="text-center space-y-5 border-b border-white/10 pb-12 relative">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[11px] font-sans uppercase tracking-[0.3em]">
            <Scale className="w-4 h-4 stroke-[1.5]" />
            <span>{t('lgd_terms_badge')}</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight leading-tight">
            {t('lgd_terms_title')}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-ivory/60 tracking-wider">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              {t('lgd_version_label')} {formatDate(VERSION_DATE, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-full uppercase">
              {t('lgd_terms_rating')}
            </span>
            <span className="px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] rounded-full">
              LUMIARDI GESTÃO DE CONTEÚDO LTDA.
            </span>
          </div>
        </header>

        {/* Resumo de Destaque / Aviso de Maioridade */}
        <div className="p-6 md:p-8 bg-[#0D0D0D] border border-red-500/30 rounded-lg space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <div className="flex items-center gap-3 text-red-400 font-semibold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{t('lgd_terms_age_title')}</span>
          </div>
          <p className="text-xs md:text-sm text-ivory/80 font-light leading-relaxed">
            {t('lgd_terms_age_body')}
          </p>
        </div>

        {/* Navegação Rápida por Tópicos */}
        <nav className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C9A96B] font-semibold block">
            {t('lgd_terms_toc_title')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-ivory/70">
            <a href="#sec-1" className="hover:text-[#C9A96B] transition-colors">1. {t('lgd_terms_toc_1')}</a>
            <a href="#sec-2" className="hover:text-[#C9A96B] transition-colors">2. {t('lgd_terms_toc_2')}</a>
            <a href="#sec-3" className="hover:text-[#C9A96B] transition-colors">3. {t('lgd_terms_toc_3')}</a>
            <a href="#sec-4" className="hover:text-[#C9A96B] transition-colors">4. {t('lgd_terms_toc_4')}</a>
            <a href="#sec-5" className="hover:text-[#C9A96B] transition-colors">5. {t('lgd_terms_toc_5')}</a>
            <a href="#sec-6" className="hover:text-[#C9A96B] transition-colors">6. {t('lgd_terms_toc_6')}</a>
            <a href="#sec-7" className="hover:text-[#C9A96B] transition-colors">7. {t('lgd_terms_toc_7')}</a>
            <a href="#sec-8" className="hover:text-[#C9A96B] transition-colors">8. {t('lgd_terms_toc_8')}</a>
            <a href="#sec-9" className="hover:text-[#C9A96B] transition-colors">9. {t('lgd_terms_toc_9')}</a>
            <a href="#sec-10" className="hover:text-[#C9A96B] transition-colors">10. {t('lgd_terms_toc_10')}</a>
            <a href="#sec-11" className="hover:text-[#C9A96B] transition-colors">11. {t('lgd_terms_toc_11')}</a>
            <a href="#sec-12" className="hover:text-[#C9A96B] transition-colors">12. {t('lgd_terms_toc_12')}</a>
            <a href="#sec-13" className="hover:text-[#C9A96B] transition-colors">13. {t('lgd_terms_toc_13')}</a>
            <a href="#sec-14" className="hover:text-[#C9A96B] transition-colors">14. {t('lgd_terms_toc_14')}</a>
            <a href="#sec-15" className="hover:text-[#C9A96B] transition-colors">15. {t('lgd_terms_toc_15')}</a>
            <a href="#sec-16" className="hover:text-[#C9A96B] transition-colors">16. {t('lgd_terms_toc_16')}</a>
            <a href="#sec-17" className="hover:text-[#C9A96B] transition-colors">17. {t('lgd_terms_toc_17')}</a>
            <a href="#sec-18" className="hover:text-[#C9A96B] transition-colors">18. {t('lgd_terms_toc_18')}</a>
            <a href="#sec-19" className="hover:text-[#C9A96B] transition-colors">19. {t('lgd_terms_toc_19')}</a>
            <a href="#sec-20" className="hover:text-[#C9A96B] transition-colors">20. {t('lgd_terms_toc_20')}</a>
          </div>
        </nav>

        {/* Corpo dos Termos de Uso */}
        <div className="space-y-12 text-sm md:text-[15px] text-ivory/85 font-light leading-relaxed font-sans">

          {/* Seção 1 */}
          <section id="sec-1" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal flex items-center gap-3">
              <span>1. {t('lgd_terms_s1_title')}</span>
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>1.1.</strong> {t('lgd_terms_s1_p1_a')} <strong>LUMIARDI GESTÃO DE CONTEÚDO LTDA.</strong>{t('lgd_terms_s1_p1_b')} <strong>LUMIARDI</strong>.
              </p>
              <p>
                <strong>1.2.</strong> {t('lgd_terms_s1_p2')}
              </p>
              <p>
                <strong>1.3.</strong> {t('lgd_terms_s1_p3')}
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-ivory/75">
                <li><Link href="/politica-privacidade" className="text-[#C9A96B] hover:underline">{t('lgd_terms_s1_l1')}</Link>;</li>
                <li>{t('lgd_terms_s1_l2')}</li>
                <li>{t('lgd_terms_s1_l3')}</li>
                <li>{t('lgd_terms_s1_l4')}</li>
                <li>{t('lgd_terms_s1_l5')}</li>
              </ul>
              <p>
                <strong>1.4.</strong> {t('lgd_terms_s1_p4')}
              </p>
            </div>
          </section>

          {/* Seção 2 */}
          <section id="sec-2" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              2. {t('lgd_terms_s2_title')}
            </h2>
            <div className="space-y-2.5 pl-4 border-l-2 border-[#C9A96B]/30">
              <p><strong>2.1.</strong> {t('lgd_terms_s2_p1')}</p>
              <ul className="space-y-2 text-ivory/80">
                {([['lgd_terms_s2_d1_term', 'lgd_terms_s2_d1_desc'], ['lgd_terms_s2_d2_term', 'lgd_terms_s2_d2_desc'], ['lgd_terms_s2_d3_term', 'lgd_terms_s2_d3_desc'], ['lgd_terms_s2_d4_term', 'lgd_terms_s2_d4_desc'], ['lgd_terms_s2_d5_term', 'lgd_terms_s2_d5_desc'], ['lgd_terms_s2_d6_term', 'lgd_terms_s2_d6_desc'], ['lgd_terms_s2_d7_term', 'lgd_terms_s2_d7_desc']]).map(([k, d]) => (
                  <li key={k}><strong className="text-ivory">{t(k)}</strong> {t(d)}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Seção 3 */}
          <section id="sec-3" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              3. {t('lgd_terms_s3_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>3.1.</strong> {t('lgd_terms_s3_p1')}
              </p>
              <p>
                <strong>3.2.</strong> {t('lgd_terms_s3_p2_a')} <strong>{t('lgd_terms_s3_p2_b')}</strong>{t('lgd_terms_s3_p2_c')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm py-2">
                {['lgd_terms_s3_n1', 'lgd_terms_s3_n2', 'lgd_terms_s3_n3', 'lgd_terms_s3_n4', 'lgd_terms_s3_n5', 'lgd_terms_s3_n6'].map((k) => (
                  <div key={k} className="p-2.5 bg-white/5 border border-white/10 rounded">✕ {t(k)}</div>
                ))}
              </div>
              <p>
                <strong>3.3.</strong> {t('lgd_terms_s3_p3')}
              </p>
              <p>
                <strong>3.4.</strong> {t('lgd_terms_s3_p4')}
              </p>
              <p>
                <strong>3.5.</strong> {t('lgd_terms_s3_p5')}
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section id="sec-4" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-red-400 font-normal flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <span>4. {t('lgd_terms_s4_title')}</span>
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-red-500/40">
              <p>
                <strong>4.1.</strong> {t('lgd_terms_s4_p1_a')} <strong>{t('lgd_terms_s4_p1_b')}</strong>.
              </p>
              <p>
                <strong>4.2.</strong> {t('lgd_terms_s4_p2')}
              </p>
              <p>
                <strong>4.3.</strong> {t('lgd_terms_s4_p3')}
              </p>
              <p>
                <strong>4.4.</strong> {t('lgd_terms_s4_p4')}
              </p>
              <p>
                <strong>4.5.</strong> {t('lgd_terms_s4_p5')}
              </p>
            </div>
          </section>

          {/* Seção 5 */}
          <section id="sec-5" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              5. {t('lgd_terms_s5_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>5.1.</strong> {t('lgd_terms_s5_p1')}
              </p>
              <p>
                <strong>5.2.</strong> {t('lgd_terms_s5_p2')}
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                {['lgd_terms_s5_l1', 'lgd_terms_s5_l2', 'lgd_terms_s5_l3', 'lgd_terms_s5_l4', 'lgd_terms_s5_l5', 'lgd_terms_s5_l6', 'lgd_terms_s5_l7'].map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ul>
              <p>
                <strong>5.3.</strong> {t('lgd_terms_s5_p3')}
              </p>
            </div>
          </section>

          {/* Seção 6 */}
          <section id="sec-6" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              6. {t('lgd_terms_s6_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>6.1.</strong> {t('lgd_terms_s6_p1')}
              </p>
              <p>
                <strong>6.2.</strong> {t('lgd_terms_s6_p2')}
              </p>
              <p>
                <strong>6.3.</strong> {t('lgd_terms_s6_p3')}
              </p>
            </div>
          </section>

          {/* Seção 7 */}
          <section id="sec-7" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              7. {t('lgd_terms_s7_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>7.1.</strong> {t('lgd_terms_s7_p1')}
              </p>
              <p>
                <strong>7.2.</strong> {t('lgd_terms_s7_p2')}
              </p>
              <p>
                <strong>7.3.</strong> {t('lgd_terms_s7_p3')}
              </p>
            </div>
          </section>

          {/* Seção 8 - Proibições */}
          <section id="sec-8" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-red-400 font-normal flex items-center gap-2.5">
              <EyeOff className="w-6 h-6 shrink-0" />
              <span>8. {t('lgd_terms_s8_title')}</span>
            </h2>
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg space-y-3 text-ivory/90">
              <p className="font-medium text-red-300 text-xs uppercase tracking-wider">
                {t('lgd_terms_s8_intro')}
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                {['lgd_terms_s8_l1', 'lgd_terms_s8_l2', 'lgd_terms_s8_l3', 'lgd_terms_s8_l4', 'lgd_terms_s8_l5', 'lgd_terms_s8_l6', 'lgd_terms_s8_l7', 'lgd_terms_s8_l8'].map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-300 pt-2 border-t border-red-500/20">
                {t('lgd_terms_s8_note')}
              </p>
            </div>
          </section>

          {/* Seção 9 */}
          <section id="sec-9" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              9. {t('lgd_terms_s9_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>9.1.</strong> {t('lgd_terms_s9_p1')}
              </p>
              <p>
                <strong>9.2.</strong> {t('lgd_terms_s9_p2')}
              </p>
              <p>
                <strong>9.3.</strong> {t('lgd_terms_s9_p3')}
              </p>
              <p>
                <strong>9.4.</strong> {t('lgd_terms_s9_p4')}
              </p>
              <p>
                <strong>9.5.</strong> {t('lgd_terms_s9_p5')}
              </p>
            </div>
          </section>

          {/* Seção 10 */}
          <section id="sec-10" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              10. {t('lgd_terms_s10_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>10.1.</strong> {t('lgd_terms_s10_p1')}
              </p>
              <p>
                <strong>10.2.</strong> {t('lgd_terms_s10_p2')}
              </p>
              <p>
                <strong>10.3.</strong> {t('lgd_terms_s10_p3')}
              </p>
              <p>
                <strong>10.4.</strong> {t('lgd_terms_s10_p4')}
              </p>
            </div>
          </section>

          {/* Seção 11 */}
          <section id="sec-11" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              11. {t('lgd_terms_s11_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>11.1.</strong> {t('lgd_terms_s11_p1')}
              </p>
              <p>
                <strong>11.2.</strong> {t('lgd_terms_s11_p2')}
              </p>
              <p>
                <strong>11.3.</strong> {t('lgd_terms_s11_p3')}
              </p>
              <p>
                <strong>11.4.</strong> {t('lgd_terms_s11_p4')}
              </p>
            </div>
          </section>

          {/* Seção 12 */}
          <section id="sec-12" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              12. {t('lgd_terms_s12_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>12.1.</strong> {t('lgd_terms_s12_p1')}
              </p>
              <p>
                <strong>12.2.</strong> {t('lgd_terms_s12_p2')}
              </p>
            </div>
          </section>

          {/* Seção 13 */}
          <section id="sec-13" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              13. {t('lgd_terms_s13_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                {t('lgd_terms_s13_intro')}
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                {['lgd_terms_s13_l1', 'lgd_terms_s13_l2', 'lgd_terms_s13_l3', 'lgd_terms_s13_l4', 'lgd_terms_s13_l5', 'lgd_terms_s13_l6', 'lgd_terms_s13_l7'].map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Seção 14 */}
          <section id="sec-14" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal flex items-center justify-between">
              <span>14. {t('lgd_terms_s14_title')}</span>
              <Link
                href="/portal"
                className="text-xs font-sans text-[#C9A96B] border border-[#C9A96B]/40 px-3 py-1 hover:bg-[#C9A96B] hover:text-[#0B0B0B] transition-all"
              >
                {t('lgd_terms_s14_portal_cta')} →
              </Link>
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>14.1.</strong> {t('lgd_terms_s14_p1_a')} <Link href="/portal" className="text-[#C9A96B] underline">{t('lgd_terms_s14_p1_link')}</Link> {t('lgd_terms_s14_p1_b')}
              </p>
              <p>
                <strong>14.2.</strong> {t('lgd_terms_s14_p2')}
              </p>
              <p>
                <strong>14.3.</strong> {t('lgd_terms_s14_p3')}
              </p>
            </div>
          </section>

          {/* Seção 15 */}
          <section id="sec-15" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              15. {t('lgd_terms_s15_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>15.1.</strong> {t('lgd_terms_s15_p1_a')} <strong>LUMIARDI</strong>{t('lgd_terms_s15_p1_b')} <strong>LUMIARDI GESTÃO DE CONTEÚDO LTDA.</strong>
              </p>
              <p>
                <strong>15.2.</strong> {t('lgd_terms_s15_p2')}
              </p>
            </div>
          </section>

          {/* Seção 16 */}
          <section id="sec-16" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              16. {t('lgd_terms_s16_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>16.1.</strong> {t('lgd_terms_s16_p1')}
              </p>
            </div>
          </section>

          {/* Seção 17 */}
          <section id="sec-17" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              17. {t('lgd_terms_s17_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>17.1.</strong> {t('lgd_terms_s17_p1')}
              </p>
              <p>
                <strong>17.2.</strong> {t('lgd_terms_s17_p2')}
              </p>
            </div>
          </section>

          {/* Seção 18 */}
          <section id="sec-18" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              18. {t('lgd_terms_s18_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>18.1.</strong> {t('lgd_terms_s18_p1_a')} <Link href="/politica-privacidade" className="text-[#C9A96B] underline font-medium">{t('lgd_terms_s18_p1_link')}</Link>{t('lgd_terms_s18_p1_b')}
              </p>
            </div>
          </section>

          {/* Seção 19 */}
          <section id="sec-19" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              19. {t('lgd_terms_s19_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>19.1.</strong> {t('lgd_terms_s19_p1')}
              </p>
            </div>
          </section>

          {/* Seção 20 */}
          <section id="sec-20" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              20. {t('lgd_terms_s20_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>20.1.</strong> {t('lgd_terms_s20_p1')}
              </p>
              <p>
                <strong>20.2.</strong> {t('lgd_terms_s20_p2')}
              </p>
            </div>
          </section>

        </div>

        {/* Rodapé Interno com Dados Oficiais */}
        <div className="pt-12 border-t border-white/10 space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-ivory/70">
            <div className="space-y-1">
              <p className="text-ivory font-medium">LUMIARDI GESTÃO DE CONTEÚDO LTDA.</p>
              <p>Av. Alm. Julio de Sá Bierrenbach, 65 – Bloco 2 – Sala 315 – Barra Olímpica/RJ</p>
              <p>{t('lgd_terms_footer_channel')} <a href="mailto:contact@lumiardi.com" className="text-[#C9A96B]">contact@lumiardi.com</a></p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/politica-privacidade"
                className="px-4 py-2 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 transition-all font-medium"
              >
                {t('lgd_link_privacy')} →
              </Link>
              <Link
                href="/portal"
                className="px-4 py-2 bg-[#C9A96B]/20 hover:bg-[#C9A96B] text-[#C9A96B] hover:text-[#0B0B0B] border border-[#C9A96B]/40 transition-all font-medium"
              >
                {t('lgd_link_portal')} →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
