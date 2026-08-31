'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#050505] text-ivory pt-24 pb-16 border-t border-gold/15 relative overflow-hidden">
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24 flex flex-col items-center">
        {/* Logo Combinada */}
        <div className="relative w-56 md:w-72 h-20 mb-8">
          <Image
            src="/LUMIARDI - Logo Combinada trasparente.png"
            alt="LUMIARDI Marca Completa"
            fill
            className="object-contain"
          />
        </div>

        <p className="text-center font-serif-lumiardi italic text-[#C9A96B] text-xl md:text-2xl max-w-lg mb-12 font-light">
          &ldquo;{t('footer_slogan')}&rdquo;
        </p>

        {/* Links de Navegação */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-14 mb-12">
          <Link href="/#posicionamento" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            {t('pos_tag')}
          </Link>
          <Link href="/#pilares" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            {t('pillars_tag')}
          </Link>
          <Link href="/#ecossistema" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            {t('nav_ecosystem')}
          </Link>
          <Link href="/#dashboard-showcase" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            {t('nav_agencies')}
          </Link>
          <Link href="/planos" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            {t('nav_plans')}
          </Link>
          <Link href="/qualificacao" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            {t('nav_login')}
          </Link>
        </div>

        {/* Seletor de Idioma no Footer */}
        <div className="mb-12">
          <LanguageSelector />
        </div>

        {/* Links Legais, Governança e Compliance */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mb-8 text-[11px] font-sans uppercase tracking-widest text-ivory/50">
          <Link href="/termos-de-uso" className="hover:text-[#C9A96B] transition-colors">
            Termos de Uso
          </Link>
          <span>·</span>
          <Link href="/politica-privacidade" className="hover:text-[#C9A96B] transition-colors">
            Política de Privacidade & LGPD
          </Link>
          <span>·</span>
          <Link href="/portal" className="hover:text-[#C9A96B] transition-colors text-[#C9A96B]/80 font-medium">
            Portal de Denúncias & Direitos
          </Link>
          <span>·</span>
          <Link href="/compliance-2257" className="hover:text-[#C9A96B] transition-colors">
            Conformidade 18 U.S.C. § 2257
          </Link>
        </div>

        <div className="w-full h-[1px] bg-white/10 mb-8" />

        {/* Rodapé inferior editorial institucional */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ivory/40 font-sans tracking-widest font-light">
          <span>© {new Date().getFullYear()} LUMIARDI GESTÃO DE CONTEÚDO LTDA. {t('footer_rights')}</span>
          <span className="font-serif-lumiardi italic text-[#C9A96B]/80 text-sm">{t('footer_platform_tag')}</span>
          <span>Av. Alm. Julio de Sá Bierrenbach, 65 · RJ</span>
        </div>
      </div>
    </footer>
  );
};
