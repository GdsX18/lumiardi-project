'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  LogOut,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  CreditCard,
  XCircle,
  Award,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Badge } from '@/components/ui/Badge';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { VIPWelcomeCelebrationModal } from '@/components/dashboard/VIPWelcomeCelebrationModal';

export default function CuradoriaPendentePage() {
  const router = useRouter();
  const { refreshData } = useAuthPortal();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user || null);
          if (data.user?.curationStatus === 'APROVADO') {
            setShowCelebrationModal(true);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar dados do usuário:', e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

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
        setUserData((prev: any) => ({ ...prev, curationStatus: 'APROVADO' }));
        setShowCelebrationModal(true);
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

  const isRejected = userData?.curationStatus === 'REJEITADO';

  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#0B0B0B]">
      <Header />

      {/* Modal de Celebração de Boas-Vindas quando Aprovada */}
      <VIPWelcomeCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => {
          setShowCelebrationModal(false);
          router.push('/dashboard');
        }}
        userName={userData?.name || 'Membro VIP'}
        userRole={userData?.role || 'criadora'}
        memberId={`LUM-${(userData?.id || '8842').substring(0, 6).toUpperCase()}`}
        category={userData?.category || 'Criadora de Elite'}
      />

      <section className="pt-36 pb-20 px-4 md:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-6 md:p-12 bg-gradient-to-b from-[#11100C] via-[#0D0D0F] to-[#070708] border border-[#D4AF37]/40 shadow-2xl space-y-8 relative overflow-hidden rounded-xl"
        >
          {/* Efeitos de Fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#24221C] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="gold">
                  {isRejected ? 'HOMOLOGAÇÃO REPROVADA' : 'CURADORIA DE ELITE • 18 U.S.C. § 2257'}
                </Badge>
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-0.5 border border-[#D4AF37]/30">
                  ID #{userData?.id ? userData.id.substring(0, 8).toUpperCase() : 'PENDENTE'}
                </span>
              </div>
              <h1 className="font-serif-lumiardi text-2xl md:text-4xl text-ivory font-light pt-2">
                {isRejected ? (
                  <span className="text-red-400">Solicitação Não Aprovada</span>
                ) : (
                  <>Aguardando Homologação da <span className="italic text-[#F5D77F]">Curadoria</span></>
                )}
              </h1>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-transparent border border-white/10 hover:border-red-500/40 text-ivory/60 hover:text-red-400 text-xs font-mono uppercase tracking-widest transition-all cursor-pointer rounded-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Encerrando...' : 'Sair da Conta'}</span>
            </button>
          </div>

          {isRejected ? (
            /* ═══════════════════════════════════════════════════════════════
               CASO REJEITADO — INSTRUÇÕES DE REEMBOLSO
            ═══════════════════════════════════════════════════════════════ */
            <div className="space-y-6">
              <div className="p-6 bg-red-950/20 border border-red-500/40 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                  <XCircle className="w-5 h-5" />
                  <span>Seu perfil não atende aos critérios atuais da curadoria</span>
                </div>
                <p className="text-xs text-ivory/70 leading-relaxed font-light">
                  Agradecemos seu interesse. Conforme a política de transparência da Lumiardi, o valor da sua adesão foi <strong>estornado integralmente</strong> para a sua carteira/conta de origem.
                </p>
                {userData?.rejectionReason && (
                  <div className="p-3 bg-black/40 border border-red-500/20 text-xs text-red-300 font-mono">
                    Motivo: {userData.rejectionReason}
                  </div>
                )}
              </div>

              <div className="text-center pt-4">
                <Link
                  href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20esclarecimentos%20sobre%20minha%20curadoria%20Lumiardi"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Falar com o Concierge de Atendimento</span>
                </Link>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════
               CASO EM ANÁLISE — TIMELINE DE LUXO EM 3 ETAPAS
            ═══════════════════════════════════════════════════════════════ */
            <div className="space-y-8">
              {/* Timeline Interativa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Etapa 1: Biometria 2257 */}
                <div className="p-5 bg-black/40 border border-emerald-500/40 rounded-lg space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      Etapa 1
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-ivory">Biometria & OCR</h4>
                  <p className="text-xs text-ivory/60 leading-relaxed font-light">
                    Documento oficial e prova facial 3D homologados sob 18 U.S.C. § 2257.
                  </p>
                </div>

                {/* Etapa 2: Pagamento do Plano */}
                <div className="p-5 bg-black/40 border border-emerald-500/40 rounded-lg space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      Etapa 2
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-ivory">Plano de Adesão</h4>
                  <p className="text-xs text-ivory/60 leading-relaxed font-light">
                    Assinatura confirmada e reservada para ativação imediata após curadoria.
                  </p>
                </div>

                {/* Etapa 3: Curadoria */}
                <div className="p-5 bg-[#D4AF37]/10 border border-[#D4AF37]/60 rounded-lg space-y-2 relative animate-pulse">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5D77F] font-bold">
                      Etapa 3
                    </span>
                    <Clock className="w-4 h-4 text-[#F5D77F]" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#F5D77F]">Curadoria VIP</h4>
                  <p className="text-xs text-ivory/70 leading-relaxed font-light">
                    Análise em andamento pela diretoria Lumiardi (prazo médio: poucas horas).
                  </p>
                </div>
              </div>

              {/* Card Informativo com Concierge */}
              <div className="p-6 bg-gradient-to-r from-[#181611] to-[#0E0E11] border border-[#D4AF37]/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs text-[#F5D77F] uppercase tracking-wider font-semibold block">
                    ⚡ Deseja atendimento prioritário?
                  </span>
                  <p className="text-xs text-ivory/70 max-w-lg leading-relaxed font-light">
                    Você pode apresentar referências adicionais ou esclarecer dúvidas diretamente com nossa concierge exclusiva via WhatsApp.
                  </p>
                </div>

                <Link
                  href={`https://wa.me/5511999999999?text=Olá,%20sou%20a%20candidata%20${encodeURIComponent(userData?.name || 'Criadora')}%20(ID:%20${userData?.id || 'VIP'})%20e%20gostaria%20de%20agilizar%20minha%20curadoria%20na%20Lumiardi.`}
                  target="_blank"
                  className="px-5 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-[#25D366] text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Falar com Concierge VIP</span>
                </Link>
              </div>

              {/* Botão de Simulação para Testes do Administrador */}
              <div className="pt-4 border-t border-[#24221C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ivory/50">
                <span>Painel de Demonstração & Validação:</span>
                <button
                  onClick={handleApproveSimulation}
                  disabled={approving}
                  className="px-4 py-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#F5D77F] text-xs font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{approving ? 'Aprovando...' : 'Simular Aprovação Imediata (Demo)'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
