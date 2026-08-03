'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoard } from '@/components/interactive/KanbanBoard';
import { ChatPanel } from '@/components/interactive/ChatPanel';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';
import { ArrowRight, Layers, Kanban, MessageSquare, Video } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const DashboardShowcaseSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'chat' | 'video'>('kanban');
  const router = useRouter();
  const { t } = useLanguage();

  const tabs = [
    {
      id: 'kanban' as const,
      label: t('ds_tab1_label'),
      sublabel: t('ds_tab1_sub'),
      icon: Kanban,
    },
    {
      id: 'chat' as const,
      label: t('ds_tab2_label'),
      sublabel: t('ds_tab2_sub'),
      icon: MessageSquare,
    },
    {
      id: 'video' as const,
      label: t('ds_tab3_label'),
      sublabel: t('ds_tab3_sub'),
      icon: Video,
    },
  ];

  return (
    <section
      id="dashboard-showcase"
      className="w-full bg-[#0B0B0B] text-ivory py-24 md:py-32 relative overflow-hidden transition-colors duration-700"
    >
      <div className="w-full max-w-6xl mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center">
        {/* Header da Seção */}
        <div className="text-center space-y-4 max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-gold border border-gold/30 bg-gold/5 font-sans">
            <Layers className="w-3.5 h-3.5 stroke-[1.2]" />
            <span>{t('ds_tag')}</span>
          </div>
          <h2 className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl font-light text-ivory tracking-tight">
            {t('ds_title')}
          </h2>
          <p className="text-sm md:text-base text-ivory/60 font-sans max-w-xl mx-auto font-light leading-relaxed">
            {t('ds_desc')}
          </p>
        </div>

        {/* Sistema de Abas Interativas (Tabs) */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10 w-full max-w-4xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3.5 border transition-all duration-300 font-sans text-left cursor-pointer ${
                  isActive
                    ? 'border-[#C9A96B] bg-[#C9A96B]/15 text-[#C9A96B] shadow-[0_0_20px_rgba(201,169,107,0.15)]'
                    : 'border-white/10 bg-[#121212] text-ivory/60 hover:border-white/30 hover:text-ivory'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C9A96B]' : 'text-ivory/40'}`} />
                <div>
                  <span className="block text-xs md:text-sm font-medium uppercase tracking-wider">
                    {tab.label}
                  </span>
                  <span className="block text-[10px] text-ivory/40 font-light">
                    {tab.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Container do Componente Ativo */}
        <div className="w-full relative min-h-[480px] bg-[#121212] border border-white/10 shadow-2xl overflow-hidden p-2 md:p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full h-full flex justify-center items-center"
            >
              {activeTab === 'kanban' && <KanbanBoard />}

              {activeTab === 'chat' && (
                <div className="w-full max-w-3xl mx-auto py-2">
                  <ChatPanel />
                </div>
              )}

              {activeTab === 'video' && (
                <div className="w-full max-w-4xl mx-auto py-2">
                  <VideoCallWidget />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Botão de Ação CTA Fixado e Bem Visível */}
        <div className="text-center pt-10 z-20">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-[#C9A96B] text-[#0B0B0B] font-sans text-xs md:text-sm tracking-[0.25em] uppercase font-medium hover:bg-[#D4B87A] transition-all duration-300 inline-flex items-center gap-3 group cursor-pointer shadow-lg hover:shadow-gold/20"
          >
            <span>{t('ds_cta')}</span>
            <ArrowRight className="w-4 h-4 stroke-[1.2] transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
