'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  DollarSign,
  Building2,
  Kanban,
  Eye,
  Camera,
  MessageSquare,
  Video,
  HardDrive,
  ArrowRight,
  ShieldCheck,
  Lock,
  ScanFace,
  KeyRound,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { TwoFactorModal } from '@/components/dashboard/TwoFactorModal';
import { KYCVerificationModal } from '@/components/dashboard/KYCVerificationModal';
import { VIPWelcomeCelebrationModal } from '@/components/dashboard/VIPWelcomeCelebrationModal';
import { ReceivedProposalsPanel, useReceivedProposals } from '@/components/dashboard/ReceivedProposalsPanel';

export default function DashboardOverviewPage() {
  const { role, activeCreator, activeAgency, currentUser } = useAuthPortal();
  const { t, formatPrice } = useLanguage();
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.curationStatus === 'APROVADO') {
      const userKey = currentUser.id ? `lumiardi_vip_celebrated_${currentUser.id}` : 'lumiardi_vip_celebrated';
      const alreadySeen = localStorage.getItem(userKey) || localStorage.getItem('lumiardi_vip_celebrated');
      if (!alreadySeen) {
        setShowCelebration(true);
      }
    }
  }, [currentUser]);

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    if (typeof window !== 'undefined') {
      if (currentUser?.id) {
        localStorage.setItem(`lumiardi_vip_celebrated_${currentUser.id}`, 'true');
      }
      localStorage.setItem('lumiardi_vip_celebrated', 'true');
      sessionStorage.setItem('lumiardi_vip_celebrated', 'true');
    }
  };

  const isCriadora = role === 'criadora';
  const proposalsState = useReceivedProposals(isCriadora);
  const displayName =
    currentUser?.name ||
    (isCriadora
      ? activeCreator?.qualitative?.artisticName || t('dsh_ov_your_model_account')
      : activeAgency?.basicInfo?.responsibleName || t('dsh_ov_your_agency'));
  const revenue = activeCreator?.qualitative?.monthlyRevenueEstimate || t('dsh_ov_on_request');

  return (
    <DashboardLayout
      pageTitle={`${t('dash_nav_overview')} — ${displayName}`}
      pageSubtitle={t('dash_hero_desc')}
    >
      <VIPWelcomeCelebrationModal
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        userName={displayName}
        userRole={role}
        memberId={`LUM-${(currentUser?.id || '8842').substring(0, 6).toUpperCase()}`}
        category={isCriadora ? t('dsh_pend_elite_creator') : t('dsh_ov_talent_agency')}
      />

      <div className="space-y-8 w-full">
        {/* Banner Executivo de Boas-Vindas */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-[#111111] via-[#0D0D0D] to-[#0A0A0A] border border-gold/30 relative overflow-hidden shadow-2xl rounded-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-sans uppercase tracking-[0.25em] rounded-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('dash_hero_badge')}</span>
              </div>
              <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory tracking-wide">
                {t('dash_hero_welcome')}
              </h2>
              <p className="text-xs md:text-sm font-sans text-ivory/60 leading-relaxed">
                {t('dash_hero_desc')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={isCriadora ? '/dashboard/book' : '/dashboard/agencias'}
                className="px-5 py-3 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-bold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-2 rounded-xs shadow-lg shadow-gold/20 cursor-pointer"
              >
                <span>{isCriadora ? t('dash_hero_access_book') : t('dash_hero_explore_scout')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard/kanban"
                className="px-5 py-3 bg-[#161616] hover:bg-[#222222] text-ivory border border-white/[0.08] hover:border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center gap-2 rounded-xs cursor-pointer"
              >
                <Kanban className="w-4 h-4 text-gold" />
                <span>{t('dash_hero_projects_board')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatsCard
            title={isCriadora ? t('dash_stat_est_revenue') : t('dsh_ov_roster_revenue')}
            value={isCriadora ? revenue : formatPrice(0, 0, 0)}
            change={t('dsh_ov_account_approved')}
            isPositive={true}
            subtitle={t('dsh_ov_updated_by_curation')}
            icon={DollarSign}
            highlight={true}
            badgeText={t('dsh_ov_official')}
          />

          <StatsCard
            title={isCriadora ? t('dsh_cr_agency_proposals') : t('dsh_ov_roster_models')}
            value={
              isCriadora
                ? t('dsh_cr_pending_count').replace('{count}', String(proposalsState.pendingCount))
                : t('dsh_ov_available')
            }
            change={t('dsh_ov_open_network')}
            isPositive={true}
            subtitle={t('dsh_ov_direct_connections')}
            icon={Building2}
          />

          <StatsCard
            title={t('dash_stat_ongoing_projects')}
            value={t('dsh_ov_kanban_active')}
            change={t('dsh_ov_zero_pending')}
            isPositive={true}
            subtitle={t('dsh_ov_open_projects_tab')}
            icon={Kanban}
          />

          <StatsCard
            title={t('dash_stat_secure_storage')}
            value="Drive E2E"
            change="Cloudflare R2"
            isPositive={true}
            subtitle={t('dsh_ov_files_contracts')}
            icon={HardDrive}
          />
        </div>

        {/* Propostas de agências recebidas pela modelo (aceitar/recusar) */}
        {isCriadora && <ReceivedProposalsPanel state={proposalsState} />}

        {/* Grade de Módulos da Plataforma com Design Limpo e Fluido */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-gold/70 font-semibold block">
                {t('dsh_ov_quick_nav')}
              </span>
              <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                {t('dash_modules_title')}
              </h3>
            </div>
            <span className="text-xs font-sans text-ivory/40">{t('dash_modules_subtitle')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Book / Roster */}
            <Link
              href="/dashboard/book"
              className="p-6 bg-[#0D0D0D] border border-white/[0.08] hover:border-gold/60 hover:bg-[#121212] transition-all duration-300 flex flex-col justify-between space-y-4 group rounded-sm shadow-md"
            >
              <div>
                <div className="w-11 h-11 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-gold/20 transition-all rounded-xs shadow-inner">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                  {isCriadora ? t('dash_nav_book') : t('dash_nav_roster')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {isCriadora
                    ? t('dsh_ov_card_book_creator')
                    : t('dsh_ov_card_book_agency')}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_module')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Rede de Agências / Scout */}
            <Link
              href="/dashboard/agencias"
              className="p-6 bg-[#0D0D0D] border border-white/[0.08] hover:border-gold/60 hover:bg-[#121212] transition-all duration-300 flex flex-col justify-between space-y-4 group rounded-sm shadow-md"
            >
              <div>
                <div className="w-11 h-11 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-gold/20 transition-all rounded-xs shadow-inner">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                  {isCriadora ? t('dash_nav_agencies') : t('dash_nav_scout')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {isCriadora
                    ? t('dsh_ov_card_agencies_creator')
                    : t('dsh_ov_card_agencies_agency')}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_module')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Kanban de Projetos */}
            <Link
              href="/dashboard/kanban"
              className="p-6 bg-[#0D0D0D] border border-white/[0.08] hover:border-gold/60 hover:bg-[#121212] transition-all duration-300 flex flex-col justify-between space-y-4 group rounded-sm shadow-md"
            >
              <div>
                <div className="w-11 h-11 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-gold/20 transition-all rounded-xs shadow-inner">
                  <Kanban className="w-5 h-5" />
                </div>
                <h4 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                  {t('dash_nav_kanban')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {t('dsh_ov_card_kanban')}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_board')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Mensagens & Chat */}
            <Link
              href="/dashboard/chat"
              className="p-6 bg-[#0D0D0D] border border-white/[0.08] hover:border-gold/60 hover:bg-[#121212] transition-all duration-300 flex flex-col justify-between space-y-4 group rounded-sm shadow-md"
            >
              <div>
                <div className="w-11 h-11 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-gold/20 transition-all rounded-xs shadow-inner">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                  {t('dash_nav_chat')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {t('dsh_ov_card_chat')}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_open_chat')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 5: Lumiardi Meet */}
            <Link
              href="/dashboard/meet"
              className="p-6 bg-[#0D0D0D] border border-white/[0.08] hover:border-gold/60 hover:bg-[#121212] transition-all duration-300 flex flex-col justify-between space-y-4 group rounded-sm shadow-md"
            >
              <div>
                <div className="w-11 h-11 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-gold/20 transition-all rounded-xs shadow-inner">
                  <Video className="w-5 h-5" />
                </div>
                <h4 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                  {t('dash_nav_meet')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {t('dsh_ov_card_meet')}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_start_call')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 6: Drive */}
            <Link
              href="/dashboard/drive"
              className="p-6 bg-[#0D0D0D] border border-white/[0.08] hover:border-gold/60 hover:bg-[#121212] transition-all duration-300 flex flex-col justify-between space-y-4 group rounded-sm shadow-md"
            >
              <div>
                <div className="w-11 h-11 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-gold/20 transition-all rounded-xs shadow-inner">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h4 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                  {t('dash_nav_drive')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {t('dsh_ov_card_drive')}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_files')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Modal de 2FA TOTP */}
        <TwoFactorModal
          isOpen={is2FAModalOpen}
          onClose={() => setIs2FAModalOpen(false)}
        />

        {/* Modal de Verificação Biométrica KYC */}
        <KYCVerificationModal
          isOpen={isKYCModalOpen}
          onClose={() => setIsKYCModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
