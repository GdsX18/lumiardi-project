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

  const agencyName = currentUser?.name || activeAgency?.basicInfo.responsibleName || 'Sua Agência';
  const creatorsCount = allCreators.length;

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pageTitle={`Painel Corporativo — ${agencyName}`}
      pageSubtitle="Scout de novos talentos, gestão de agenciadas, contratos de exclusividade e campanhas."
    >
      <div className="space-y-8">
        {/* Barra de Ações Rápidas Corporativas */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans font-semibold uppercase tracking-wider transition-all flex items-center gap-2 rounded-sm cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Dados da Agência</span>
          </button>
        </div>

        {/* Visão Geral (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Stats Cards Limpos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard
                title="Faturamento do Roster"
                value="R$ 0,00"
                change="Sem pendências"
                isPositive={true}
                subtitle="Comissão configurada: 20%"
                icon={DollarSign}
                highlight={true}
                badgeText="Agência Oficial"
              />

              <StatsCard
                title="Modelos no Roster"
                value="0 Ativas"
                change="Pronto para novos contratos"
                isPositive={true}
                subtitle="Contratos com gestão integrada"
                icon={Users}
              />

              <StatsCard
                title="Talentos na Vitrine"
                value={`${creatorsCount} Modelos`}
                change="Filtros de busca ativos"
                isPositive={true}
                subtitle="Disponíveis para propostas"
                icon={Search}
              />

              <StatsCard
                title="Campanhas no Kanban"
                value="0 Ativas"
                change="Ambiente pronto"
                isPositive={true}
                subtitle="Gestão de entregas e aprovação"
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
                      Busca Especializada
                    </span>
                    <Search className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    Talent Scout com Filtros
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    Pesquise criadoras aprovadas por nicho, medidas, idiomas e faixa de faturamento para envio de propostas.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('scout')}
                  className="px-4 py-2.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Acessar Scout de Modelos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card Destaque: Gestão de Agenciadas */}
              <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold font-sans">
                      Elenco da Agência
                    </span>
                    <Users className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    Gestão de Agenciadas & Roster
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    Monitore faturamentos, contratos assinados e entregas de cada modelo conectada ao seu perfil.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('roster')}
                  className="px-4 py-2.5 bg-[#151515] hover:bg-white/10 text-ivory hover:text-gold border border-white/10 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Gerenciar Meu Roster</span>
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
