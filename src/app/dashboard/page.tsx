'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { KanbanBoard } from '@/components/interactive/KanbanBoard';
import { ChatPanel } from '@/components/interactive/ChatPanel';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';
import { Badge } from '@/components/ui/Badge';
import { Kanban, MessageSquare, Video, ShieldCheck, User } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'chat' | 'video'>('kanban');

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-black-matte font-sans">
      <Header />

      {/* Top Banner do Dashboard */}
      <section className="pt-36 pb-8 bg-[#0B0B0B] text-ivory border-b border-bronze/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="gold">PAINEL EXCLUSIVO</Badge>
                <span className="text-xs text-bronze uppercase tracking-widest font-sans">
                  Sessão Ativa · Criptografia Ponta a Ponta
                </span>
              </div>
              <h1 className="font-serif-lumiardi text-3xl md:text-5xl font-light text-ivory">
                Dashboard de Trabalho Simulado
              </h1>
            </div>

            <div className="flex items-center gap-4 bg-[#141414] p-3 border border-bronze/20">
              <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-serif-lumiardi font-bold">
                <User className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-serif-lumiardi text-sm text-ivory block font-medium">
                  Perfil de Teste (Criador)
                </span>
                <span className="text-emerald-400 font-sans flex items-center gap-1 text-[10px]">
                  <ShieldCheck className="w-3 h-3" /> Status: Verificado +18
                </span>
              </div>
            </div>
          </div>

          {/* Navegação de Abas do Dashboard */}
          <div className="flex gap-2 mt-8 pt-4 border-t border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-sans font-medium uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'kanban'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-transparent text-ivory/60 hover:text-ivory'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Organização (Kanban)</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-sans font-medium uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'chat'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-transparent text-ivory/60 hover:text-ivory'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat Interno</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-sans font-medium uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'video'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-transparent text-ivory/60 hover:text-ivory'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Meet Integrado</span>
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
