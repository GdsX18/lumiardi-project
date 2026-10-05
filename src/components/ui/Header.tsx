'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { Menu, X } from 'lucide-react';
import { LazyCreatorBenefitsModal, LazyAgencyBenefitsModal } from './LazyBenefitsModals';
import type { MobileNavLink } from './MobileMenuDrawer';
import { useOpenedOnce } from '@/lib/useOpenedOnce';

// Drawer mobile (framer-motion) só é baixado na primeira abertura do menu
const MobileMenuDrawer = dynamic(
  () => import('./MobileMenuDrawer').then((m) => ({ default: m.MobileMenuDrawer })),
  { ssr: false }
);

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerMounted = useOpenedOnce(mobileMenuOpen);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    // setState só re-renderiza quando o valor muda; o listener é passivo
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: MobileNavLink[] = [
    { label: t('nav_creators'), href: '/#vitrine', isCreator: true },
    { label: t('nav_agencies'), href: '/qualificacao/agencia', isAgency: true },
    { label: t('nav_ecosystem'), href: '/#ecossistema' },
    { label: t('nav_partners'), href: '/#parceiros' },
    { label: t('nav_plans'), href: '/planos' },
    { label: t('nav_contact'), href: '/contato' },
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
      <header
        className={`animate-header-enter fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
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
                alt={t('lgm_header_emblem_alt')}
                fill
                sizes="32px"
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
                onClick={() => {
                  if (link.isCreator) {
                    setCreatorModalOpen(true);
                  } else if (link.isAgency) {
                    setAgencyModalOpen(true);
                  } else {
                    handleNavigate(link.href);
                  }
                }}
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
              <span>{t('nav_login')}</span>
            </Link>
            
            <LanguageSelector />

            {/* Botão Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ivory/80 hover:text-gold transition-colors"
              aria-label={t('lgm_header_open_menu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          DRAWER MOBILE MENU (Ultra fluido & Touch-Friendly)
      ═══════════════════════════════════════════════════════════════ */}
      {drawerMounted && (
        <MobileMenuDrawer
          open={mobileMenuOpen}
          navLinks={navLinks}
          onClose={() => setMobileMenuOpen(false)}
          onLinkSelect={(link) => {
            setMobileMenuOpen(false);
            if (link.isCreator) {
              setCreatorModalOpen(true);
            } else if (link.isAgency) {
              setAgencyModalOpen(true);
            } else {
              handleNavigate(link.href);
            }
          }}
          onCreatorCta={() => {
            setMobileMenuOpen(false);
            router.push('/qualificacao');
            setCreatorModalOpen(true);
          }}
        />
      )}

      <LazyCreatorBenefitsModal open={creatorModalOpen} onClose={() => setCreatorModalOpen(false)} />
      <LazyAgencyBenefitsModal open={agencyModalOpen} planId="select" billing="yearly" onClose={() => setAgencyModalOpen(false)} />
    </>
  );
};

