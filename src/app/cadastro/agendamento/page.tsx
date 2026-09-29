'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Lock,
  ArrowRight,
  Phone,
  User,
  Mail,
  Award,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/Button';
import { CurationScheduler } from '@/components/ui/CurationScheduler';
import { CurationAppointment } from '@/types';

function AgendamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Candidata recuperada do cadastro sem retrabalho
  const [candidateInfo, setCandidateInfo] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    planId: 'radiance',
    billingInterval: 'yearly',
  });

  const [appointment, setAppointment] = useState<CurationAppointment>({
    date: '',
    timeSlot: '',
    status: 'scheduled',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // 1. Tenta carregar da sessão atual logada
    async function loadUserData() {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCandidateInfo({
              fullName: data.user.name || '',
              email: data.user.email || '',
              whatsapp: data.user.whatsapp || data.user.phone || '',
              planId: data.user.planId || searchParams.get('plan') || 'radiance',
              billingInterval: data.user.planBillingInterval || searchParams.get('billing') || 'yearly',
            });
            if (data.user.interviewDate && data.user.interviewTime) {
              setAppointment({
                date: data.user.interviewDate,
                timeSlot: data.user.interviewTime,
                status: 'scheduled',
              });
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar dados da sessão:', e);
      }

      // 2. Fallback: Recupera do draft de cadastro em sessionStorage
      try {
        const draft = sessionStorage.getItem('lumiardi_qualificacao_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          setCandidateInfo({
            fullName: parsed.basicData?.fullName || '',
            email: parsed.basicData?.email || '',
            whatsapp: parsed.basicData?.whatsapp || '',
            planId: searchParams.get('plan') || 'radiance',
            billingInterval: searchParams.get('billing') || 'yearly',
          });
        }
      } catch {
        // Ignora
      }

      // 3. Fallback: Query params
      const qName = searchParams.get('name');
      const qEmail = searchParams.get('email');
      const qWhatsapp = searchParams.get('whatsapp');
      const qPlan = searchParams.get('plan');
      const qBilling = searchParams.get('billing');

      if (qName || qEmail || qWhatsapp || qPlan) {
        setCandidateInfo((prev) => ({
          fullName: qName || prev.fullName || 'Candidata',
          email: qEmail || prev.email || '',
          whatsapp: qWhatsapp || prev.whatsapp || '',
          planId: qPlan || prev.planId || 'radiance',
          billingInterval: qBilling || prev.billingInterval || 'yearly',
        }));
      }

      setLoading(false);
    }

    loadUserData();
  }, [searchParams]);

  const handleConfirmSchedule = async () => {
    setErrorMessage(null);

    if (!appointment.date || !appointment.timeSlot) {
      setErrorMessage('Por favor, selecione uma data e horário comercial para sua entrevista de alinhamento.');
      return;
    }

    if (!candidateInfo.whatsapp.trim()) {
      setErrorMessage('O WhatsApp de contato é obrigatório para que a Mesa de Curadoria envie o link do Google Meet.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/curation/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          whatsapp: candidateInfo.whatsapp,
          planId: candidateInfo.planId,
          billingInterval: candidateInfo.billingInterval,
          fullName: candidateInfo.fullName,
          email: candidateInfo.email,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao confirmar o agendamento.');
      }

      setIsSuccess(true);
      window.scrollTo({ top: 150, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao agendar reunião';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const displayDate = appointment.date ? appointment.date.split('-').reverse().join('/') : '';

  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#0B0B0B]">
      <Header />

      <section className="pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
        {isSuccess ? (
          /* ═══════════════════════════════════════════════════════════════
             TELA DE SUCESSO DO AGENDAMENTO DE CURADORIA PRÉVIA
          ═══════════════════════════════════════════════════════════════ */
          <div className="p-8 md:p-14 bg-gradient-to-b from-[#14120C] via-[#0D0D0F] to-[#070708] border-2 border-[#D4AF37] rounded-xl text-center space-y-8 shadow-2xl animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F5D77F] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#D4AF37]/10">
              <CalendarCheck className="w-10 h-10 stroke-[1.5]" />
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                MESA DE CURADORIA LUMIARDI
              </span>
              <h2 className="font-serif-lumiardi text-3xl md:text-5xl font-light text-ivory leading-tight">
                Entrevista Prévia Agendada
              </h2>
              <p className="text-xs md:text-sm text-ivory/70 max-w-xl mx-auto font-light leading-relaxed">
                Seu agendamento para a reunião de alinhamento e curadoria foi registrado com sucesso em nossos servidores seguros.
              </p>
            </div>

            {/* Card Nobre com os Dados */}
            <div className="p-6 bg-black/50 border border-[#D4AF37]/40 rounded-lg max-w-md mx-auto text-left space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[11px] uppercase tracking-wider text-ivory/50">Candidata</span>
                <span className="font-serif-lumiardi text-base text-ivory font-medium truncate max-w-[200px]">
                  {candidateInfo.fullName || 'Candidata Registrada'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[11px] uppercase tracking-wider text-ivory/50">WhatsApp de Contato</span>
                <span className="text-xs font-mono text-emerald-400 font-bold truncate max-w-[200px]">
                  {candidateInfo.whatsapp}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[11px] uppercase tracking-wider text-ivory/50">Data da Entrevista</span>
                <span className="text-xs font-mono text-[#F5D77F] font-semibold">
                  {displayDate}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[11px] uppercase tracking-wider text-ivory/50">Horário Marcado</span>
                <span className="text-xs font-mono text-[#F5D77F] font-semibold">
                  {appointment.timeSlot} (Horário de Brasília)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-ivory/50">Plano Pretendido</span>
                <span className="text-xs font-mono uppercase tracking-wider text-gold font-bold">
                  {candidateInfo.planId.toUpperCase()} ({candidateInfo.billingInterval === 'yearly' ? 'Anual' : 'Mensal'})
                </span>
              </div>
            </div>

            {/* Aviso de Procedimento */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/40 rounded-lg text-left text-xs text-amber-200/90 max-w-md mx-auto space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-[#F5D77F] uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Instruções da Mesa de Curadoria</span>
              </div>
              <p>
                No horário marcado, nossa equipe entrará em contato via WhatsApp e enviará o link da sala confidencial do Google Meet.
              </p>
              <p className="text-[10px] text-amber-300/80 pt-1 border-t border-amber-500/20">
                A liberação do pagamento e o acesso ao ecossistema Lumiardi ocorrerão exclusivamente após a conclusão desta reunião.
              </p>
            </div>

            <div className="pt-4 max-w-md mx-auto">
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard/pendente')}
                className="w-full py-4 px-6 text-xs uppercase tracking-[0.2em] font-bold bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#AA820A] text-[#0B0B0B] hover:brightness-110 shadow-xl cursor-pointer rounded-sm"
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                <span>Acompanhar Meu Status no Portal →</span>
              </Button>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             FORMULÁRIO DE SELEÇÃO DE DATA E HORÁRIO (DARK MATTE LUMIARDI)
          ═══════════════════════════════════════════════════════════════ */
          <div className="p-6 md:p-12 bg-gradient-to-b from-[#11100C] via-[#0D0D0F] to-[#070708] border border-[#D4AF37]/40 shadow-2xl rounded-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="border-b border-[#24221C] pb-6 space-y-2">
              <span className="px-3 py-1 text-[10px] font-sans uppercase tracking-[0.25em] font-semibold border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
                ETAPA OBRIGATÓRIA DE ENTRADA
              </span>
              <h1 className="font-serif-lumiardi text-2xl md:text-4xl text-ivory font-light pt-2">
                Agendamento de Curadoria Prévia
              </h1>
              <p className="text-xs md:text-sm text-ivory/60 font-light max-w-2xl leading-relaxed">
                Selecione abaixo a melhor data e horário comercial para a sua reunião de alinhamento com a Mesa de Curadoria Lumiardi.
              </p>
            </div>

            {/* Alerta de Erro */}
            {errorMessage && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-sans flex items-center gap-2.5 rounded-sm animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Zero Retrabalho: Resumo dos Dados já Cadastrados */}
            <div className="p-4 bg-black/40 border border-white/10 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-ivory/40 uppercase block">Candidata</span>
                  <span className="font-medium text-ivory truncate block">
                    {candidateInfo.fullName || 'Recuperando do cadastro...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-ivory/40 uppercase block">E-mail</span>
                  <span className="font-mono text-ivory/80 truncate block">
                    {candidateInfo.email || '-'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-ivory/40 uppercase block">WhatsApp (Meet)</span>
                  <span className="font-mono text-emerald-400 font-bold truncate block">
                    {candidateInfo.whatsapp || 'Informe abaixo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Seletor Visual de Data e Horários */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-serif-lumiardi text-[#D4AF37] uppercase tracking-wider">
                <CalendarIcon className="w-4 h-4" />
                <span>Selecione a Data e Intervalo de Horário</span>
              </div>

              <CurationScheduler
                userType="criadora"
                selectedAppointment={appointment}
                onScheduleChange={(appt) => setAppointment(appt)}
              />
            </div>

            {/* Confirmação do WhatsApp */}
            <div className="p-4 bg-[#14120C] border border-[#D4AF37]/30 rounded-lg space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory/90">
                Confirmar Celular / WhatsApp com DDD
              </label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={candidateInfo.whatsapp}
                onChange={(e) => setCandidateInfo({ ...candidateInfo, whatsapp: e.target.value })}
                className="w-full px-4 py-3 bg-black/60 border border-white/20 focus:border-[#D4AF37] text-xs font-mono text-emerald-400 rounded-xs focus:outline-none"
              />
              <span className="text-[10px] text-ivory/50 block">
                O convite do Google Meet será enviado para este número no dia e hora marcados.
              </span>
            </div>

            {/* Botão de Finalização */}
            <div className="pt-4 border-t border-[#24221C] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-ivory/50">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Agendamento criptografado sob protocolo de sigilo Lumiardi</span>
              </div>

              <button
                type="button"
                disabled={submitting || !appointment.date || !appointment.timeSlot}
                onClick={handleConfirmSchedule}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#AA820A] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
              >
                <span>{submitting ? 'Gravando Agendamento...' : 'Confirmar Entrevista de Curadoria →'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

export default function AgendamentoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707] text-[#D4AF37] flex items-center justify-center font-mono text-xs">Carregando agendador...</div>}>
      <AgendamentoContent />
    </Suspense>
  );
}
