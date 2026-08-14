'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { CreatorBenefitsModal } from './CreatorBenefitsModal';
import { Menu, X, ArrowUpRight, Lock, Sparkles, UserCheck } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { label: string; href: string; isCreator?: boolean }[] = [
    { label: t('nav_creators'), href: '/#vitrine', isCreator: true },
    { label: t('nav_agencies'), href: '/qualificacao/agencia' },
    { label: t('nav_ecosystem'), href: '/#ecossistema' },
    { label: t('nav_partners'), href: '/#parceiros' },
    { label: t('nav_plans'), href: '/planos' },
  ];

  const handleNavigate = (href: string) => {
    setMobileMenuOpen(false);
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
      router.push(href);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          NAVBAR SUPERIOR (Transparente minimalista)
      ═══════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          scrolled
            ? 'bg-black/80 backdrop-blur-md py-3.5 border-b border-white/[0.06]'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between">
          
          {/* LADO ESQUERDO: Brand Logo Clean */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/Lumiardi logo2-Trasparente.png"
                alt="Lumiardi Emblem"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-serif-lumiardi text-base sm:text-lg md:text-xl font-light tracking-[0.25em] text-ivory group-hover:text-gold uppercase transition-colors">
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

          {/* LADO DIREITO: Login, Seletor de Idioma e Botão Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link
              href="/login"
              className="px-3.5 py-1.5 border border-gold/40 text-gold hover:bg-gold hover:text-black-matte text-[11px] sm:text-xs uppercase font-sans tracking-widest font-medium transition-all duration-300 hidden sm:inline-flex items-center gap-1.5"
            >
              <span>Login</span>
            </Link>
            
            <LanguageSelector />

            {/* Botão Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ivory/80 hover:text-gold transition-colors"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════
          DRAWER MOBILE MENU (Ultra fluido & Touch-Friendly)
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 z-50 w-[82vw] max-w-sm bg-[#0C0C0C] border-l border-gold/20 p-6 flex flex-col justify-between shadow-2xl md:hidden overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-6 h-6">
                      <Image
                        src="/Lumiardi logo2-Trasparente.png"
                        alt="Lumiardi Emblem"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="font-serif-lumiardi text-sm tracking-[0.2em] text-ivory uppercase">
                      LUMIARDI
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-ivory/60 hover:text-gold"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Links de navegação mobile */}
                <div className="flex flex-col gap-4 py-8">
                  {navLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (link.isCreator) {
                          setCreatorModalOpen(true);
                        } else {
                          handleNavigate(link.href);
                        }
                      }}
                      className="text-left font-serif-lumiardi text-lg text-ivory/90 hover:text-gold uppercase tracking-wider py-2 flex items-center justify-between border-b border-white/[0.04]"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="w-4 h-4 text-gold/60" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Ação Mobile */}
              <div className="space-y-3 pt-6 border-t border-white/10">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center border border-gold/50 text-gold text-xs uppercase font-sans tracking-[0.2em] font-medium block hover:bg-gold hover:text-black-matte transition-colors"
                >
                  {t('login_btn_submit') || 'Acessar Conta VIP'}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/qualificacao');
                  }}
                  className="w-full py-3 text-center bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase font-sans tracking-[0.2em] font-medium block hover:bg-[#D4B87A] transition-colors"
                >
                  {t('hero_cta_creators') || 'Cadastrar Criadora'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreatorBenefitsModal open={creatorModalOpen} onClose={() => setCreatorModalOpen(false)} />
    </>
  );
};

