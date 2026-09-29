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
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { VIPWelcomeCelebrationModal } from '@/components/dashboard/VIPWelcomeCelebrationModal';

export default function CuradoriaPendentePage() {
  const router = useRouter();
  const { refreshData } = useAuthPortal();
  const { t } = useLanguage();

  const [userData, setUserData] = useState<any>(null);
  const [billingData, setBillingData] = useState<{ invoices: any[]; latestInvoice: any; subscription: any }>({
    invoices: [],
    latestInvoice: null,
    subscription: null,
  });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function loadUser(isFirst = false) {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user || null);
          setBillingData({
            invoices: data.invoices || [],
            latestInvoice: data.latestInvoice || null,
            subscription: data.subscription || null,
          });
          if (data.user?.curationStatus === 'APROVADO') {
            const userId = data.user.id;
            const userKey = userId ? `lumiardi_vip_celebrated_${userId}` : 'lumiardi_vip_celebrated';
            const alreadySeen = typeof window !== 'undefined' && (localStorage.getItem(userKey) || localStorage.getItem('lumiardi_vip_celebrated'));

            if (intervalId) clearInterval(intervalId);
            refreshData();

            if (alreadySeen) {
              router.replace('/dashboard');
              return;
            }

            setShowCelebrationModal(true);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar dados do usuário:', e);
      } finally {
        if (isFirst) setLoading(false);
      }
    }

    loadUser(true);

    // Polling a cada 3.5s para transição instantânea quando a curadoria aprovar/recusar
    intervalId = setInterval(() => {
      loadUser(false);
    }, 3500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshData, router]);

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

  const handleCelebrationClose = () => {
    setShowCelebrationModal(false);
    if (typeof window !== 'undefined') {
      const userId = userData?.id;
      if (userId) {
        localStorage.setItem(`lumiardi_vip_celebrated_${userId}`, 'true');
      }
      localStorage.setItem('lumiardi_vip_celebrated', 'true');
      sessionStorage.setItem('lumiardi_vip_celebrated', 'true');
    }
    router.push('/dashboard');
  };

  const isRejected = userData?.curationStatus === 'REJEITADO';

  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#0B0B0B]">
      <Header />

      {/* Modal de Celebração de Boas-Vindas quando Aprovada */}
      <VIPWelcomeCelebrationModal
        isOpen={showCelebrationModal}
        onClose={handleCelebrationClose}
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
                <span className="px-3 py-1 text-[10px] font-sans uppercase tracking-[0.25em] font-semibold border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
                  {userData?.curationStatus === 'REJEITADO' || userData?.curationStatus === 'RECUSADO'
                    ? 'CANDIDATURA NÃO HOMOLOGADA'
                    : userData?.curationStatus === 'APROVADA_PAGAMENTO'
                    ? 'APROVADA NA CURADORIA'
                    : userData?.curationStatus === 'AGUARDANDO_REUNIAO'
                    ? 'ENTREVISTA AGENDADA'
                    : 'EM ANÁLISE DE CURADORIA'}
                </span>
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-0.5 border border-[#D4AF37]/30">
                  {userData?.id ? `ID: ${userData.id.substring(0, 8).toUpperCase()}` : 'ID PENDENTE'}
                </span>
              </div>
              <h1 className="font-serif-lumiardi text-2xl md:text-4xl text-ivory font-light pt-2">
                {userData?.curationStatus === 'REJEITADO' || userData?.curationStatus === 'RECUSADO' ? (
                  <span className="text-red-400">Candidatura Não Aprovada</span>
                ) : userData?.curationStatus === 'APROVADA_PAGAMENTO' ? (
                  <>
                    Aprovada pela Curadoria!{' '}
                    <span className="italic text-[#F5D77F]">Libere seu Acesso</span>
                  </>
                ) : userData?.curationStatus === 'AGUARDANDO_REUNIAO' ? (
                  <>
                    Entrevista Prévia{' '}
                    <span className="italic text-[#F5D77F]">Agendada</span>
                  </>
                ) : (
                  <>
                    Candidatura em{' '}
                    <span className="italic text-[#F5D77F]">Análise Prévia</span>
                  </>
                )}
              </h1>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-transparent border border-white/10 hover:border-red-500/40 text-ivory/60 hover:text-red-400 text-xs font-mono uppercase tracking-widest transition-all cursor-pointer rounded-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Saindo...' : 'Sair da Conta'}</span>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             ESTADO 1: REJEITADO / RECUSADO
          ═══════════════════════════════════════════════════════════════ */}
          {(userData?.curationStatus === 'REJEITADO' || userData?.curationStatus === 'RECUSADO') && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-6 bg-red-950/20 border border-red-500/40 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                  <XCircle className="w-5 h-5" />
                  <span>Candidatura Encerrada com Justificativa Protocolada</span>
                </div>
                <p className="text-xs text-ivory/70 leading-relaxed font-light">
                  Agradecemos seu interesse em integrar a plataforma Lumiardi. Após análise da equipe de curadoria, sua candidatura não pôde ser homologada neste momento.
                </p>
                {userData?.rejectionReason && (
                  <div className="p-3.5 bg-black/50 border border-red-500/20 text-xs text-red-300 font-mono rounded">
                    <span className="text-ivory/40 block text-[10px] uppercase font-sans mb-1">Motivo Registrado:</span>
                    {userData.rejectionReason}
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <Link
                  href={`https://wa.me/5511999999999?text=Olá,%20sou%20a%20candidata%20${encodeURIComponent(userData?.name || 'Membro')}%20(ID:%20${userData?.id || 'VIP'})%20e%20gostaria%20de%20esclarecimentos%20sobre%20o%20processo%20de%20curadoria.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Falar com a Equipe de Curadoria</span>
                </Link>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             ESTADO 2: APROVADA PARA PAGAMENTO (Pós-Entrevista Concluída)
          ═══════════════════════════════════════════════════════════════ */}
          {userData?.curationStatus === 'APROVADA_PAGAMENTO' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-6 md:p-8 bg-gradient-to-b from-[#181611] to-[#0E0E11] border-2 border-[#D4AF37] rounded-xl space-y-5 text-center shadow-2xl">
                <div className="w-14 h-14 bg-[#D4AF37]/20 border border-[#D4AF37] rounded-full flex items-center justify-center mx-auto text-[#F5D77F]">
                  <Award className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                    ENTREVISTA DE ALINHAMENTO CONCLUÍDA
                  </span>
                  <h3 className="font-serif-lumiardi text-2xl md:text-3xl text-ivory">
                    Parabéns, {userData?.name || 'Criadora'}!
                  </h3>
                  <p className="text-xs text-ivory/80 max-w-lg mx-auto leading-relaxed font-light">
                    Sua reunião com a Mesa de Curadoria foi um sucesso. O seu perfil foi aprovado com louvor e seu acesso ao ecossistema exclusivo Lumiardi foi liberado para ativação de pagamento.
                  </p>
                </div>

                <div className="p-4 bg-black/40 border border-[#D4AF37]/30 rounded-lg max-w-md mx-auto text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ivory/60">Plano Selecionado:</span>
                    <span className="font-bold text-[#F5D77F] uppercase tracking-wider">
                      {userData?.planId ? userData.planId.toUpperCase() : 'GLOW'} ({userData?.planBillingInterval === 'yearly' ? 'Anual' : 'Mensal'})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ivory/60">Status de Liberação:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprovada para Pagamento
                    </span>
                  </div>
                </div>

                <div className="pt-2 max-w-md mx-auto">
                  <Link
                    href={`/checkout?plan=${userData?.planId || 'glow'}&billing=${userData?.planBillingInterval || 'yearly'}`}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#AA820A] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer rounded-sm shadow-xl"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Efetuar Pagamento e Ativar Minha Conta →</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             ESTADO 3: AGUARDANDO REUNIÃO / ENTREVISTA DE CURADORIA
          ═══════════════════════════════════════════════════════════════ */}
          {(userData?.curationStatus === 'AGUARDANDO_REUNIAO' || (!userData?.curationStatus && !isRejected)) && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Timeline de 4 Etapas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1: Biometria */}
                <div className="p-4 bg-black/40 border border-emerald-500/40 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">ETAPA 1</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h4 className="text-xs font-semibold text-ivory">Biometria & KYC</h4>
                  <p className="text-[11px] text-ivory/60 leading-tight">Documentação 18+ validada com sucesso.</p>
                </div>

                {/* 2: Entrevista Agendada (Ativa) */}
                <div className="p-4 bg-[#D4AF37]/15 border-2 border-[#D4AF37] rounded-lg space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#F5D77F] font-bold">ETAPA 2 · ATIVA</span>
                    <Clock className="w-3.5 h-3.5 text-[#F5D77F] animate-spin" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#F5D77F]">Reunião de Curadoria</h4>
                  <p className="text-[11px] text-ivory/70 leading-tight">Aguardando entrevista via Google Meet.</p>
                </div>

                {/* 3: Aprovação */}
                <div className="p-4 bg-black/30 border border-white/10 rounded-lg space-y-1 opacity-70">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-ivory/40">ETAPA 3</span>
                    <Lock className="w-3.5 h-3.5 text-ivory/40" />
                  </div>
                  <h4 className="text-xs font-semibold text-ivory/70">Aprovação Final</h4>
                  <p className="text-[11px] text-ivory/50 leading-tight">Mesa decide sobre a homologação.</p>
                </div>

                {/* 4: Pagamento */}
                <div className="p-4 bg-black/30 border border-white/10 rounded-lg space-y-1 opacity-70">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-ivory/40">ETAPA 4</span>
                    <Lock className="w-3.5 h-3.5 text-ivory/40" />
                  </div>
                  <h4 className="text-xs font-semibold text-ivory/70">Pagamento & Acesso</h4>
                  <p className="text-[11px] text-ivory/50 leading-tight">Checkout do plano e ativação.</p>
                </div>
              </div>

              {/* Card Destaque: Detalhes do Agendamento */}
              <div className="p-6 md:p-8 bg-[#12110D] border border-[#D4AF37]/50 rounded-xl space-y-5">
                <div className="flex items-center gap-3 border-b border-[#24221C] pb-4">
                  <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-lg text-[#F5D77F]">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif-lumiardi text-xl text-ivory">Sua Entrevista Está Confirmada</h3>
                    <p className="text-xs text-ivory/60 font-light">Confira os dados do seu agendamento abaixo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-sm">
                    <span className="text-[10px] uppercase tracking-wider text-ivory/40 block mb-1">Data da Reunião</span>
                    <span className="font-mono text-sm text-[#F5D77F] font-semibold">
                      {userData?.interviewDate
                        ? userData.interviewDate.split('-').reverse().join('/')
                        : 'Aguardando Data'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-sm">
                    <span className="text-[10px] uppercase tracking-wider text-ivory/40 block mb-1">Horário Agendado</span>
                    <span className="font-mono text-sm text-[#F5D77F] font-semibold">
                      {userData?.interviewTime || '15:00'} (Horário de Brasília)
                    </span>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-sm">
                    <span className="text-[10px] uppercase tracking-wider text-ivory/40 block mb-1">WhatsApp de Contato</span>
                    <span className="font-mono text-sm text-emerald-400 font-semibold truncate block">
                      {userData?.whatsapp || userData?.phone || 'Cadastrado'}
                    </span>
                  </div>
                </div>

                {/* Instruções do Google Meet */}
                <div className="p-4 bg-[#181611] border border-[#D4AF37]/30 rounded-lg space-y-2 text-xs leading-relaxed font-light text-ivory/80">
                  <div className="flex items-center gap-2 text-[#F5D77F] font-semibold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Como funcionará a sua entrevista de alinhamento</span>
                  </div>
                  <p>
                    1. No dia e horário agendados, um membro da <strong>Mesa de Curadoria Lumiardi</strong> enviará o link seguro do <strong>Google Meet</strong> diretamente para o seu WhatsApp.
                  </p>
                  <p>
                    2. A reunião tem duração de 10 a 15 minutos e tem como objetivo o alinhamento de diretrizes, orientações de privacidade e conformidade de imagem.
                  </p>
                  <p>
                    3. Assim que a curadoria concluir a reunião, sua conta será homologada e o botão para pagamento da assinatura será liberado aqui nesta tela.
                  </p>
                </div>
              </div>

              {/* Botão de Suporte via WhatsApp */}
              <div className="p-5 bg-black/40 border border-white/10 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs text-ivory font-semibold block">Precisa alterar o horário ou falar com a Curadoria?</span>
                  <span className="text-[11px] text-ivory/60">Nossa equipe atende candidatas com prioridade e discrição.</span>
                </div>
                <Link
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '5521951011616'}?text=Olá,%20sou%20a%20candidata%20${encodeURIComponent(userData?.name || 'Criadora')}%20(ID:%20${userData?.id || 'VIP'})%20e%20gostaria%20de%20informações%20sobre%20minha%20reunião%20de%20curadoria.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-[#25D366] text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Suporte Curadoria</span>
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
