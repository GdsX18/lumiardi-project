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
import { useAuthPortal } from '@/context/AuthPortalContext';
import {
  DollarSign,
  Building2,
  Kanban,
  Eye,
  Camera,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function CriadoraDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { activeCreator, currentUser } = useAuthPortal();

  const name = currentUser?.name || activeCreator?.qualitative?.artisticName || 'Sua Conta Modelo';
  const revenue = activeCreator?.qualitative?.monthlyRevenueEstimate || 'Sob Consulta';

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pageTitle={`Painel da Modelo — ${name}`}
      pageSubtitle="Gerenciamento de imagem editorial, conexões com agências e entregas de contratos."
    >
      <div className="space-y-8">
        {/* Visão Geral (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Stats Cards Limpos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard
                title="Faturamento Estimado"
                value={revenue}
                change="Status Ativo"
                isPositive={true}
                subtitle="Atualizado via Curadoria"
                icon={DollarSign}
                highlight={true}
                badgeText="Verificado"
              />

              <StatsCard
                title="Propostas de Agências"
                value="0 Pendentes"
                change="Rede Disponível"
                isPositive={true}
                subtitle="Contratos com repasse direto"
                icon={Building2}
              />

              <StatsCard
                title="Entregas de Campanha"
                value="0 Ativas"
                change="Tudo em dia"
                isPositive={true}
                subtitle="Kanban pronto para novas tarefas"
                icon={Kanban}
              />

              <StatsCard
                title="Visualizações de Book"
                value="0"
                change="Perfil Indexado"
                isPositive={true}
                subtitle="Diretores de agências credenciadas"
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
                      Portfólio de Alta Resolução
                    </span>
                    <Camera className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    Book & Ficha Técnica
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    Seu book padronizado com ensaios e medidas corporais para diretores de agências credenciadas.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('book')}
                  className="px-4 py-2.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Gerenciar Meu Book e Medidas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card Destaque: Agências Parceiras */}
              <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold font-sans">
                      Rede de Agências
                    </span>
                    <Building2 className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    Agências Credenciadas
                  </h3>
                  <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                    Explore a lista de agências parceiras registradas na plataforma para envio de candidaturas diretas.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('agencies')}
                  className="px-4 py-2.5 bg-[#151515] hover:bg-white/10 text-ivory hover:text-gold border border-white/10 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Explorar Agências Disponíveis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

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
