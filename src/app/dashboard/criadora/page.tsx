'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CreatorProfileView } from '@/components/dashboard/CreatorProfileView';
import { AgencyDirectoryView } from '@/components/dashboard/AgencyDirectoryView';
import { KanbanBoard } from '@/components/interactive/KanbanBoard';
import { ChatPanel } from '@/components/interactive/ChatPanel';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';
import { ReceivedProposalsPanel, useReceivedProposals } from '@/components/dashboard/ReceivedProposalsPanel';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  DollarSign,
  Building2,
  Kanban,
  Eye,
  Camera,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

export default function CriadoraDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { activeCreator, currentUser } = useAuthPortal();
  const { t } = useLanguage();
  const proposalsState = useReceivedProposals(true);

  const name = currentUser?.name || activeCreator?.qualitative?.artisticName || t('dsh_ov_your_model_account');
  const revenue = activeCreator?.qualitative?.monthlyRevenueEstimate || t('dsh_ov_on_request');

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pageTitle={`${t('dash_nav_overview')} — ${name}`}
      pageSubtitle={t('dash_page_creator_sub')}
    >
      <div className="space-y-8">
        {/* Visão Geral (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Stats Cards Limpos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard
                title={t('dash_stat_est_revenue')}
                value={revenue}
                change={t('dsh_cr_status_active')}
                isPositive={true}
                subtitle={t('dsh_ov_updated_by_curation')}
                icon={DollarSign}
                highlight={true}
                badgeText={t('dsh_cr_verified')}
              />

              <StatsCard
                title={t('dsh_cr_agency_proposals')}
                value={t('dsh_cr_pending_count').replace('{count}', String(proposalsState.pendingCount))}
                change={t('dsh_cr_network_available')}
                isPositive={true}
                subtitle={t('dsh_cr_direct_payout')}
                icon={Building2}
              />

              <StatsCard
                title={t('dsh_cr_campaign_deliveries')}
                value={t('dsh_ag_active_count').replace('{count}', '0')}
                change={t('dsh_cr_all_up_to_date')}
                isPositive={true}
                subtitle={t('dsh_cr_kanban_ready')}
                icon={Kanban}
              />

              <StatsCard
                title={t('dsh_cr_portfolio_views')}
                value="0"
                change={t('dsh_cr_profile_indexed')}
                isPositive={true}
                subtitle={t('dsh_cr_accredited_directors')}
                icon={Eye}
              />
            </div>

            {/* Acesso Rápido aos Módulos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Destaque: Meu Book Fotográfico */}
              <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold font-sans">
                      {t('dsh_cr_hires_portfolio')}
                    </span>
                    <Camera className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    {t('dsh_cr_portfolio_title')}
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    {t('dsh_cr_portfolio_desc')}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('book')}
                  className="px-4 py-2.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t('dsh_cr_portfolio_cta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card Destaque: Agências Parceiras */}
              <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold font-sans">
                      {t('dash_nav_agencies')}
                    </span>
                    <Building2 className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    {t('dsh_cr_accredited_agencies')}
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    {t('dsh_cr_agencies_desc')}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('agencies')}
                  className="px-4 py-2.5 bg-[#151515] hover:bg-white/10 text-ivory hover:text-gold border border-white/10 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t('dsh_cr_agencies_cta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Propostas de agências recebidas (aceitar/recusar) */}
            <ReceivedProposalsPanel state={proposalsState} />

            {/* Prévia do Kanban & Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <KanbanBoard />
              </div>
              <div>
                <ChatPanel />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Meu Book & Bio */}
        {activeTab === 'book' && <CreatorProfileView />}

        {/* Tab 3: Diretório de Agências */}
        {activeTab === 'agencies' && <AgencyDirectoryView />}

        {/* Tab 4: Kanban de Produção */}
        {activeTab === 'kanban' && <KanbanBoard />}

        {/* Tab 5: Drive Pessoal Criptografado */}
        {activeTab === 'drive' && <SharedDrivePanel />}

        {/* Tab 6: Chat Criptografado */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <ChatPanel />
          </div>
        )}

        {/* Tab 7: Lumiardi Meet */}
        {activeTab === 'meet' && <VideoCallWidget />}
      </div>
    </DashboardLayout>
  );
}
