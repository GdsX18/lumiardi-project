'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { KanbanBoard } from '@/components/interactive/KanbanBoard';
import { ChatPanel } from '@/components/interactive/ChatPanel';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';
import { Badge } from '@/components/ui/Badge';
import { Kanban, MessageSquare, Video, HardDrive, ShieldCheck, User } from 'lucide-react';

import { useLanguage } from '@/context/LanguageContext';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'chat' | 'video' | 'drive'>('kanban');
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-black-matte font-sans">
      <Header />

      {/* Top Banner do Dashboard */}
      <section className="pt-36 pb-8 bg-[#0B0B0B] text-ivory border-b border-bronze/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="gold">{t('dash_exclusive_panel')}</Badge>
                <span className="text-xs text-bronze uppercase tracking-widest font-sans">
                  {t('dash_active_session')}
                </span>
              </div>
              <h1 className="font-serif-lumiardi text-3xl md:text-5xl font-light text-ivory">
                {t('dash_simulated_work')}
              </h1>
            </div>

            <div className="flex items-center gap-4 bg-[#141414] p-3 border border-bronze/20">
              <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-serif-lumiardi font-bold">
                <User className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-serif-lumiardi text-sm text-ivory block font-medium">
                  {t('dash_test_profile')}
                </span>
                <span className="text-emerald-400 font-sans flex items-center gap-1 text-[10px]">
                  <ShieldCheck className="w-3 h-3" /> {t('dash_status_verified')}
                </span>
              </div>
            </div>
          </div>

          {/* Navegação de Abas do Dashboard */}
          <div className="flex gap-2 mt-8 pt-4 border-t border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-sans font-medium uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === 'kanban'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-transparent text-ivory/60 hover:text-ivory'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>{t('dash_tab_kanban')}</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-sans font-medium uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === 'chat'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-transparent text-ivory/60 hover:text-ivory'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('dash_tab_chat')}</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-sans font-medium uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === 'drive'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-transparent text-ivory/60 hover:text-ivory'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>{t('dash_tab_drive')}</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-sans font-medium uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === 'video'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-transparent text-ivory/60 hover:text-ivory'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{t('dash_tab_meet')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Conteúdo da Aba Ativa */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {activeTab === 'kanban' && <KanbanBoard />}

          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto">
              <ChatPanel />
            </div>
          )}

          {activeTab === 'drive' && (
            <div className="max-w-6xl mx-auto">
              <SharedDrivePanel />
            </div>
          )}

          {activeTab === 'video' && (
            <div className="max-w-4xl mx-auto">
              <VideoCallWidget />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
