'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useAuthPortal } from '@/context/AuthPortalContext';
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
  Sparkles,
  Lock,
  ScanFace,
  KeyRound,
} from 'lucide-react';
import { TwoFactorModal } from '@/components/dashboard/TwoFactorModal';
import { KYCVerificationModal } from '@/components/dashboard/KYCVerificationModal';

export default function DashboardOverviewPage() {
  const { role, activeCreator, activeAgency, currentUser } = useAuthPortal();
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);

  const isCriadora = role === 'criadora';
  const displayName = currentUser?.name || (isCriadora ? (activeCreator?.qualitative?.artisticName || 'Sua Conta Modelo') : (activeAgency?.basicInfo?.responsibleName || 'Sua Agência'));
  const revenue = activeCreator?.qualitative?.monthlyRevenueEstimate || 'Sob Consulta';

  return (
    <DashboardLayout
      pageTitle={`Painel Principal — ${displayName}`}
      pageSubtitle="Visão geral e resumo das suas conexões, entregas e ferramentas de prestígio."
    >
      <div className="space-y-8">
        
        {/* Banner de Boas-Vindas Didático */}
        <div className="p-6 md:p-8 bg-[#0F0F0F] border border-gold/30 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-sans uppercase tracking-[0.25em]">
                <ShieldCheck className="w-3 h-3" />
                <span>Credencial Verificada & Ativa</span>
              </div>
              <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory">
                Bem-vindo ao Ecossistema Lumiardi
              </h2>
              <p className="text-xs md:text-sm font-sans text-ivory/60 max-w-2xl leading-relaxed">
                Utilize as seções dedicadas na barra lateral para gerenciar seu portfólio, negociar com parceiros, controlar tarefas no Kanban e realizar reuniões de vídeo com total privacidade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={isCriadora ? '/dashboard/book' : '/dashboard/agencias'}
                className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
              >
                <span>{isCriadora ? 'Acessar Meu Book' : 'Explorar Scout'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard/kanban"
                className="px-5 py-2.5 bg-[#161616] hover:bg-white/10 text-ivory border border-white/10 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center gap-2"
              >
                <Kanban className="w-4 h-4 text-gold" />
                <span>Quadro de Projetos</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Cards Simples de Resumo Geral */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title={isCriadora ? 'Faturamento Estimado' : 'Faturamento do Roster'}
            value={isCriadora ? revenue : 'R$ 0,00'}
            change="Conta Aprovada ✓"
            isPositive={true}
            subtitle="Atualizado via Curadoria"
            icon={DollarSign}
            highlight={true}
            badgeText="Oficial"
          />

          <StatsCard
            title={isCriadora ? 'Agências Conectadas' : 'Modelos no Roster'}
            value="Disponível"
            change="Rede Aberta"
            isPositive={true}
            subtitle="Conexões diretas"
            icon={Building2}
          />

          <StatsCard
            title="Projetos em Andamento"
            value="Kanban Ativo"
            change="0 Pendências"
            isPositive={true}
            subtitle="Acesse a aba Projetos"
            icon={Kanban}
          />

          <StatsCard
            title="Armazenamento Seguro"
            value="Drive E2E"
            change="256-Bit"
            isPositive={true}
            subtitle="Arquivos e contratos"
            icon={HardDrive}
          />
        </div>

        {/* Módulos de Acesso Rápido Didático */}
        <div className="space-y-4">
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-bronze font-semibold block">
            Módulos Dedicados da Plataforma
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Book / Roster */}
            <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                  {isCriadora ? 'Book & Ficha Técnica' : 'Gestão de Agenciadas'}
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                  {isCriadora
                    ? 'Upload e visualização de fotos profissionais em alta resolução e medidas corporais.'
                    : 'Acompanhamento do elenco agenciado e contratos de exclusividade.'}
                </p>
              </div>
              <Link
                href="/dashboard/book"
                className="text-xs font-sans uppercase tracking-wider text-gold hover:underline flex items-center gap-1.5 pt-2"
              >
                <span>Acessar Módulo →</span>
              </Link>
            </div>

            {/* Card 2: Rede de Agências / Scout */}
            <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                  {isCriadora ? 'Rede de Agências' : 'Talent Scout'}
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                  {isCriadora
                    ? 'Catálogo com busca de agências internacionais parceiras e candidaturas diretas.'
                    : 'Filtros avançados de busca por medidas, nicho e idiomas de modelos.'}
                </p>
              </div>
              <Link
                href="/dashboard/agencias"
                className="text-xs font-sans uppercase tracking-wider text-gold hover:underline flex items-center gap-1.5 pt-2"
              >
                <span>Acessar Módulo →</span>
              </Link>
            </div>

            {/* Card 3: Kanban de Projetos */}
            <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
                  <Kanban className="w-5 h-5" />
                </div>
                <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                  Quadro de Projetos
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                  Gerenciamento visual em colunas (A Fazer, Em Produção, Concluído) para entregas contratuais.
                </p>
              </div>
              <Link
                href="/dashboard/kanban"
                className="text-xs font-sans uppercase tracking-wider text-gold hover:underline flex items-center gap-1.5 pt-2"
              >
                <span>Acessar Quadro →</span>
              </Link>
            </div>

            {/* Card 4: Mensagens & Chat */}
            <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                  Mensagens & Chat E2E
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                  Comunicação privada e criptografada ponta a ponta com agências e criadoras.
                </p>
              </div>
              <Link
                href="/dashboard/chat"
                className="text-xs font-sans uppercase tracking-wider text-gold hover:underline flex items-center gap-1.5 pt-2"
              >
                <span>Abrir Mensagens →</span>
              </Link>
            </div>

            {/* Card 5: Lumiardi Meet */}
            <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                  Lumiardi Meet
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                  Salas de videoconferência exclusivas com áudio HD e compartilhamento seguro.
                </p>
              </div>
              <Link
                href="/dashboard/meet"
                className="text-xs font-sans uppercase tracking-wider text-gold hover:underline flex items-center gap-1.5 pt-2"
              >
                <span>Iniciar Chamada →</span>
              </Link>
            </div>

            {/* Card 6: Drive */}
            <div className="p-6 bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                  Lumiardi Drive
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1 leading-relaxed">
                  Repositório em nuvem de alta segurança para armazenamento de RAWs e contratos.
                </p>
              </div>
              <Link
                href="/dashboard/drive"
                className="text-xs font-sans uppercase tracking-wider text-gold hover:underline flex items-center gap-1.5 pt-2"
              >
                <span>Acessar Arquivos →</span>
              </Link>
            </div>
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
