'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Kanban,
  MessageSquare,
  Video,
  HardDrive,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Play,
  Mic,
  Video as VideoIcon,
  Monitor,
  PhoneOff,
  Folder,
  FileText,
  Image as ImageIcon,
  Check,
  Send,
  Paperclip,
  Activity,
  Zap,
} from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useLanguage } from '@/context/LanguageContext';

type TabId = 'kanban' | 'chat' | 'video' | 'drive';

export const DashboardShowcaseSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('kanban');
  const router = useRouter();
  const { t } = useLanguage();

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const showcaseCardRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const tabs = [
    {
      id: 'kanban' as const,
      label: t('ds_tab1_label') || '01. Kanban de Projetos',
      sublabel: t('ds_tab1_sub') || 'Organização & Tarefas',
      icon: Kanban,
    },
    {
      id: 'chat' as const,
      label: t('ds_tab2_label') || '02. Chat Criptografado',
      sublabel: t('ds_tab2_sub') || 'Comunicação Direta',
      icon: MessageSquare,
    },
    {
      id: 'video' as const,
      label: t('ds_tab3_label') || '03. Lumiardi Meet',
      sublabel: t('ds_tab3_sub') || 'Reunião HD & Sigilo',
      icon: Video,
    },
    {
      id: 'drive' as const,
      label: t('ds_tab4_label') || '04. Lumiardi Drive',
      sublabel: t('ds_tab4_sub') || 'Armazenamento & Mídias',
      icon: HardDrive,
    },
  ];

  // Animação de entrada inicial via ScrollTrigger
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
        );
      }

      if (tabsBarRef.current) {
        tl.fromTo(
          tabsBarRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
          '-=0.4'
        );
      }

      if (showcaseCardRef.current) {
        tl.fromTo(
          showcaseCardRef.current,
          { opacity: 0, y: 30, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' },
          '-=0.3'
        );
      }
    },
    { scope: sectionRef }
  );

  // Transição fluida com GSAP sempre que o usuário troca de aba
  useGSAP(
    () => {
      if (!leftColRef.current || !rightColRef.current) return;

      const tl = gsap.timeline();

      tl.fromTo(
        leftColRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
      );

      tl.fromTo(
        rightColRef.current,
        { opacity: 0, x: 25, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: 'power3.out' },
        '<0.05'
      );
    },
    { dependencies: [activeTab], scope: showcaseCardRef }
  );

  return (
    <section
      ref={sectionRef}
      id="dashboard-showcase"
      className="w-full bg-[#070707] text-ivory py-20 sm:py-28 md:py-32 relative overflow-hidden transition-colors duration-700 border-t border-[#C9A96B]/15"
    >
      {/* Luz ambiente dourada de fundo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#C9A96B]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10 flex flex-col items-center">
        {/* Header da Seção */}
        <div ref={headerRef} className="text-center space-y-3 sm:space-y-4 max-w-3xl mb-10 sm:mb-12 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#C9A96B] border border-[#C9A96B]/30 bg-[#C9A96B]/5 font-sans rounded-xs">
            <Layers className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>{t('ds_tag') || 'MÓDULOS DA PLATAFORMA'}</span>
          </div>

          <h2 className="font-serif-lumiardi text-3xl sm:text-5xl md:text-6xl font-light text-ivory tracking-tight leading-tight">
            {t('ds_title') || 'O ecossistema em ação.'}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-ivory/70 font-sans max-w-2xl mx-auto font-light leading-relaxed">
            {t('ds_desc') ||
              'Explore a evolução das ferramentas corporativas: Kanban de Projetos, Chat Criptografado, Lumiardi Meet e Lumiardi Drive integrados.'}
          </p>
        </div>

        {/* Sistema de Abas (Tabs) Fluido & Clean */}
        <div
          ref={tabsBarRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-8 sm:mb-10 w-full max-w-5xl"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 border transition-all duration-300 font-sans text-left cursor-pointer rounded-xs ${
                  isActive
                    ? 'border-[#C9A96B] bg-[#141414] text-[#C9A96B] shadow-[0_0_25px_rgba(201,169,107,0.15)] ring-1 ring-[#C9A96B]/50'
                    : 'border-white/10 bg-[#0E0E0E] text-ivory/60 hover:border-white/25 hover:text-ivory hover:bg-[#121212]'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xs flex items-center justify-center shrink-0 border transition-colors ${
                    isActive
                      ? 'border-[#C9A96B]/50 bg-[#C9A96B]/15 text-[#C9A96B]'
                      : 'border-white/10 bg-white/5 text-ivory/40'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
                    {tab.label}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] text-ivory/50 font-light truncate">
                    {tab.sublabel}
                  </span>
                </div>

                {/* Linha indicadora ativa de ouro */}
                {isActive && (
                  <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#8C6B2F] via-[#C9A96B] to-[#D4B87A]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Container do Showcase: Divisão Explicativa + Mockup Visual de Alta Fidelidade */}
        <div
          ref={showcaseCardRef}
          className="w-full max-w-6xl bg-[#0D0D0D] border border-white/10 shadow-2xl rounded-xs overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 p-5 sm:p-8 md:p-10 items-center">
            {/* Coluna Esquerda: Explicação Aprofundada e Benefícios (40%) */}
            <div ref={leftColRef} className="lg:col-span-5 space-y-5 sm:space-y-6 text-left">
              {activeTab === 'kanban' && (
                <>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] font-mono font-semibold px-2.5 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 rounded-xs">
                      <Zap className="w-3 h-3" /> MÓDULO 01 · GESTÃO DE ENTREGAS
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl sm:text-3xl md:text-4xl font-light text-ivory leading-tight">
                      Organização visual de campanhas e ensaios
                    </h3>
                    <p className="text-xs sm:text-sm text-ivory/70 font-sans leading-relaxed font-light">
                      Centralize todo o fluxo de produção, aprovação de briefings, cronogramas de lançamento e entregas de conteúdo entre criadoras e agências sem ruídos operacionais.
                    </p>
                  </div>

                  {/* 3 Benefícios Chave */}
                  <div className="space-y-2.5 sm:space-y-3 pt-1">
                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Fluxo de Colunas Estruturado</strong>
                        <span className="text-[11px] text-ivory/60">Etapas claras desde o briefing inicial até a aprovação final e publicação.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Controle de Prazos & Prioridades</strong>
                        <span className="text-[11px] text-ivory/60">Etiquetas de urgência, datas-limite e checklists de entrega integrados.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Transparência & Histórico</strong>
                        <span className="text-[11px] text-ivory/60">Agência e criadora acompanham o status de cada trabalho em tempo real.</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags Técnicas */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-ivory/50">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">TEMPO REAL</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">CHECKLISTS AUDITÁVEIS</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">MULTI-CAMPANHAS</span>
                  </div>
                </>
              )}

              {activeTab === 'chat' && (
                <>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] font-mono font-semibold px-2.5 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 rounded-xs">
                      <Lock className="w-3 h-3" /> MÓDULO 02 · MENSAGERIA BLINDADA
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl sm:text-3xl md:text-4xl font-light text-ivory leading-tight">
                      Comunicação direta com criptografia de ponta a ponta
                    </h3>
                    <p className="text-xs sm:text-sm text-ivory/70 font-sans leading-relaxed font-light">
                      Canal seguro e confidencial para negociação de valores, alinhamento de roteiros e troca de mídias sensíveis sem risco de interceptação ou vazamentos.
                    </p>
                  </div>

                  {/* 3 Benefícios Chave */}
                  <div className="space-y-2.5 sm:space-y-3 pt-1">
                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Criptografia Militar E2EE</strong>
                        <span className="text-[11px] text-ivory/60">As mensagens são cifradas no dispositivo do remetente e decifradas apenas pelo destinatário.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Notas de Voz & Mídias em Alta</strong>
                        <span className="text-[11px] text-ivory/60">Envie prévias de fotos e áudios de alinhamento com pureza sonora e sem compressão.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Sigilo & Autodestruição Opcional</strong>
                        <span className="text-[11px] text-ivory/60">Controle a retenção das conversas com expiração automática programada.</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags Técnicas */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-ivory/50">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">AES-256 GCM</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">ZERO-KNOWLEDGE</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">RECIBO CRIPTOGRÁFICO</span>
                  </div>
                </>
              )}

              {activeTab === 'video' && (
                <>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] font-mono font-semibold px-2.5 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 rounded-xs">
                      <Activity className="w-3 h-3" /> MÓDULO 03 · VIDEOCONFERÊNCIA HD
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl sm:text-3xl md:text-4xl font-light text-ivory leading-tight">
                      Reuniões executivas P2P sem gravação em servidores
                    </h3>
                    <p className="text-xs sm:text-sm text-ivory/70 font-sans leading-relaxed font-light">
                      Realize entrevistas de curadoria, alinhamentos estratégicos e reuniões executivas em alta definição 1080p via conexão direta ponto a ponto.
                    </p>
                  </div>

                  {/* 3 Benefícios Chave */}
                  <div className="space-y-2.5 sm:space-y-3 pt-1">
                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Tecnologia WebRTC P2P</strong>
                        <span className="text-[11px] text-ivory/60">Transmissão de vídeo direta entre os membros sem passar por servidores de armazenamento.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Zero Gravação & Sigilo Absoluto</strong>
                        <span className="text-[11px] text-ivory/60">Nenhum áudio ou vídeo é gravado, respeitando a privacidade institucional de ponta a ponta.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Compartilhamento de Tela Seguro</strong>
                        <span className="text-[11px] text-ivory/60">Apresente contratos, propostas e briefings em tempo real com alta fidelidade de imagem.</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags Técnicas */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-ivory/50">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">WEBRTC DIRECT</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">1080P 60FPS</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">ZERO-LOGS POLICY</span>
                  </div>
                </>
              )}

              {activeTab === 'drive' && (
                <>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] font-mono font-semibold px-2.5 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 rounded-xs">
                      <HardDrive className="w-3 h-3" /> MÓDULO 04 · COFRE DIGITAL DE MÍDIAS
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl sm:text-3xl md:text-4xl font-light text-ivory leading-tight">
                      Armazenamento seguro de arquivos RAW e contratos
                    </h3>
                    <p className="text-xs sm:text-sm text-ivory/70 font-sans leading-relaxed font-light">
                      Cofre corporativo em nuvem para compartilhamento de fotografias brutas, vídeos em 4K e documentos legais através de links temporários pré-assinados.
                    </p>
                  </div>

                  {/* 3 Benefícios Chave */}
                  <div className="space-y-2.5 sm:space-y-3 pt-1">
                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <Lock className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Links Pré-Assinados Expiráveis</strong>
                        <span className="text-[11px] text-ivory/60">URLs de download seguras com tempo de vida limitado contra redistribuição indevida.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <Lock className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Sem Compressão de Arquivos</strong>
                        <span className="text-[11px] text-ivory/60">Armazene arquivos RAW, ProRes e PDFs em sua resolução máxima sem perda de metadados.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/5 flex items-start gap-3">
                      <Lock className="w-4 h-4 text-[#C9A96B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs text-ivory font-medium">Pastas Segmentadas por Projeto</strong>
                        <span className="text-[11px] text-ivory/60">Separação automática de pastas por criadora, campanha ou contrato assinado.</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags Técnicas */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-ivory/50">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">AWS S3 ENCRYPTED</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">PRESIGNED URLS</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10">ANTI-PIRATARIA</span>
                  </div>
                </>
              )}
            </div>

            {/* Coluna Direita: Mockup Visual de Alta Fidelidade (60%) - Clean, Não Quebrável, Não Arrastável */}
            <div ref={rightColRef} className="lg:col-span-7">
              <div className="bg-[#050505] border border-[#C9A96B]/30 rounded-xs overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] select-none">
                {/* Barra de Janela / Window Chrome */}
                <div className="bg-[#111111] border-b border-white/10 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-[10px] font-mono text-ivory/40 uppercase tracking-wider ml-1 sm:ml-2">
                      lumiardi.suite // {activeTab}.module
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SISTEMA ATIVO</span>
                  </div>
                </div>

                {/* Conteúdo Ilustrativo do Mockup */}
                <div className="p-3.5 sm:p-6 bg-[#080808]">
                  {/* MOCKUP 1: KANBAN */}
                  {activeTab === 'kanban' && (
                    <div className="space-y-4">
                      {/* Topo do Kanban */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-[#C9A96B] font-mono font-semibold">
                            CAMPANHA ATIVA
                          </span>
                          <h4 className="font-serif-lumiardi text-base sm:text-lg text-ivory font-light">
                            Editorial de Moda · Primavera/Verão
                          </h4>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-mono px-2 py-1 bg-[#C9A96B]/15 text-[#C9A96B] border border-[#C9A96B]/30">
                          4 ENTREGAS
                        </span>
                      </div>

                      {/* As 3 Colunas Ilustrativas */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left">
                        {/* Coluna 1: Briefing / A Fazer */}
                        <div className="bg-[#111111] p-2.5 sm:p-3 border border-white/5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-ivory/60 font-semibold">
                              Briefing (1)
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          </div>

                          <div className="bg-[#181818] p-2.5 border border-white/10 space-y-2">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                              Lookbook
                            </span>
                            <p className="text-[11px] font-sans font-medium text-ivory leading-snug">
                              Seleção de Peças de Alta Costura
                            </p>
                            <div className="flex items-center justify-between text-[9px] text-ivory/40 font-mono pt-1">
                              <span>Prazo: 18 Out</span>
                              <span className="text-[#C9A96B]">Alta</span>
                            </div>
                          </div>
                        </div>

                        {/* Coluna 2: Em Produção */}
                        <div className="bg-[#111111] p-2.5 sm:p-3 border border-white/5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96B] font-semibold">
                              Em Produção (2)
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96B] animate-pulse" />
                          </div>

                          <div className="bg-[#181818] p-2.5 border border-[#C9A96B]/40 space-y-2 shadow-xs">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#C9A96B]/20 text-[#C9A96B] border border-[#C9A96B]/30 uppercase">
                              Vídeo 4K
                            </span>
                            <p className="text-[11px] font-sans font-medium text-ivory leading-snug">
                              Gravação de Reels & Teaser
                            </p>
                            <div className="w-full bg-black/60 h-1 rounded-full overflow-hidden">
                              <div className="w-3/4 h-full bg-[#C9A96B]" />
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-ivory/50 font-mono">
                              <span>Checklist: 3/4</span>
                              <span className="text-emerald-400">75%</span>
                            </div>
                          </div>

                          <div className="bg-[#181818] p-2.5 border border-white/10 space-y-1.5">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase">
                              Fotografia
                            </span>
                            <p className="text-[11px] font-sans font-medium text-ivory leading-snug">
                              Ensaio em Estúdio Luz Natural
                            </p>
                          </div>
                        </div>

                        {/* Coluna 3: Concluído */}
                        <div className="bg-[#111111] p-2.5 sm:p-3 border border-white/5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                              Concluído (1)
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>

                          <div className="bg-[#181818] p-2.5 border border-emerald-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                                Legal
                              </span>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <p className="text-[11px] font-sans font-medium text-ivory leading-snug">
                              Contrato NDA Homologado
                            </p>
                            <span className="text-[9px] text-emerald-400 font-mono block">
                              ✓ Assinado digitalmente
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MOCKUP 2: CHAT CRIPTOGRAFADO */}
                  {activeTab === 'chat' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-left">
                      {/* Lista Lateral de Contatos */}
                      <div className="sm:col-span-4 bg-[#111111] p-2.5 border border-white/5 space-y-2">
                        <span className="text-[9px] uppercase tracking-wider text-ivory/50 font-mono block px-1">
                          Conversas Blindadas
                        </span>

                        <div className="p-2 bg-[#1C1C1C] border-l-2 border-[#C9A96B] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ivory truncate">Agência Lumina</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <p className="text-[9px] text-ivory/50 truncate">Material aprovado...</p>
                        </div>

                        <div className="p-2 bg-transparent hover:bg-white/5 space-y-0.5 opacity-60">
                          <span className="text-[11px] font-medium text-ivory block truncate">Diretor de Mídia</span>
                          <p className="text-[9px] text-ivory/40 truncate">Reunião amanhã às 15h</p>
                        </div>
                      </div>

                      {/* Janela de Mensagens */}
                      <div className="sm:col-span-8 bg-[#111111] p-3 border border-white/5 flex flex-col justify-between min-h-[220px]">
                        {/* Header do Chat */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px] text-[#C9A96B] font-bold">
                              AL
                            </div>
                            <div>
                              <span className="text-xs font-medium text-ivory block">Agência Lumina Elite</span>
                              <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> CHAVE E2EE VERIFICADA
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Balões de Mensagem */}
                        <div className="space-y-2 py-3 text-xs font-sans">
                          {/* Balão Recebido */}
                          <div className="bg-[#1C1C1C] p-2.5 border border-white/10 max-w-[85%] space-y-1">
                            <p className="text-[11px] text-ivory/90 leading-relaxed">
                              Isabella, o teaser em 4K e o contrato final já estão no Drive Seguro prontos para sua conferência.
                            </p>
                            <span className="text-[8px] font-mono text-ivory/40 block text-right">14:32</span>
                          </div>

                          {/* Balão Enviado */}
                          <div className="bg-[#C9A96B]/15 border border-[#C9A96B]/40 p-2.5 ml-auto max-w-[85%] space-y-1">
                            <p className="text-[11px] text-ivory leading-relaxed">
                              Perfeito! Acabei de conferir o material. Ficou extraordinário, já autorizei a campanha.
                            </p>
                            <div className="flex items-center justify-end gap-1 text-[8px] font-mono text-[#C9A96B]">
                              <span>14:35</span>
                              <span>✓✓</span>
                            </div>
                          </div>
                        </div>

                        {/* Input Simulado */}
                        <div className="bg-[#050505] p-2 border border-white/10 flex items-center justify-between text-[11px] text-ivory/40">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Mensagem criptografada...</span>
                          </div>
                          <div className="w-6 h-6 bg-[#C9A96B] text-[#0B0B0B] flex items-center justify-center rounded-xs">
                            <Send className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MOCKUP 3: LUMIARDI MEET */}
                  {activeTab === 'video' && (
                    <div className="space-y-3 text-left">
                      {/* Topo da Chamada */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#C9A96B] bg-[#C9A96B]/15 px-2 py-0.5 border border-[#C9A96B]/30 uppercase">
                            SALA PRIVADA #049
                          </span>
                          <span className="text-xs text-ivory/70 font-sans truncate">Curadoria & Alinhamento de Contrato</span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 shrink-0">HD 1080P · 60 FPS</span>
                      </div>

                      {/* Grades de Vídeo dos Participantes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Participante 1: Agência */}
                        <div className="relative bg-[#111111] aspect-video border border-white/10 rounded-xs flex flex-col items-center justify-center p-3 overflow-hidden">
                          <div className="w-12 h-12 rounded-full bg-[#C9A96B]/15 border border-[#C9A96B]/40 flex items-center justify-center text-[#C9A96B] font-serif-lumiardi text-lg font-bold">
                            AL
                          </div>
                          <span className="text-[10px] text-ivory/80 font-sans mt-2 font-medium">
                            Diretoria de Casting · Lumina
                          </span>

                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[8px] font-mono bg-black/80 px-2 py-0.5 border border-white/10">
                            <Mic className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Áudio Ativo</span>
                          </div>
                        </div>

                        {/* Participante 2: Criadora */}
                        <div className="relative bg-[#111111] aspect-video border border-[#C9A96B]/50 rounded-xs flex flex-col items-center justify-center p-3 overflow-hidden">
                          <div className="w-12 h-12 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center text-ivory font-serif-lumiardi text-lg font-bold">
                            IM
                          </div>
                          <span className="text-[10px] text-ivory/80 font-sans mt-2 font-medium">
                            Isabella Moreira (Criadora)
                          </span>

                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[8px] font-mono bg-black/80 px-2 py-0.5 border border-[#C9A96B]/40 text-[#C9A96B]">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Verificada</span>
                          </div>
                        </div>
                      </div>

                      {/* Barra Flutuante de Controles */}
                      <div className="flex items-center justify-center gap-2.5 sm:gap-3 pt-1">
                        <div className="p-2 bg-[#181818] border border-white/10 text-ivory rounded-xs">
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                        <div className="p-2 bg-[#181818] border border-white/10 text-ivory rounded-xs">
                          <VideoIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="p-2 bg-[#181818] border border-white/10 text-[#C9A96B] rounded-xs">
                          <Monitor className="w-3.5 h-3.5" />
                        </div>
                        <div className="px-3 py-1.5 bg-rose-600/80 text-white rounded-xs text-[10px] font-mono uppercase flex items-center gap-1">
                          <PhoneOff className="w-3 h-3" /> Encerrar
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MOCKUP 4: LUMIARDI DRIVE */}
                  {activeTab === 'drive' && (
                    <div className="space-y-3 text-left">
                      {/* Topo do Drive */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-[#C9A96B] font-mono font-semibold">
                            COFRE S3 CRIPTOGRAFADO
                          </span>
                          <h4 className="font-serif-lumiardi text-base text-ivory font-light">
                            Repositório Privado // Isabella Moreira
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-ivory/50">142.4 GB / 1.0 TB</span>
                      </div>

                      {/* Pastas Principais */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="p-2 bg-[#121212] border border-white/10 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-[#C9A96B] shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-[10px] text-ivory font-medium truncate">Ensaios RAW 2026</span>
                            <span className="text-[8px] text-ivory/40 font-mono">18 Arquivos</span>
                          </div>
                        </div>

                        <div className="p-2 bg-[#121212] border border-white/10 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-[#C9A96B] shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-[10px] text-ivory font-medium truncate">Vídeos Master 4K</span>
                            <span className="text-[8px] text-ivory/40 font-mono">6 Arquivos</span>
                          </div>
                        </div>

                        <div className="p-2 bg-[#121212] border border-white/10 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-[10px] text-ivory font-medium truncate">NDAs Assinados</span>
                            <span className="text-[8px] text-ivory/40 font-mono">4 Documentos</span>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Arquivos Recentes */}
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2 bg-[#121212] border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-[#C9A96B]" />
                            <span className="text-[11px] font-mono text-ivory truncate max-w-[150px] sm:max-w-[180px]">
                              Look_Editorial_01_Master.RAW
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[9px] text-ivory/50">
                            <span>48.5 MB</span>
                            <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-500/30">
                              LINK ATIVO
                            </span>
                          </div>
                        </div>

                        <div className="p-2 bg-[#121212] border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[11px] font-mono text-ivory truncate max-w-[150px] sm:max-w-[180px]">
                              Contrato_Exclusividade_Lumina.pdf
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[9px] text-ivory/50">
                            <span>2.4 MB</span>
                            <span className="text-blue-300 bg-blue-950/40 px-1.5 py-0.5 border border-blue-500/30">
                              ASSINADO
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Inferior para o Dashboard */}
        <div className="text-center pt-10 sm:pt-12 z-20">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-8 sm:px-10 py-4 bg-[#C9A96B] text-[#0B0B0B] font-sans text-xs md:text-sm tracking-[0.25em] uppercase font-bold hover:bg-[#D4B87A] transition-all duration-300 inline-flex items-center gap-3 group cursor-pointer shadow-xl hover:shadow-[0_0_30px_rgba(201,169,107,0.3)] text-center"
          >
            <span>{t('ds_cta') || 'ACESSAR DASHBOARD COMPLETO'}</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5] transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
