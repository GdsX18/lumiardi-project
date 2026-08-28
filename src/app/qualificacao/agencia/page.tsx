'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DocumentUploadField } from '@/components/ui/DocumentUploadField';
import { CurationScheduler } from '@/components/ui/CurationScheduler';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  CalendarCheck,
  Camera,
  Target,
  ScanFace,
  CheckCircle2,
  Check,
  KeyRound,
  Percent,
} from 'lucide-react';
import { KYCVerificationModal } from '@/components/dashboard/KYCVerificationModal';
import { TwoFactorModal } from '@/components/dashboard/TwoFactorModal';
import { useLanguage } from '@/context/LanguageContext';
import {
  CompleteAgencyProfile,
  DocumentUploadData,
  CurationAppointment,
} from '@/types';

const COMMISSION_PRESETS = [
  '10%',
  '20%',
  '30%',
  '40%',
  '50%',
  '60%',
  '70%',
  '80%',
  'Outro a definir',
];

function AgenciaQualificacaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'select';
  const selectedBilling = searchParams.get('billing') || 'yearly';
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isKYCVerified, setIsKYCVerified] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  // ─── ETAPA 1: Cadastro Inicial & Documento ───────────────────────
  const [basicData, setBasicData] = useState({
    responsibleName: '',
    taxId: '', // CPF ou CNPJ
    corporateEmail: '',
    password: '',
    document: null as any,
  });

  // ─── ETAPA 2: Sobre a Agência (Pré-Entrevista) ───────────────────
  const [qualitativeData, setQualitativeData] = useState({
    aboutUs: '',
    mission: '',
    values: '',
    lookingFor: '',
    commissionPercentage: '30%',
    commissionCustom: '',
    instagram: '',
    country: 'Brasil',
    city: 'São Paulo',
  });

  // ─── ETAPA 3: Agendamento ────────────────────────────────────────
  const [appointment, setAppointment] = useState<CurationAppointment>({
    date: '',
    timeSlot: '15:00',
    status: 'scheduled',
    notes: 'Agendamento de Curadoria Corporativa - Agência',
  });

  // ─── Validação da Etapa 1 ────────────────────────────────────────
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!basicData.responsibleName.trim() || !basicData.taxId.trim() || !basicData.corporateEmail.trim() || !basicData.password.trim()) {
      setSubmissionError(t('err_fill_all_required'));
      return;
    }

    if (!basicData.document) {
      setSubmissionError(t('err_upload_cnpj_required'));
      return;
    }

    if (!isKYCVerified) {
      setSubmissionError('A validação biométrica do responsável legal da agência é obrigatória para cadastro.');
      return;
    }

    if (!is2FAVerified) {
      setSubmissionError('A ativação da Blindagem 2FA (Google Authenticator) é obrigatória para proteger a conta corporativa.');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // ─── Validação da Etapa 2 ────────────────────────────────────────
  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!qualitativeData.aboutUs.trim() || !qualitativeData.mission.trim() || !qualitativeData.values.trim() || !qualitativeData.lookingFor.trim()) {
      setSubmissionError(t('err_fill_all_required'));
      return;
    }

    // Validação estrita do Instagram
    let insta = qualitativeData.instagram.trim();
    if (!insta) {
      setSubmissionError(t('err_agency_insta_required'));
      return;
    }
    if (!insta.startsWith('@')) {
      insta = `@${insta}`;
      setQualitativeData((prev) => ({ ...prev, instagram: insta }));
    }

    if (!qualitativeData.country.trim() || !qualitativeData.city.trim()) {
      setSubmissionError(t('err_inform_city'));
      return;
    }

    setCurrentStep(3);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // ─── Submissão Final e Agendamento ──────────────────────────────
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const fullProfile: Partial<CompleteAgencyProfile> = {
        basicInfo: {
          responsibleName: basicData.responsibleName,
          taxId: basicData.taxId,
          corporateEmail: basicData.corporateEmail,
          document: basicData.document!,
          createdAt: new Date().toISOString(),
        },
        qualitative: {
          ...qualitativeData,
          instagram: qualitativeData.instagram.startsWith('@') ? qualitativeData.instagram : `@${qualitativeData.instagram}`,
        },
        appointment: appointment.date ? appointment : {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          timeSlot: '15:00',
          status: 'scheduled',
        },
        curationStatus: 'submitted',
      };

      const res = await fetch('/api/agencies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullProfile),
      });

      if (!res.ok) {
        throw new Error(t('err_submission_failed'));
      }

      setSubmitted(true);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('err_submission_failed');
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-ivory font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      {/* Barra de progresso de etapas no topo */}
      <div className="fixed top-0 left-0 right-0 z-40 h-[3px] bg-white/10 mt-16">
        <div
          className="h-full bg-gradient-to-r from-[#8C6B2F] via-[#C9A96B] to-[#D4B87A] transition-all duration-700"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>

      {/* Hero da Página de Cadastro de Agência */}
      <section className="pt-28 pb-10 sm:pt-36 sm:pb-16 bg-[#0B0B0B] border-b border-[#C9A96B]/25 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A96B]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 space-y-4 sm:space-y-6 relative z-10">
          <Badge variant="gold">{t('qual_agency_hero_badge')}</Badge>

          <h1 className="font-serif-lumiardi text-3xl sm:text-5xl md:text-6xl font-light text-ivory tracking-tight leading-tight">
            {t('qual_agency_hero_title')}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-ivory/70 font-sans max-w-2xl mx-auto font-light leading-relaxed">
            {t('qual_agency_hero_desc')}
          </p>

          {/* Stepper Visual */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-4 sm:pt-6 text-[10px] sm:text-xs uppercase tracking-wider font-sans">
            <div className={`flex items-center gap-1.5 sm:gap-2 ${currentStep >= 1 ? 'text-[#C9A96B]' : 'text-ivory/40'}`}>
              <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs border ${currentStep >= 1 ? 'border-[#C9A96B] bg-[#C9A96B]/20 font-semibold' : 'border-white/20'}`}>1</span>
              <span>{t('qual_agency_step1_badge')}</span>
            </div>
            <span className="text-ivory/30">&mdash;</span>
            <div className={`flex items-center gap-1.5 sm:gap-2 ${currentStep >= 2 ? 'text-[#C9A96B]' : 'text-ivory/40'}`}>
              <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs border ${currentStep >= 2 ? 'border-[#C9A96B] bg-[#C9A96B]/20 font-semibold' : 'border-white/20'}`}>2</span>
              <span>{t('qual_agency_step2_badge')}</span>
            </div>
            <span className="text-ivory/30">&mdash;</span>
            <div className={`flex items-center gap-1.5 sm:gap-2 ${currentStep >= 3 ? 'text-[#C9A96B]' : 'text-ivory/40'}`}>
              <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs border ${currentStep >= 3 ? 'border-[#C9A96B] bg-[#C9A96B]/20 font-semibold' : 'border-white/20'}`}>3</span>
              <span>{t('qual_agency_step3_badge')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form Container */}
      <section className="py-8 sm:py-16 md:py-20 bg-[#F7F3EC] text-[#0B0B0B]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {submitted ? (
            /* ═══════════════════════════════════════════════════════════════
               TELA DE SUCESSO & CONFIRMAÇÃO DE AGENDAMENTO DA AGÊNCIA
            ═══════════════════════════════════════════════════════════════ */
            <div className="bg-white border-2 border-[#C9A96B] p-5 sm:p-8 md:p-14 text-center space-y-6 sm:space-y-8 shadow-2xl animate-in fade-in duration-500">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full flex items-center justify-center mx-auto border border-[#C9A96B]">
                <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C6B2F] font-sans font-semibold">
                  {t('qual_success_badge')}
                </span>
                <h2 className="font-serif-lumiardi text-2xl sm:text-3xl md:text-5xl font-light text-[#0B0B0B] leading-tight">
                  {t('qual_success_title')}
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-[#0B0B0B]/75 font-sans leading-relaxed max-w-xl mx-auto font-light">
                  {t('qual_success_desc')}
                </p>
              </div>

              {/* Card Resumo do Agendamento */}
              <div className="bg-[#FAF7F2] border border-[#C9A96B]/40 p-4 sm:p-6 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-2.5">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_summary_responsible_label')}</span>
                  <span className="font-serif-lumiardi text-base sm:text-lg font-medium text-[#0B0B0B] truncate max-w-[200px]">{basicData.responsibleName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-2.5">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_agency_taxid_label')}</span>
                  <span className="text-xs font-mono text-[#0B0B0B] font-semibold">{basicData.taxId}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-2.5">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_summary_date_label')}</span>
                  <span className="text-xs font-sans text-[#0B0B0B] font-medium">{appointment.date ? appointment.date.split('-').reverse().join('/') : t('qual_summary_tbd')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_summary_time_label')}</span>
                  <span className="text-xs font-sans text-[#0B0B0B] font-medium">{appointment.timeSlot} {t('qual_summary_tz')}</span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-[11px] sm:text-xs text-emerald-800 font-sans flex items-center justify-center gap-2 max-w-md mx-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{t('qual_success_email_note')} <strong className="break-all">{basicData.corporateEmail}</strong></span>
              </div>

              <div className="pt-4 sm:pt-6 border-t border-[#0B0B0B]/10 flex flex-col gap-3 justify-center max-w-md mx-auto">
                <Button
                  variant="primary"
                  onClick={() => router.push(`/checkout?plan=${selectedPlan}&category=agencias&billing=${selectedBilling}`)}
                  className="w-full py-3.5 sm:py-4 px-4 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-2 bg-[#0B0B0B] hover:bg-[#8C6B2F] text-ivory shadow-xl leading-normal text-center"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C9A96B] shrink-0" />
                  <span>Prosseguir para Pagamento do Plano ({selectedPlan.toUpperCase()}) →</span>
                </Button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/pendente')}
                  className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/60 hover:text-[#8C6B2F] py-2 transition-colors cursor-pointer text-center"
                >
                  Ver Status da Minha Curadoria
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#0B0B0B]/10 p-4 sm:p-8 md:p-12 shadow-2xl space-y-8 sm:space-y-10">
              
              {/* Alerta de Erro de Validação */}
              {submissionError && (
                <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-sans flex items-center gap-2.5 animate-in fade-in duration-300">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  ETAPA 1: CADASTRO INICIAL DA AGÊNCIA
              ═══════════════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <form onSubmit={handleNextStep1} className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">
                      {t('qual_step1_badge')}
                    </span>
                    <h2 className="font-serif-lumiardi text-2xl sm:text-3xl font-light text-[#0B0B0B] mt-1">
                      {t('qual_agency_title1')}
                    </h2>
                    <p className="text-xs text-[#0B0B0B]/60 font-sans mt-1">
                      {t('qual_agency_desc1')}
                    </p>
                  </div>

                  <div className="space-y-6 text-xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_resp_name')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('qual_agency_resp_placeholder')}
                          value={basicData.responsibleName}
                          onChange={(e) => setBasicData({ ...basicData, responsibleName: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_taxid_label')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('qual_agency_taxid_placeholder')}
                          value={basicData.taxId}
                          onChange={(e) => setBasicData({ ...basicData, taxId: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_email_label')}
                        </label>
                        <input
                          type="email"
                          required
                          placeholder={t('qual_agency_email_placeholder')}
                          value={basicData.corporateEmail}
                          onChange={(e) => setBasicData({ ...basicData, corporateEmail: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_pass_label')}
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          value={basicData.password}
                          onChange={(e) => setBasicData({ ...basicData, password: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>

                    {/* Prova de Vida 3D Facial do Responsável Legal & Validação de Documento Oficial (+18) */}
                    <div className="pt-4 border-t border-[#0B0B0B]/10">
                      <div className="p-4 sm:p-5 bg-[#FAF7F2] border-2 border-[#C9A96B]/60 rounded-xs space-y-3 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[#8C6B2F]">
                            <ScanFace className="w-5 h-5 shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wider font-sans">
                              Documento Oficial do Responsável Legal & Biometria 3D
                            </span>
                          </div>

                          {isKYCVerified ? (
                            <span className="w-fit inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 font-bold border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Documento & Biometria Homologados</span>
                            </span>
                          ) : (
                            <span className="w-fit text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 font-semibold">
                              Pendente de Validação
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#0B0B0B]/70 font-sans leading-relaxed">
                          Conformidade institucional com os padrões de prevenção a fraudes (KYB/KYC) e legislação <strong>18 U.S.C. § 2257</strong>. Anexe a foto do documento oficial do diretor responsável e realize a biometria 3D na câmera.
                        </p>

                        {basicData.document && (
                          <div className="p-2.5 bg-white border border-[#C9A96B]/40 text-xs font-sans text-[#0B0B0B]/80 flex items-center justify-between">
                            <span className="truncate max-w-[200px] sm:max-w-xs"><strong>Arquivo:</strong> {basicData.document.fileName}</span>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase shrink-0">Anexado</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsKYCModalOpen(true)}
                          className={`w-full py-3.5 px-3 text-xs font-sans uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all text-center leading-tight ${
                            isKYCVerified
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'bg-[#0B0B0B] hover:bg-[#8C6B2F] text-ivory shadow-md'
                          }`}
                        >
                          <ScanFace className="w-4 h-4 shrink-0" />
                          <span>{isKYCVerified ? 'Refazer Leitura do Documento & Biometria' : 'Anexar Documento & Iniciar Biometria 3D →'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Blindagem 2FA (Google Authenticator) Obrigatória para Agência */}
                    <div className="p-4 sm:p-5 bg-[#FAF7F2] border-2 border-[#C9A96B]/50 rounded-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[#8C6B2F]">
                          <KeyRound className="w-5 h-5 shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider font-sans">
                            Blindagem 2FA Corporativa Obrigatória
                          </span>
                        </div>

                        {is2FAVerified ? (
                          <span className="w-fit inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 font-bold border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>2FA Ativado</span>
                          </span>
                        ) : (
                          <span className="w-fit text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 font-semibold">
                            Pendente de Configuração
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#0B0B0B]/70 font-sans leading-relaxed">
                        Para proteção das faturas corporativas, contratos com criadoras e repasses em escrow, ative a autenticação em dois fatores no <strong>Google Authenticator</strong> ou <strong>Authy</strong>.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIs2FAModalOpen(true)}
                        className={`w-full py-3.5 px-3 text-xs font-sans uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all text-center leading-tight ${
                          is2FAVerified
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'bg-[#0B0B0B] hover:bg-[#8C6B2F] text-ivory'
                        }`}
                      >
                        <KeyRound className="w-4 h-4 shrink-0" />
                        <span>{is2FAVerified ? '2FA Concluído com Sucesso' : 'Escanear QR Code & Ativar 2FA Corporativo →'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col sm:flex-row justify-end">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-4 bg-[#0B0B0B] text-ivory text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#8C6B2F] transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-lg text-center"
                    >
                      <span>{t('qual_agency_btn_next2')}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  ETAPA 2: SOBRE A AGÊNCIA (PRÉ-ENTREVISTA)
              ═══════════════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <form onSubmit={handleNextStep2} className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">
                      {t('qual_step2_badge')}
                    </span>
                    <h2 className="font-serif-lumiardi text-2xl sm:text-3xl font-light text-[#0B0B0B] mt-1">
                      {t('qual_agency_title2')}
                    </h2>
                    <p className="text-xs text-[#0B0B0B]/60 font-sans mt-1">
                      {t('qual_agency_desc2')}
                    </p>
                  </div>

                  <div className="space-y-6 text-xs font-sans">
                    {/* Sobre Nós */}
                    <div>
                      <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                        {t('qual_agency_about_label')}
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder={t('qual_agency_about_placeholder')}
                        value={qualitativeData.aboutUs}
                        onChange={(e) => setQualitativeData({ ...qualitativeData, aboutUs: e.target.value })}
                        className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                      />
                    </div>

                    {/* Missão e Valores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_mission_label')}
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder={t('qual_agency_mission_placeholder')}
                          value={qualitativeData.mission}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, mission: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_values_label')}
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder={t('qual_agency_values_placeholder')}
                          value={qualitativeData.values}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, values: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>

                    {/* O que estamos buscando */}
                    <div>
                      <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#8C6B2F]" />
                        <span>{t('qual_agency_lookingfor_label')}</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder={t('qual_agency_lookingfor_placeholder')}
                        value={qualitativeData.lookingFor}
                        onChange={(e) => setQualitativeData({ ...qualitativeData, lookingFor: e.target.value })}
                        className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                      />
                    </div>

                    {/* Porcentagem */}
                    <div className="space-y-3 pt-2">
                      <label className="block text-[#0B0B0B]/80 font-medium uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-[#8C6B2F]" />
                        <span>{t('qual_agency_commission_label')}</span>
                      </label>

                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
                        {COMMISSION_PRESETS.map((pct) => {
                          const isSelected = qualitativeData.commissionPercentage === pct;
                          const label = pct === 'Outro a definir' ? t('qual_agency_commission_other') : pct;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setQualitativeData({ ...qualitativeData, commissionPercentage: pct })}
                              className={`py-2.5 sm:py-3 px-2 sm:px-3 text-xs font-sans uppercase tracking-wider border transition-all duration-200 cursor-pointer text-center ${
                                isSelected
                                  ? 'bg-[#0B0B0B] text-[#C9A96B] border-[#C9A96B] font-bold shadow-md'
                                  : 'bg-[#FAF7F2] text-[#0B0B0B]/80 border-[#0B0B0B]/15 hover:border-[#C9A96B] hover:bg-white'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {qualitativeData.commissionPercentage === 'Outro a definir' && (
                        <div className="pt-2">
                          <label className="block text-[#0B0B0B]/70 mb-1">{t('qual_agency_commission_custom_label')}</label>
                          <input
                            type="text"
                            placeholder={t('qual_agency_commission_custom_placeholder')}
                            value={qualitativeData.commissionCustom}
                            onChange={(e) => setQualitativeData({ ...qualitativeData, commissionCustom: e.target.value })}
                            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Instagram da Agência & Localização */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-[#8C6B2F]" />
                          <span>{t('qual_agency_insta_label')}</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="@agenciaoficial"
                          value={qualitativeData.instagram}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith('@')) val = `@${val}`;
                            setQualitativeData({ ...qualitativeData, instagram: val });
                          }}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B] font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_country_label')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('qual_agency_country_placeholder')}
                          value={qualitativeData.country}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, country: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_agency_city_label')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('qual_agency_city_placeholder')}
                          value={qualitativeData.city}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, city: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 border border-[#0B0B0B]/20 text-xs uppercase tracking-[0.2em] font-medium hover:border-[#0B0B0B] transition-colors cursor-pointer text-center"
                    >
                      {t('qual_btn_back_step1')}
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-4 bg-[#0B0B0B] text-ivory text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#8C6B2F] transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-lg text-center"
                    >
                      <span>{t('qual_agency_btn_next3')}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  ETAPA 3: AGENDAMENTO COM A CURADORIA
              ═══════════════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">
                      {t('qual_step3_badge')}
                    </span>
                    <h2 className="font-serif-lumiardi text-2xl sm:text-3xl font-light text-[#0B0B0B] mt-1">
                      {t('qual_agency_title3')}
                    </h2>
                    <p className="text-xs text-[#0B0B0B]/60 font-sans mt-1">
                      {t('qual_agency_desc3')}
                    </p>
                  </div>

                  <CurationScheduler
                    userType="agencia"
                    selectedAppointment={appointment}
                    onScheduleChange={(appt) => setAppointment(appt)}
                  />

                  <div className="p-4 bg-[#FAF7F2] border border-[#0B0B0B]/10 text-xs text-[#0B0B0B]/75 font-sans space-y-2">
                    <div className="flex items-center gap-2 text-[#8C6B2F] font-semibold uppercase tracking-wider">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>{t('qual_agency_privacy_title')}</span>
                    </div>
                    <p className="leading-relaxed">
                      {t('qual_agency_privacy_desc')}
                    </p>
                  </div>

                  <div className="pt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 border border-[#0B0B0B]/20 text-xs uppercase tracking-[0.2em] font-medium hover:border-[#0B0B0B] transition-colors cursor-pointer text-center"
                    >
                      {t('qual_agency_btn_back')}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSubmit}
                      className="w-full sm:w-auto px-10 py-4 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] font-semibold hover:bg-[#D4B87A] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl disabled:opacity-50 text-center"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{isSubmitting ? t('qual_agency_btn_submitting') : t('qual_agency_btn_submit')}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </section>

      {/* Modal de Verificação Biométrica KYC integrado no Cadastro */}
      <KYCVerificationModal
        isOpen={isKYCModalOpen}
        onClose={() => setIsKYCModalOpen(false)}
        onDocumentUpload={(doc) => {
          setBasicData((prev) => ({ ...prev, document: doc }));
        }}
        onSuccess={() => {
          setIsKYCVerified(true);
          setIsKYCModalOpen(false);
        }}
      />

      {/* Modal de Blindagem 2FA TOTP integrado no Cadastro */}
      <TwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onSuccess={() => {
          setIs2FAVerified(true);
        }}
      />

      <Footer />
    </main>
  );
}

export default function AgenciaQualificacaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-[#C9A96B] font-serif-lumiardi text-xl">Carregando formulário de agência...</div>}>
      <AgenciaQualificacaoContent />
    </Suspense>
  );
}
