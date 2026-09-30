'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  KeyRound,
  ScanFace,
  Check,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Badge } from '@/components/ui/Badge';
import { EditProfileModal } from './EditProfileModal';
import { EditAgencyModal } from './EditAgencyModal';
import { TwoFactorModal } from './TwoFactorModal';
import { KYCVerificationModal } from './KYCVerificationModal';

export interface DashboardHeaderProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleMobileMenu,
  mobileMenuOpen = false,
}) => {
  const {
    role,
    curationStatus,
    currentUser,
    activeCreator,
    activeAgency,
    logout,
    notifications,
    notificationsCount,
    clearNotifications,
    markNotificationAsRead,
    refreshData,
  } = useAuthPortal();
  const { t, formatTime } = useLanguage();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isCriadora = role === 'criadora';
  const isApproved = curationStatus === 'APROVADO' || curationStatus === 'approved';

  const displayName = currentUser?.name || (isCriadora ? (activeCreator?.qualitative?.artisticName || t('dsh_ov_your_model_account')) : (activeAgency?.basicInfo?.responsibleName || t('dsh_ov_your_agency')));
  const initials = displayName.substring(0, 2).toUpperCase();

  const activeNotificationsList = (notifications || []).map((n) => ({
    id: n.id,
    title: n.title,
    desc: n.desc,
    time: (n.createdAt && formatTime(n.createdAt)) || t('dsh_hd_recent'),
    category: n.category || t('dsh_hd_general'),
    link: n.link,
    linkText: n.linkText || t('dsh_hd_view_details'),
    isRead: n.isRead,
  }));

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080808]/95 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Lado Esquerdo: Mobile Trigger + Logo + Status E2E */}
      <div className="flex items-center gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-ivory hover:text-gold transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? t('dsh_hd_close_menu') : t('dsh_hd_open_menu')}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-6 h-6 md:w-7 md:h-7 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/Lumiardi logo2-Trasparente.png"
              alt={t('dsh_hd_emblem_alt')}
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-serif-lumiardi text-base md:text-lg font-light tracking-[0.25em] text-ivory group-hover:text-gold uppercase transition-colors hidden sm:inline">
            LUMIARDI
          </span>
          <span className="text-[9px] font-sans tracking-widest uppercase px-2 py-0.5 bg-gold/10 text-gold border border-gold/30 hidden md:inline font-semibold">
            {isCriadora ? t('portal_model') : t('portal_agency')}
          </span>
        </Link>
      </div>

      {/* Lado Direito: Notificações + Idioma + Usuário */}
      <div className="flex items-center gap-3">
        {/* Notificações Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 bg-[#121212] border border-white/10 text-ivory/80 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
            aria-label={t('header_notifications')}
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-black-matte font-bold text-[9px] flex items-center justify-center rounded-full">
                {notificationsCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0F0F0F] border border-gold/40 shadow-2xl p-4 z-50 text-ivory"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-gold" />
                    <span className="font-serif-lumiardi text-sm font-medium">{t('header_notifications')}</span>
                  </div>
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-bronze uppercase tracking-wider hover:text-gold cursor-pointer"
                  >
                    {t('header_mark_read')}
                  </button>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {activeNotificationsList.length === 0 && (
                    <p className="text-center text-sm text-[#8E8E93] py-8 px-4">
                      {t('dsh_hd_no_notifications')}
                    </p>
                  )}
                  {activeNotificationsList.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border transition-colors space-y-1.5 ${
                        !n.isRead
                          ? 'bg-[#181818] border-gold/40'
                          : 'bg-[#151515] border-white/5 hover:border-gold/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-gold/10 text-gold border border-gold/20">
                            {n.category}
                          </span>
                          <span className="text-xs font-serif-lumiardi font-medium text-ivory">
                            {n.title}
                          </span>
                        </div>
                        <span className="text-[9px] text-ivory/40 font-sans">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-ivory/70 font-sans leading-relaxed">
                        {n.desc}
                      </p>
                      {n.link && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!n.link) return;
                              setShowNotifications(false);
                              if (!n.isRead) void markNotificationAsRead(n.id);
                              router.push(n.link);
                            }}
                            className="text-[10px] font-sans uppercase tracking-wider text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{n.linkText} →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Seletor de Idioma */}
        <div className="hidden md:block">
          <LanguageSelector />
        </div>

        {/* Perfil Chip */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 bg-[#121212] border border-white/10 hover:border-gold/40 p-1.5 sm:px-3 sm:py-1.5 transition-colors cursor-pointer"
          >
            <div
              suppressHydrationWarning
              className="w-7 h-7 bg-gold/15 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-xs"
            >
              {initials}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span
                suppressHydrationWarning
                className="text-xs font-serif-lumiardi font-medium text-ivory leading-none"
              >
                {displayName}
              </span>
              <span
                suppressHydrationWarning
                className="text-[9px] font-sans uppercase tracking-widest text-emerald-400 mt-0.5"
              >
                {isApproved ? t('header_verified') : t('header_in_review')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ivory/50" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 bg-[#0F0F0F] border border-gold/40 shadow-2xl p-3 z-50 text-ivory"
              >
                <div className="p-2 border-b border-white/10 mb-2">
                  <span className="text-[10px] font-sans text-ivory/50 uppercase tracking-widest block">
                    {t('header_connected_as')}
                  </span>
                  <span className="font-serif-lumiardi text-base text-gold block font-medium">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-ivory/60 font-sans truncate block">
                    {currentUser?.email || '—'}
                  </span>
                </div>

                <div className="space-y-1 text-xs font-sans">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-white/5 hover:text-gold transition-colors text-left text-gold font-medium cursor-pointer"
                  >
                    <span>{isCriadora ? t('header_edit_profile') : t('header_edit_agency')}</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href="/"
                    className="w-full flex items-center justify-between p-2 hover:bg-white/5 hover:text-gold transition-colors text-left"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <span>{t('header_back_to_site')}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </Link>

                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2 p-2 text-rose-400 hover:bg-rose-950/30 transition-colors text-left cursor-pointer pt-2 border-t border-white/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('header_logout_secure')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modais de Edição Globais */}
      {isCriadora ? (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={activeCreator}
          onSaved={refreshData}
        />
      ) : (
        <EditAgencyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={activeAgency}
          onSaved={refreshData}
        />
      )}
    </header>
  );
};
