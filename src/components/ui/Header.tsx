'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { CreatorBenefitsModal } from './CreatorBenefitsModal';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
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

  const navLinks: { label: string; href: string; isCreator?: boolean }[] = [
    { label: t('nav_creators'), href: '/#vitrine', isCreator: true },
    { label: t('nav_agencies'), href: '/qualificacao/agencia' },
    { label: t('nav_ecosystem'), href: '/#ecossistema' },
    { label: t('nav_partners'), href: '/#parceiros' },
    { label: t('nav_plans'), href: '/planos' },
  ];

  const handleNavigate = (href: string) => {
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

          {/* CENTRO: Links diretos minimalistas */}
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

          {/* LADO DIREITO: Login & Seletor de Idioma */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-3.5 py-1.5 border border-gold/40 text-gold hover:bg-gold hover:text-black-matte text-xs uppercase font-sans tracking-widest font-medium transition-all duration-300 hidden sm:inline-flex items-center gap-1.5"
            >
              <span>Login</span>
            </Link>
            <LanguageSelector />
          </div>

        </div>
      </motion.header>

      <CreatorBenefitsModal open={creatorModalOpen} onClose={() => setCreatorModalOpen(false)} />
    </>
  );
};

