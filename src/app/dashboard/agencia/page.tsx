'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TalentScoutView } from '@/components/dashboard/TalentScoutView';
import { AgencyRosterView } from '@/components/dashboard/AgencyRosterView';
import { KanbanBoard } from '@/components/interactive/KanbanBoard';
import { ChatPanel } from '@/components/interactive/ChatPanel';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  DollarSign,
  Users,
  Search,
  Kanban,
  Building2,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { EditAgencyModal } from '@/components/dashboard/EditAgencyModal';

export default function AgenciaDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { activeAgency, currentUser, allCreators, refreshData } = useAuthPortal();
  const { t, formatPrice } = useLanguage();

  const agencyName = currentUser?.name || activeAgency?.basicInfo.responsibleName || t('dsh_ov_your_agency');
  const creatorsCount = allCreators.length;

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pageTitle={`${t('dash_nav_overview')} — ${agencyName}`}
      pageSubtitle={t('dash_page_agency_sub')}
    >
      <div className="space-y-8">
        {/* Barra de Ações Rápidas Corporativas */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans font-semibold uppercase tracking-wider transition-all flex items-center gap-2 rounded-sm cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('dash_edit_profile')}</span>
          </button>
        </div>

        {/* Visão Geral (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Stats Cards Limpos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard
                title={t('dsh_ov_roster_revenue')}
                value={formatPrice(0, 0, 0)}
                change={t('dsh_ag_no_pending')}
                isPositive={true}
                subtitle={t('dsh_ag_commission_set').replace('{pct}', '20%')}
                icon={DollarSign}
                highlight={true}
                badgeText={t('dsh_ag_official_agency')}
              />

              <StatsCard
                title={t('dsh_ov_roster_models')}
                value={t('dsh_ag_active_count').replace('{count}', '0')}
                change={t('dsh_ag_ready_contracts')}
                isPositive={true}
                subtitle={t('dsh_ag_integrated_contracts')}
                icon={Users}
              />

              <StatsCard
                title={t('dsh_ag_showcase_talents')}
                value={t('dsh_ag_models_count').replace('{count}', String(creatorsCount))}
                change={t('dsh_ag_filters_active')}
                isPositive={true}
                subtitle={t('dsh_ag_available_proposals')}
                icon={Search}
              />

              <StatsCard
                title={t('dsh_ag_kanban_campaigns')}
                value={t('dsh_ag_active_count').replace('{count}', '0')}
                change={t('dsh_ag_env_ready')}
                isPositive={true}
                subtitle={t('dsh_ag_delivery_mgmt')}
                icon={Kanban}
              />
            </div>

            {/* Ações Rápidas de Alto Nível */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Destaque: Talent Scout */}
              <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold font-sans">
                      {t('dsh_ag_specialized_search')}
                    </span>
                    <Search className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    {t('dsh_ag_scout_title')}
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    {t('dsh_ag_scout_desc')}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('scout')}
                  className="px-4 py-2.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t('dsh_ag_scout_cta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card Destaque: Gestão de Agenciadas */}
              <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold font-sans">
                      {t('dsh_ag_roster_label')}
                    </span>
                    <Users className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    {t('dsh_ag_roster_title')}
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    {t('dsh_ag_roster_desc')}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('roster')}
                  className="px-4 py-2.5 bg-[#151515] hover:bg-white/10 text-ivory hover:text-gold border border-white/10 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t('dsh_ag_roster_cta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Kanban & Chat da Agência */}
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

        {/* Tab 2: Talent Scout */}
        {activeTab === 'scout' && <TalentScoutView />}

        {/* Tab 3: Roster de Agenciadas */}
        {activeTab === 'roster' && <AgencyRosterView />}

        {/* Tab 4: Kanban de Campanhas */}
        {activeTab === 'kanban' && <KanbanBoard />}

        {/* Tab 5: Drive Compartilhado */}
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

      {/* Modal de Edição de Dados Corporativos */}
      <EditAgencyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={activeAgency}
        onSaved={refreshData}
      />
    </DashboardLayout>
  );
}
