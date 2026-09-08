'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  const institutionalLinks = [
    { label: t('footer_nav_positioning'), href: '/#posicionamento' },
    { label: t('footer_nav_values'), href: '/#pilares' },
    { label: t('footer_nav_contact'), href: '/contato' },
  ];

  const ecosystemLinks = [
    { label: t('footer_nav_agencies'), href: '/qualificacao/agencia' },
    { label: t('footer_nav_creators'), href: '/qualificacao' },
    { label: t('footer_nav_plans'), href: '/planos' },
    { label: t('footer_nav_login'), href: '/login' },
  ];

  const legalLinks = [
    { label: t('footer_legal_terms'), href: '/termos-de-uso' },
    { label: t('footer_legal_privacy'), href: '/politica-privacidade' },
    { label: t('footer_legal_portal'), href: '/portal' },
    { label: t('footer_legal_compliance'), href: '/compliance-2257' },
  ];

  return (
    <footer className="w-full bg-[#050505] text-ivory pt-20 pb-12 border-t border-gold/15 relative overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 flex flex-col">
        {/* Bloco Superior: Logo e Slogan */}
        <div className="flex flex-col items-center text-center mb-16 md:mb-20">
          <Link
            href="/"
            className="relative w-52 sm:w-64 md:w-72 h-16 sm:h-20 mb-6 block transition-transform duration-300 hover:scale-[1.02]"
            aria-label="LUMIARDI Home"
          >
            <Image
              src="/LUMIARDI - Logo Combinada trasparente.png"
              alt="LUMIARDI"
              fill
              className="object-contain"
              priority
            />
          </Link>

          <p className="font-serif-lumiardi italic text-[#C9A96B] text-lg sm:text-xl md:text-2xl font-light tracking-wide max-w-xl">
            &ldquo;{t('footer_slogan')}&rdquo;
          </p>
        </div>

        {/* Grid de Navegação Reestruturada em Colunas */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
          {/* Coluna 1: Institucional / Sobre */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-sans tracking-[0.25em] uppercase text-[#C9A96B] font-medium border-b border-white/[0.08] pb-2">
              {t('footer_col_institutional')}
            </h4>
            <ul className="space-y-3">
              {institutionalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-[13px] font-sans text-ivory/60 hover:text-[#C9A96B] transition-colors duration-200 tracking-wider font-light block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 2: Ecossistema */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-sans tracking-[0.25em] uppercase text-[#C9A96B] font-medium border-b border-white/[0.08] pb-2">
              {t('footer_col_ecosystem')}
            </h4>
            <ul className="space-y-3">
              {ecosystemLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-[13px] font-sans text-ivory/60 hover:text-[#C9A96B] transition-colors duration-200 tracking-wider font-light block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Compliance & Legal */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <h4 className="text-[11px] font-sans tracking-[0.25em] uppercase text-[#C9A96B] font-medium border-b border-white/[0.08] pb-2">
              {t('footer_col_legal')}
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-[13px] font-sans text-ivory/60 hover:text-[#C9A96B] transition-colors duration-200 tracking-wider font-light block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Linha Divisória com espaçamento simétrico */}
        <div className="w-full h-px bg-white/10 my-10 md:my-12" />

        {/* Barra Inferior (Sub-footer) com Direitos, Endereço e Seletor de Idioma */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-ivory/45 font-sans tracking-wider font-light">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>
              © {new Date().getFullYear()} {t('footer_company_name')}. {t('footer_rights')}
            </span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>{t('footer_address')}</span>
          </div>

          <div className="shrink-0">
            <LanguageSelector direction="up" />
          </div>
        </div>
      </div>
    </footer>
  );
};
