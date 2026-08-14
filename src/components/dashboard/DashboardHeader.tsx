'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Lock,
  ChevronDown,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  KeyRound,
  ScanFace,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
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
    notificationsCount,
    clearNotifications,
    refreshData,
  } = useAuthPortal();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isCriadora = role === 'criadora';
  const isApproved = curationStatus === 'APROVADO' || curationStatus === 'approved';

  const displayName = currentUser?.name || (isCriadora ? (activeCreator?.qualitative?.artisticName || 'Sua Conta Modelo') : (activeAgency?.basicInfo?.responsibleName || 'Sua Agência'));
  const initials = displayName.substring(0, 2).toUpperCase();

  const notifications = [
    {
      id: '1',
      title: 'Notificação de Sistema',
      desc: 'Canal de comunicação seguro ativo com criptografia E2E.',
      time: 'Agora',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080808]/95 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Lado Esquerdo: Mobile Trigger + Logo + Status E2E */}
      <div className="flex items-center gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-ivory hover:text-gold transition-colors cursor-pointer"
            aria-label="Abrir Menu Lateral"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-6 h-6 md:w-7 md:h-7 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/Lumiardi logo2-Trasparente.png"
              alt="Lumiardi Emblem"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-serif-lumiardi text-base md:text-lg font-light tracking-[0.25em] text-ivory group-hover:text-gold uppercase transition-colors hidden sm:inline">
            LUMIARDI
          </span>
          <span className="text-[9px] font-sans tracking-widest uppercase px-2 py-0.5 bg-gold/10 text-gold border border-gold/30 hidden md:inline font-semibold">
            {isCriadora ? 'PORTAL MODELO' : 'PORTAL AGÊNCIA'}
          </span>
        </Link>

        {/* Badge Criptografia Blindada */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-[#111111] border border-white/[0.08] text-[10px] font-sans text-ivory/70">
          <Lock className="w-3 h-3 text-gold" />
          <span>Sessão Criptografada</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>
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
            aria-label="Notificações"
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
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span className="font-serif-lumiardi text-sm font-medium">Notificações Lumiardi</span>
                  </div>
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-bronze uppercase tracking-wider hover:text-gold cursor-pointer"
                  >
                    Marcar lidas
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 bg-[#151515] border border-white/5 hover:border-gold/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-serif-lumiardi font-medium text-gold">
                          {n.title}
                        </span>
                        <span className="text-[9px] text-ivory/40 font-sans">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-ivory/70 font-sans leading-relaxed">
                        {n.desc}
                      </p>
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
            <div className="w-7 h-7 bg-gold/15 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-xs">
              {initials}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-serif-lumiardi font-medium text-ivory leading-none">
                {displayName}
              </span>
              <span className="text-[9px] font-sans uppercase tracking-widest text-emerald-400 mt-0.5">
                {isApproved ? 'Verificado ✓' : 'Em Análise'}
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
                    Conectado como
                  </span>
                  <span className="font-serif-lumiardi text-base text-gold block font-medium">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-ivory/60 font-sans truncate block">
                    {currentUser?.email || (isCriadora ? 'elena@lumiardi.com' : 'aura@lumiardi.com')}
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
                    <span>{isCriadora ? '✏️ Editar Book & Perfil' : '🏢 Editar Dados da Agência'}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href="/"
                    className="w-full flex items-center justify-between p-2 hover:bg-white/5 hover:text-gold transition-colors text-left"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <span>Voltar ao Site Principal</span>
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
                    <span>Encerrar Sessão Segura</span>
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
