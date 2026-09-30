'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  Lock,
  ShieldCheck,
  Database,
  Key,
  Server,
  Users,
  FileCheck,
  AlertCircle,
  Mail,
  Building,
  CheckCircle2,
  Cpu,
  Globe,
  Cookie,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const VERSION_DATE = new Date(2026, 7, 24);

export default function PoliticaPrivacidadePage() {
  const { t, formatDate } = useLanguage();
  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-28 max-w-5xl mx-auto px-6 md:px-12 space-y-16">
        {/* Cabeçalho Editorial */}
        <header className="text-center space-y-5 border-b border-white/10 pb-12 relative">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[11px] font-sans uppercase tracking-[0.3em]">
            <Lock className="w-4 h-4 stroke-[1.5]" />
            <span>{t('lgd_priv_badge')}</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight leading-tight">
            {t('lgd_priv_title')}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-ivory/60 tracking-wider">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              {t('lgd_version_label')} {formatDate(VERSION_DATE, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] rounded-full">
              {t('lgd_priv_law_badge')}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              {t('lgd_priv_anpd_resolution')}
            </span>
          </div>
        </header>

        {/* Quadro Institucional do Controlador */}
        <div className="p-6 md:p-8 bg-[#0D0D0D] border border-[#C9A96B]/30 rounded-lg space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A96B]" />
          <div className="flex items-center gap-3 text-[#C9A96B] font-semibold text-sm uppercase tracking-wider">
            <Building className="w-5 h-5 shrink-0" />
            <span>{t('lgd_priv_controller_box_title')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-ivory/80">
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgd_priv_legal_name')}</p>
              <p className="font-medium text-ivory">LUMIARDI GESTÃO DE CONTEÚDO LTDA.</p>
            </div>
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgd_priv_headquarters')}</p>
              <p className="text-ivory/90">Av. Alm. Julio de Sá Bierrenbach, 65 – Bloco 2 – Sala 315 – Barra Olímpica/RJ</p>
            </div>
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgd_priv_dpo_channel')}</p>
              <p><a href="mailto:contact@lumiardi.com" className="text-[#C9A96B] hover:underline font-mono">contact@lumiardi.com</a></p>
            </div>
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgd_priv_audience')}</p>
              <p className="text-ivory/90 font-medium">{t('lgd_priv_audience_value')}</p>
            </div>
          </div>
        </div>

        {/* Índice Geral */}
        <nav className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C9A96B] font-semibold block">
            {t('lgd_priv_toc_title')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-ivory/70">
            <a href="#sec-1" className="hover:text-[#C9A96B] transition-colors">1. {t('lgd_priv_toc_1')}</a>
            <a href="#sec-2" className="hover:text-[#C9A96B] transition-colors">2. {t('lgd_priv_toc_2')}</a>
            <a href="#sec-3" className="hover:text-[#C9A96B] transition-colors">3. {t('lgd_priv_toc_3')}</a>
            <a href="#sec-4" className="hover:text-[#C9A96B] transition-colors">4. {t('lgd_priv_toc_4')}</a>
            <a href="#sec-5" className="hover:text-[#C9A96B] transition-colors">5. {t('lgd_priv_toc_5')}</a>
            <a href="#sec-6" className="hover:text-[#C9A96B] transition-colors">6. {t('lgd_priv_toc_6')}</a>
            <a href="#sec-7" className="hover:text-[#C9A96B] transition-colors">7. {t('lgd_priv_toc_7')}</a>
            <a href="#sec-8" className="hover:text-[#C9A96B] transition-colors">8. {t('lgd_priv_toc_8')}</a>
            <a href="#sec-9" className="hover:text-[#C9A96B] transition-colors">9. {t('lgd_priv_toc_9')}</a>
            <a href="#sec-10" className="hover:text-[#C9A96B] transition-colors">10. {t('lgd_priv_toc_10')}</a>
            <a href="#sec-11" className="hover:text-[#C9A96B] transition-colors">11. {t('lgd_priv_toc_11')}</a>
            <a href="#sec-12" className="hover:text-[#C9A96B] transition-colors">12. {t('lgd_priv_toc_12')}</a>
            <a href="#sec-13" className="hover:text-[#C9A96B] transition-colors">13. {t('lgd_priv_toc_13')}</a>
            <a href="#sec-14" className="hover:text-[#C9A96B] transition-colors">14. {t('lgd_priv_toc_14')}</a>
            <a href="#sec-15" className="hover:text-[#C9A96B] transition-colors">15. {t('lgd_priv_toc_15')}</a>
            <a href="#sec-16" className="hover:text-[#C9A96B] transition-colors">16. {t('lgd_priv_toc_16')}</a>
            <a href="#sec-17" className="hover:text-[#C9A96B] transition-colors">17. {t('lgd_priv_toc_17')}</a>
            <a href="#sec-18" className="hover:text-[#C9A96B] transition-colors">18. {t('lgd_priv_toc_18')}</a>
          </div>
        </nav>

        {/* Corpo da Política */}
        <div className="space-y-12 text-sm md:text-[15px] text-ivory/85 font-light leading-relaxed font-sans">

          {/* Seção 1 */}
          <section id="sec-1" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              1. {t('lgd_priv_s1_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                {t('lgd_priv_s1_p1_a')} <strong>LUMIARDI GESTÃO DE CONTEÚDO LTDA.</strong>{t('lgd_priv_s1_p1_b')}
              </p>
              <p>
                {t('lgd_priv_s1_p2')} <a href="mailto:contact@lumiardi.com" className="text-[#C9A96B] underline">contact@lumiardi.com</a>.
              </p>
            </div>
          </section>

          {/* Seção 2 */}
          <section id="sec-2" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              2. {t('lgd_priv_s2_title')}
            </h2>
            <div className="space-y-4 pl-4 border-l-2 border-[#C9A96B]/30">
              <p><strong>2.1.</strong> {t('lgd_priv_s2_p1')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.1. {t('lgd_priv_s2_c1_title')}</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    {['lgd_priv_s2_c1_l1', 'lgd_priv_s2_c1_l2', 'lgd_priv_s2_c1_l3', 'lgd_priv_s2_c1_l4', 'lgd_priv_s2_c1_l5', 'lgd_priv_s2_c1_l6'].map((k) => (
                      <li key={k}>{t(k)}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.2. {t('lgd_priv_s2_c2_title')}</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    {['lgd_priv_s2_c2_l1', 'lgd_priv_s2_c2_l2', 'lgd_priv_s2_c2_l3', 'lgd_priv_s2_c2_l4'].map((k) => (
                      <li key={k}>{t(k)}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.3. {t('lgd_priv_s2_c3_title')}</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    {['lgd_priv_s2_c3_l1', 'lgd_priv_s2_c3_l2', 'lgd_priv_s2_c3_l3', 'lgd_priv_s2_c3_l4', 'lgd_priv_s2_c3_l5'].map((k) => (
                      <li key={k}>{t(k)}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.4. {t('lgd_priv_s2_c4_title')}</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    {['lgd_priv_s2_c4_l1', 'lgd_priv_s2_c4_l2', 'lgd_priv_s2_c4_l3', 'lgd_priv_s2_c4_l4'].map((k) => (
                      <li key={k}>{t(k)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 3 */}
          <section id="sec-3" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              3. {t('lgd_priv_s3_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>3.1.</strong> {t('lgd_priv_s3_p1')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                {['lgd_priv_s3_i1', 'lgd_priv_s3_i2', 'lgd_priv_s3_i3', 'lgd_priv_s3_i4', 'lgd_priv_s3_i5', 'lgd_priv_s3_i6', 'lgd_priv_s3_i7', 'lgd_priv_s3_i8', 'lgd_priv_s3_i9', 'lgd_priv_s3_i10', 'lgd_priv_s3_i11', 'lgd_priv_s3_i12'].map((k) => (
                  <span key={k} className="p-2 bg-white/5 border border-white/10 rounded">• {t(k)}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section id="sec-4" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              4. {t('lgd_priv_s4_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>4.1.</strong> {t('lgd_priv_s4_p1')}
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-ivory/80">
                {([['lgd_priv_s4_b1_term', 'lgd_priv_s4_b1_desc'], ['lgd_priv_s4_b2_term', 'lgd_priv_s4_b2_desc'], ['lgd_priv_s4_b3_term', 'lgd_priv_s4_b3_desc'], ['lgd_priv_s4_b4_term', 'lgd_priv_s4_b4_desc'], ['lgd_priv_s4_b5_term', 'lgd_priv_s4_b5_desc'], ['lgd_priv_s4_b6_term', 'lgd_priv_s4_b6_desc']]).map(([k, d]) => (
                  <li key={k}><strong className="text-ivory">{t(k)}</strong> {t(d)}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Seção 5 */}
          <section id="sec-5" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              5. {t('lgd_priv_s5_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>5.1.</strong> {t('lgd_priv_s5_p1')}
              </p>
            </div>
          </section>

          {/* Seção 6 */}
          <section id="sec-6" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              6. {t('lgd_priv_s6_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>6.1.</strong> {t('lgd_priv_s6_p1')}
              </p>
              <p>
                <strong>6.2.</strong> {t('lgd_priv_s6_p2')}
              </p>
            </div>
          </section>

          {/* Seção 7 */}
          <section id="sec-7" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              7. {t('lgd_priv_s7_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>7.1.</strong> {t('lgd_priv_s7_p1')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                {['lgd_priv_s7_i1', 'lgd_priv_s7_i2', 'lgd_priv_s7_i3', 'lgd_priv_s7_i4', 'lgd_priv_s7_i5', 'lgd_priv_s7_i6', 'lgd_priv_s7_i7', 'lgd_priv_s7_i8', 'lgd_priv_s7_i9', 'lgd_priv_s7_i10'].map((k) => (
                  <span key={k} className="p-2 bg-white/5 border border-white/10 rounded">• {t(k)}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Seção 8 */}
          <section id="sec-8" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              8. {t('lgd_priv_s8_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>8.1.</strong> {t('lgd_priv_s8_p1')}
              </p>
            </div>
          </section>

          {/* Seção 9 */}
          <section id="sec-9" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              9. {t('lgd_priv_s9_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>9.1.</strong> {t('lgd_priv_s9_p1')}
              </p>
              <p>
                <strong>9.2.</strong> {t('lgd_priv_s9_p2')}
              </p>
            </div>
          </section>

          {/* Seção 10 */}
          <section id="sec-10" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              10. {t('lgd_priv_s10_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>10.1.</strong> {t('lgd_priv_s10_p1')}
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                {['lgd_priv_s10_l1', 'lgd_priv_s10_l2', 'lgd_priv_s10_l3', 'lgd_priv_s10_l4', 'lgd_priv_s10_l5'].map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Seção 11 */}
          <section id="sec-11" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              11. {t('lgd_priv_s11_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>11.1.</strong> {t('lgd_priv_s11_p1')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                {['lgd_priv_s11_i1', 'lgd_priv_s11_i2', 'lgd_priv_s11_i3', 'lgd_priv_s11_i4', 'lgd_priv_s11_i5', 'lgd_priv_s11_i6', 'lgd_priv_s11_i7', 'lgd_priv_s11_i8'].map((k) => (
                  <span key={k} className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">{t(k)}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Seção 12 */}
          <section id="sec-12" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              12. {t('lgd_priv_s12_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>12.1.</strong> {t('lgd_priv_s12_p1')}
              </p>
              <p>
                <strong>12.2.</strong> {t('lgd_priv_s12_p2')} <strong>{t('lgd_priv_anpd_resolution')}</strong>.
              </p>
            </div>
          </section>

          {/* Seção 13 */}
          <section id="sec-13" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              13. {t('lgd_priv_s13_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>13.1.</strong> {t('lgd_priv_s13_p1')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {['lgd_priv_s13_r1', 'lgd_priv_s13_r2', 'lgd_priv_s13_r3', 'lgd_priv_s13_r4', 'lgd_priv_s13_r5', 'lgd_priv_s13_r6', 'lgd_priv_s13_r7', 'lgd_priv_s13_r8'].map((k) => (
                  <div key={k} className="p-3 bg-white/5 border border-white/10 rounded">✓ {t(k)}</div>
                ))}
              </div>
            </div>
          </section>

          {/* Seção 14 */}
          <section id="sec-14" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              14. {t('lgd_priv_s14_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>14.1.</strong> {t('lgd_priv_s14_p1')}
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                {['lgd_priv_s14_l1', 'lgd_priv_s14_l2', 'lgd_priv_s14_l3', 'lgd_priv_s14_l4', 'lgd_priv_s14_l5'].map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Seção 15 */}
          <section id="sec-15" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-red-400 font-normal">
              15. {t('lgd_priv_s15_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-red-500/40">
              <p>
                <strong>15.1.</strong> {t('lgd_priv_s15_p1_a')} <strong>{t('lgd_priv_s15_p1_b')}</strong>.
              </p>
              <p>
                <strong>15.2.</strong> {t('lgd_priv_s15_p2')}
              </p>
            </div>
          </section>

          {/* Seção 16 & 17 */}
          <section id="sec-16" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              16. {t('lgd_priv_s16_title_a')} & 17. {t('lgd_priv_s16_title_b')}
            </h2>
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-3">
              <p>
                {t('lgd_priv_s16_p1_a')} <strong>{t('lgd_priv_s16_p1_b')}</strong>:
              </p>
              <div className="space-y-1 text-xs md:text-sm text-ivory/80 pt-2 font-mono">
                <p><strong>{t('lgd_priv_s16_dpo_label')}</strong> {t('lgd_priv_s16_dpo_value')}</p>
                <p><strong>{t('lgd_priv_s16_email_label')}</strong> <a href="mailto:contact@lumiardi.com" className="text-[#C9A96B] underline">contact@lumiardi.com</a></p>
                <p><strong>{t('lgd_priv_s16_address_label')}</strong> Av. Alm. Julio de Sá Bierrenbach, 65 – Bloco 2 – Sala 315 – Barra Olímpica/RJ</p>
              </div>
            </div>
          </section>

          {/* Seção 18 */}
          <section id="sec-18" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              18. {t('lgd_priv_s18_title')}
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>18.1.</strong> {t('lgd_priv_s18_p1')}
              </p>
            </div>
          </section>

        </div>

        {/* Rodapé Interno */}
        <div className="pt-12 border-t border-white/10 space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-ivory/70">
            <div className="space-y-1">
              <p className="text-ivory font-medium">LUMIARDI GESTÃO DE CONTEÚDO LTDA.</p>
              <p>{t('lgd_priv_footer_dpo')} <a href="mailto:contact@lumiardi.com" className="text-[#C9A96B]">contact@lumiardi.com</a></p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/termos-de-uso"
                className="px-4 py-2 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 transition-all font-medium"
              >
                {t('lgd_link_terms')} →
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
