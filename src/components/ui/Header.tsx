'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { CreatorBenefitsModal } from './CreatorBenefitsModal';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Previne scroll do body quando o drawer estiver aberto
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [drawerOpen]);

  const navLinks: { label: string; href: string; isCreator?: boolean }[] = [
    { label: t('nav_creators'), href: '/#vitrine', isCreator: true },
    { label: t('nav_agencies'), href: '/qualificacao/agencia' },
    { label: t('nav_ecosystem'), href: '/#ecossistema' },
    { label: 'PARCEIROS', href: '/#parceiros' },
    { label: t('nav_plans'), href: '/planos' },
  ];

  const drawerMainLinks: { label: string; href: string; isCreator?: boolean }[] = [
    { label: t('nav_creators'), href: '/#vitrine', isCreator: true },
    { label: t('nav_agencies'), href: '/qualificacao/agencia' },
    { label: t('nav_ecosystem'), href: '/#ecossistema' },
    { label: 'PARCEIROS', href: '/#parceiros' },
    { label: t('nav_plans'), href: '/planos' },
    { label: t('nav_login'), href: '/qualificacao' },
  ];

  const drawerShortcuts = [
    {
      title: t('drawer_creators_title'),
      subtitle: t('drawer_creators_sub'),
      image: '/images/creator_elena.jpg',
      href: '/qualificacao',
    },
    {
      title: t('drawer_agencies_title'),
      subtitle: t('drawer_agencies_sub'),
      image: '/images/agency_aura.jpg',
      href: '/qualificacao/agencia',
    },
    {
      title: t('drawer_dashboard_title'),
      subtitle: t('drawer_dashboard_sub'),
      image: '/images/agency_vanguard.jpg',
      href: '/dashboard',
    },
  ];

  const handleNavigate = (href: string) => {
    setDrawerOpen(false);

    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '');
      if (pathname === '/') {
        window.dispatchEvent(new Event('lumiardi-expand-hero'));
        const targetEl = document.getElementById(sectionId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      window.location.href = href;
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          NAVBAR SUPERIOR (Transparente estilo David Trubridge)
      ═══════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          scrolled
            ? 'bg-black/30 backdrop-blur-md py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 flex items-center justify-between">
          
          {/* LADO ESQUERDO: Brand Logo Clean */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-7 h-7 md:w-8 md:h-8 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/Lumiardi logo2-Trasparente.png"
                alt="Lumiardi Emblem"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-serif-lumiardi text-lg md:text-xl font-light tracking-[0.25em] text-ivory group-hover:text-gold uppercase transition-colors">
              LUMIARDI
            </span>
          </Link>

          {/* CENTRO: Links diretos minimalistas (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.isCreator ? setCreatorModalOpen(true) : handleNavigate(link.href)}
                className="font-sans text-xs tracking-[0.25em] text-ivory/80 hover:text-gold uppercase font-light transition-colors relative group py-1 cursor-pointer"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* LADO DIREITO: Seletor de Idioma + Entrar + Ícone Hambúrguer */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Seletor de Idioma */}
            <div className="hidden sm:flex items-center">
              <LanguageSelector />
            </div>

            {/* Botão Entrar */}
            <button
              onClick={() => handleNavigate('/qualificacao')}
              className="hidden sm:flex items-center gap-1.5 text-xs tracking-[0.2em] text-ivory/90 hover:text-gold uppercase font-sans font-light transition-colors cursor-pointer"
            >
              <span>{t('nav_login')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.2]" />
            </button>

            {/* Botão Hambúrguer (Duas linhas horizontais paralelas finas) */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-3 text-xs tracking-[0.25em] text-ivory hover:text-gold uppercase font-sans font-light transition-colors cursor-pointer group p-1"
              aria-label={t('drawer_open')}
            >
              <span className="hidden xs:inline">{t('nav_menu')}</span>
              <div className="flex flex-col gap-1.5 w-6">
                <span className="w-full h-[1.5px] bg-ivory group-hover:bg-gold transition-colors duration-300" />
                <span className="w-full h-[1.5px] bg-ivory group-hover:bg-gold transition-colors duration-300" />
              </div>
            </button>
          </div>

        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════
          MENU LATERAL EXPANSÍVEL (Editorial Drawer estilo David Trubridge)
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[100] flex">
            {/* Backdrop escuro à direita */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-10"
            />

            {/* Painel do Drawer (Desliza da esquerda) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full max-w-4xl h-full flex flex-col md:flex-row shadow-2xl overflow-y-auto md:overflow-hidden"
            >
              {/* ── COLUNA 1: Fundo Branco (#FFFFFF) com Links Principais ── */}
              <div className="w-full md:w-1/2 bg-white text-black-matte p-8 md:p-12 flex flex-col justify-between min-h-[500px] border-r border-black/5">
                <div>
                  {/* Topo Coluna 1 */}
                  <div className="flex items-center justify-between mb-12">
                    <span className="font-sans text-xl md:text-2xl font-light text-black-matte tracking-tight">
                      {t('drawer_menu_title')}
                    </span>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="p-2 text-black-matte/60 hover:text-black-matte transition-colors cursor-pointer"
                      aria-label={t('drawer_close')}
                    >
                      <X className="w-5 h-5 stroke-[1.5]" />
                    </button>
                  </div>

                  {/* Lista de Links Grandes (Clean Sans-Serif) */}
                  <nav className="flex flex-col space-y-4 md:space-y-6">
                    {drawerMainLinks.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => link.isCreator ? (setDrawerOpen(false), setCreatorModalOpen(true)) : handleNavigate(link.href)}
                        className="text-left font-sans text-2xl md:text-3xl font-light text-[#1A1A1A] hover:text-[#C9A96B] transition-colors tracking-tight cursor-pointer"
                      >
                        {link.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Footer da Coluna 1 */}
                <div className="pt-8 border-t border-black/10 flex items-center justify-between text-xs text-black-matte/50 font-sans tracking-wider uppercase">
                  <span>LUMIARDI &bull; ECOSYSTEM</span>
                  <span>SÃO PAULO / PARIS</span>
                </div>
              </div>

              {/* ── COLUNA 2: Fundo Marfim Suave (#F7F3EC) com Destaques Visuais ── */}
              <div className="w-full md:w-1/2 bg-[#F7F3EC] text-black-matte p-8 md:p-12 flex flex-col justify-between min-h-[500px]">
                <div>
                  {/* Topo Coluna 2 (Botão X secundário para telas md+) */}
                  <div className="hidden md:flex justify-end mb-8">
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="p-2 text-black-matte/60 hover:text-black-matte transition-colors cursor-pointer"
                      aria-label={t('drawer_close')}
                    >
                      <X className="w-5 h-5 stroke-[1.5]" />
                    </button>
                  </div>

                  {/* Cards de Atalho com Imagens Finas & Divisórias (estilo David Trubridge) */}
                  <div className="space-y-6">
                    {drawerShortcuts.map((item) => (
                      <div
                        key={item.title}
                        onClick={() => handleNavigate(item.href)}
                        className="group flex items-center justify-between pb-6 border-b border-black/10 cursor-pointer"
                      >
                        <div>
                          <h4 className="font-sans text-base md:text-lg font-light text-black-matte group-hover:text-[#C9A96B] transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-black-matte/50 font-sans mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* Mini Imagem Visual */}
                        <div className="relative w-16 h-16 md:w-20 md:h-20 bg-black/5 overflow-hidden shrink-0 border border-black/10">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Coluna 2 */}
                <div className="pt-6 text-[11px] text-black-matte/40 font-sans uppercase tracking-widest text-right">
                  {t('drawer_footer_right')}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreatorBenefitsModal open={creatorModalOpen} onClose={() => setCreatorModalOpen(false)} />
    </>
  );
};
