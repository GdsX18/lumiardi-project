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

export default function DashboardOverviewPage() {
  const { role, activeCreator, activeAgency, currentUser } = useAuthPortal();
  const { t } = useLanguage();
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.curationStatus === 'APROVADO') {
      const alreadySeen = sessionStorage.getItem('lumiardi_vip_celebrated');
      if (!alreadySeen) {
        setShowCelebration(true);
      }
    }
  }, [currentUser]);

  const isCriadora = role === 'criadora';
  const displayName =
    currentUser?.name ||
    (isCriadora
      ? activeCreator?.qualitative?.artisticName || 'Sua Conta Modelo'
      : activeAgency?.basicInfo?.responsibleName || 'Sua Agência');
  const revenue = activeCreator?.qualitative?.monthlyRevenueEstimate || 'Sob Consulta';

  return (
    <DashboardLayout
      pageTitle={`${t('dash_nav_overview') || 'Visão Geral'} — ${displayName}`}
      pageSubtitle={t('dash_hero_desc') || 'Visão geral e resumo das suas conexões, produções e ferramentas de prestígio.'}
    >
      <VIPWelcomeCelebrationModal
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          sessionStorage.setItem('lumiardi_vip_celebrated', 'true');
        }}
        userName={displayName}
        userRole={role}
        memberId={`LUM-${(currentUser?.id || '8842').substring(0, 6).toUpperCase()}`}
        category={isCriadora ? 'Criadora de Elite' : 'Agência de Talentos'}
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
                <span>{t('dash_hero_badge') || 'Credencial Verificada & Ambiente Criptografado'}</span>
              </div>
              <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory tracking-wide">
                {t('dash_hero_welcome') || 'Bem-vinda ao Ecossistema Lumiardi'}
              </h2>
              <p className="text-xs md:text-sm font-sans text-ivory/60 leading-relaxed">
                {t('dash_hero_desc') || 'Acesse suas mídias no Drive seguro, gerencie propostas com agências parceiras, acompanhe entregas no Kanban e realize videoconferências VIP com total privacidade.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={isCriadora ? '/dashboard/book' : '/dashboard/agencias'}
                className="px-5 py-3 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-bold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-2 rounded-xs shadow-lg shadow-gold/20 cursor-pointer"
              >
                <span>{isCriadora ? (t('dash_hero_access_book') || 'Acessar Meu Book') : (t('dash_hero_explore_scout') || 'Explorar Talent Scout')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard/kanban"
                className="px-5 py-3 bg-[#161616] hover:bg-[#222222] text-ivory border border-white/[0.08] hover:border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all flex items-center gap-2 rounded-xs cursor-pointer"
              >
                <Kanban className="w-4 h-4 text-gold" />
                <span>{t('dash_hero_projects_board') || 'Quadro de Projetos'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatsCard
            title={isCriadora ? (t('dash_stat_est_revenue') || 'Faturamento Estimado') : 'Faturamento do Roster'}
            value={isCriadora ? revenue : 'R$ 0,00'}
            change="Conta Aprovada"
            isPositive={true}
            subtitle="Atualizado via Curadoria"
            icon={DollarSign}
            highlight={true}
            badgeText="Oficial"
          />

          <StatsCard
            title={isCriadora ? (t('dash_stat_connected_agencies') || 'Agências Conectadas') : 'Modelos no Roster'}
            value="Disponível"
            change="Rede Aberta"
            isPositive={true}
            subtitle="Conexões diretas"
            icon={Building2}
          />

          <StatsCard
            title={t('dash_stat_ongoing_projects') || 'Projetos em Andamento'}
            value="Kanban Ativo"
            change="0 Pendências"
            isPositive={true}
            subtitle="Acesse a aba Projetos"
            icon={Kanban}
          />

          <StatsCard
            title={t('dash_stat_secure_storage') || 'Armazenamento Seguro'}
            value="Drive E2E"
            change="Cloudflare R2"
            isPositive={true}
            subtitle="Arquivos e contratos"
            icon={HardDrive}
          />
        </div>

        {/* Grade de Módulos da Plataforma com Design Limpo e Fluido */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-gold/70 font-semibold block">
                Navegação Rápida
              </span>
              <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                {t('dash_modules_title') || 'Módulos do Ecossistema'}
              </h3>
            </div>
            <span className="text-xs font-sans text-ivory/40">{t('dash_modules_subtitle') || '6 ferramentas integradas'}</span>
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
                  {isCriadora ? (t('dash_nav_book') || 'Meu Book & Ficha Técnica') : (t('dash_nav_roster') || 'Gestão de Agenciadas')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {isCriadora
                    ? 'Upload e visualização de fotos profissionais em alta resolução, vídeo showreel e medidas corporais.'
                    : 'Acompanhamento do elenco agenciado e contratos de exclusividade.'}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_module') || 'Acessar Módulo'}</span>
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
                  {isCriadora ? (t('dash_nav_agencies') || 'Rede de Agências') : (t('dash_nav_scout') || 'Talent Scout')}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  {isCriadora
                    ? 'Catálogo oficial de agências internacionais parceiras e envio direto de candidaturas com portfólio.'
                    : 'Filtros avançados de busca por medidas, biometria e idiomas de modelos verificadas.'}
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_module') || 'Acessar Módulo'}</span>
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
                  {t('dash_nav_kanban') || 'Quadro de Projetos'}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  Gerenciamento visual em colunas (A Fazer, Em Produção, Concluído) para organização de ensaios e produções.
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_board') || 'Acessar Quadro'}</span>
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
                  {t('dash_nav_chat') || 'Mensagens & Chat'}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  Canal de comunicação seguro com a Mesa de Curadoria e diretores de agências com anexos protegidos.
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_open_chat') || 'Abrir Chat'}</span>
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
                  {t('dash_nav_meet') || 'Lumiardi Meet'}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  Salas executivas de videoconferência com transmissão HD, chat interno e compartilhamento de tela.
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_start_call') || 'Iniciar Chamada'}</span>
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
                  {t('dash_nav_drive') || 'Lumiardi Drive'}
                </h4>
                <p className="text-xs font-sans text-ivory/60 mt-1.5 leading-relaxed">
                  Repositório em nuvem de alta segurança (Cloudflare R2) para armazenamento de fotos RAW e contratos.
                </p>
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                <span>{t('dash_access_files') || 'Acessar Arquivos'}</span>
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
