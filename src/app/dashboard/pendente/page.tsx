'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Calendar,
  LogOut,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
  FileText,
  User,
  Building2,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Badge } from '@/components/ui/Badge';
import { useAuthPortal } from '@/context/AuthPortalContext';

export default function CuradoriaPendentePage() {
  const router = useRouter();
  const { refreshData } = useAuthPortal();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user || null);
          if (data.user?.curationStatus === 'APROVADO') {
            // Se já foi aprovado, vai para o dashboard
            router.push('/dashboard');
          }
        }
      } catch (e) {
        console.error('Erro ao buscar dados do usuário:', e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const handleApproveSimulation = async () => {
    setApproving(true);
    try {
      const res = await fetch('/api/curation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        await refreshData();
        router.push('/dashboard');
      }
    } catch (e) {
      console.error('Erro na aprovação:', e);
    } finally {
      setApproving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await refreshData();
      router.push('/login');
    } catch (e) {
      console.error('Erro ao sair:', e);
      router.push('/login');
    }
  };

  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-gold selection:text-black-matte">
      <Header />

      <section className="pt-36 pb-20 px-4 md:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-6 md:p-12 bg-[#0E0E0E] border border-gold/40 shadow-2xl space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          {/* Topo do Card de Curadoria */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold/10 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-xl shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="gold">STATUS: EM CURADORIA</Badge>
                  <span className="text-[10px] font-sans text-gold uppercase tracking-widest">
                    Auditoria de Conformidade
                  </span>
                </div>
                <h1 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory mt-1">
                  Mesa de Curadoria Lumiardi
                </h1>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 bg-[#161616] hover:bg-rose-950/40 text-ivory/70 hover:text-rose-300 border border-white/10 hover:border-rose-700/50 text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Saindo...' : 'Sair / Logout'}</span>
            </button>
          </div>

          {/* Mensagem Principal Conforme o Requisito */}
          <div className="p-5 md:p-6 bg-[#141414] border border-gold/20 space-y-3">
            <div className="flex items-center gap-2 text-gold font-serif-lumiardi text-lg font-medium">
              <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
              <span>Análise de Credencial em Andamento</span>
            </div>
            <p className="text-xs md:text-sm text-ivory/80 font-sans leading-relaxed">
              &quot;Sua credencial está sob análise da Mesa de Curadoria Lumiardi. Você receberá a liberação em breve.&quot;
            </p>
            <p className="text-[11px] text-ivory/50 font-sans">
              Para preservar a segurança, discrição e os contratos de alto escalão do nosso ecossistema, 100% dos perfis de modelos e agências passam por auditoria documental prévia.
            </p>
          </div>

          {/* Resumo dos Dados Enviados */}
          {userData && (
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-bronze font-semibold font-sans block">
                Resumo dos Dados Submetidos
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-sans">
                <div className="p-3 bg-[#151515] border border-white/5 space-y-1">
                  <span className="text-[10px] text-ivory/40 uppercase block">Nome Registrado</span>
                  <span className="font-serif-lumiardi text-base text-ivory font-medium block truncate">
                    {userData.name}
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 space-y-1">
                  <span className="text-[10px] text-ivory/40 uppercase block">E-mail de Contato</span>
                  <span className="text-ivory/80 block truncate">{userData.email}</span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 space-y-1">
                  <span className="text-[10px] text-ivory/40 uppercase block">Tipo de Perfil</span>
                  <span className="text-gold font-medium uppercase">
                    {userData.role === 'agencia' ? 'Agência Corporativa' : 'Modelo / Criadora VIP'}
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 space-y-1">
                  <span className="text-[10px] text-ivory/40 uppercase block">Documento Anexado</span>
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px] truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    {userData.documentName || 'Documento de Identificação Validado'}
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 space-y-1">
                  <span className="text-[10px] text-ivory/40 uppercase block">Data de Submissão</span>
                  <span className="text-ivory/70 text-[11px]">
                    {new Date(userData.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 space-y-1">
                  <span className="text-[10px] text-ivory/40 uppercase block">Criptografia da Sessão</span>
                  <span className="text-gold flex items-center gap-1 text-[11px]">
                    <Lock className="w-3 h-3 shrink-0" /> AES-256 Bit
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Etapas do Fluxo de Curadoria */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-ivory/40 font-semibold font-sans block">
              Etapas da Mesa de Curadoria
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
              <div className="p-3.5 bg-[#121212] border border-emerald-500/30 text-emerald-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1. Recepção</span>
                </div>
                <p className="text-[10px] text-ivory/60">Documentos e respostas cadastrais recebidos.</p>
              </div>

              <div className="p-3.5 bg-[#16120B] border border-gold/40 text-gold space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Clock className="w-4 h-4 text-gold animate-spin" />
                  <span>2. Auditoria</span>
                </div>
                <p className="text-[10px] text-ivory/60">Compliance de privacidade em andamento.</p>
              </div>

              <div className="p-3.5 bg-[#121212] border border-white/10 text-ivory/40 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>3. Liberação VIP</span>
                </div>
                <p className="text-[10px] text-ivory/40">Acesso instantâneo a Kanban, Drive e Chat.</p>
              </div>
            </div>
          </div>

          {/* Caixa de Simulação de Aprovação para Testes Imediatos */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0A0A] p-4 border">
            <div>
              <span className="text-xs font-serif-lumiardi text-gold font-medium block">
                Ambiente de Testes / Demonstração:
              </span>
              <span className="text-[11px] text-ivory/50 font-sans">
                Clique para simular a aprovação instantânea da Mesa de Curadoria e liberar o Dashboard.
              </span>
            </div>

            <button
              onClick={handleApproveSimulation}
              disabled={approving}
              className="px-6 py-3 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${approving ? 'animate-spin' : ''}`} />
              <span>{approving ? 'Liberando Acesso...' : 'Aprovar Credencial Agora'}</span>
            </button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
