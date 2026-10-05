'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface MobileNavLink {
  label: string;
  href: string;
  isCreator?: boolean;
  isAgency?: boolean;
}

interface MobileMenuDrawerProps {
  open: boolean;
  navLinks: MobileNavLink[];
  onClose: () => void;
  onLinkSelect: (link: MobileNavLink) => void;
  onCreatorCta: () => void;
}

/**
 * Drawer do menu mobile do Header. Carregado via next/dynamic só na primeira abertura,
 * para manter o framer-motion fora do bundle inicial da página.
 */
export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  open,
  navLinks,
  onClose,
  onLinkSelect,
  onCreatorCta,
}) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                      alt={t('lgm_header_emblem_alt')}
                      fill
                      sizes="24px"
                      className="object-contain"
                    />
                  </div>
                  <span className="font-serif-lumiardi text-sm tracking-[0.2em] text-ivory uppercase">
                    LUMIARDI
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-ivory/60 hover:text-gold"
                  aria-label={t('lgm_header_close_menu')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links de navegação mobile */}
              <div className="flex flex-col gap-4 py-8">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => onLinkSelect(link)}
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
                onClick={onClose}
                className="w-full py-3 text-center border border-gold/50 text-gold text-xs uppercase font-sans tracking-[0.2em] font-medium block hover:bg-gold hover:text-black-matte transition-colors"
              >
                {t('login_btn_submit')}
              </Link>
              <button
                onClick={onCreatorCta}
                className="w-full py-3 text-center bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase font-sans tracking-[0.2em] font-medium block hover:bg-[#D4B87A] transition-colors"
              >
                {t('hero_cta_creators')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
