'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { QualificationSteps } from '@/components/sections/QualificationSteps';
import { DocumentUploadField } from '@/components/ui/DocumentUploadField';
import { LocationSelector } from '@/components/ui/LocationSelector';
import { CurationScheduler } from '@/components/ui/CurationScheduler';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  CalendarCheck,
  User,
  Ruler,
  Eye,
  Camera,
  ScanFace,
  CheckCircle2,
  Check,
  KeyRound,
} from 'lucide-react';
import { KYCVerificationModal } from '@/components/dashboard/KYCVerificationModal';
import { TwoFactorModal } from '@/components/dashboard/TwoFactorModal';
import { useLanguage } from '@/context/LanguageContext';
import {
  CreatorCategory,
  GenderIdentity,
  AvailabilityPeriod,
  CompleteCreatorProfile,
  DocumentUploadData,
  CurationAppointment,
} from '@/types';

const LANGUAGE_OPTIONS = [
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Italiano',
  'Alemão',
  'Russo',
  'Outro',
];

function QualificacaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'glow';
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

  // Gêneros com labels traduzidos
  const genderOptionsList: { value: GenderIdentity; label: string }[] = [
    { value: 'Feminino Cisgênero', label: t('gender_cis_fem') },
    { value: 'Feminino Transgênero', label: t('gender_trans_fem') },
    { value: 'Não-binário', label: t('gender_non_binary') },
    { value: 'Travesti', label: t('gender_travesti') },
    { value: 'Masculino Cisgênero', label: t('gender_cis_masc') },
    { value: 'Masculino Transgênero', label: t('gender_trans_masc') },
    { value: 'Agênero', label: t('gender_agender') },
    { value: 'Prefiro não informar', label: t('gender_prefer_not') },
    { value: 'Outro', label: t('gender_other') },
  ];

  // Disponibilidade com labels traduzidos
  const availabilityOptionsList: { value: AvailabilityPeriod; label: string }[] = [
    { value: 'Manhã', label: t('avail_morning') },
    { value: 'Tarde', label: t('avail_afternoon') },
    { value: 'Noite', label: t('avail_evening') },
    { value: 'Madrugada', label: t('avail_dawn') },
    { value: 'Total', label: t('avail_full') },
  ];

  // Categorias de atuação
  const categoryOptionsList: { value: CreatorCategory; label: string }[] = [
    { value: 'Criadora de conteúdo +18', label: t('qual_cat_content_18') },
    { value: 'Criadora e acompanhante', label: t('qual_cat_content_and_companion') },
    { value: 'Acompanhante', label: t('qual_cat_companion') },
    { value: 'Outro', label: t('qual_cat_other') },
  ];

  // Faturamentos
  const revenueOptionsList = [
    { value: 'Até R$ 10.000', label: t('qual_rev_upto_10k') },
    { value: 'R$ 10.000 a R$ 30.000', label: t('qual_rev_10k_30k') },
    { value: 'R$ 30.000 a R$ 80.000', label: t('qual_rev_30k_80k') },
    { value: 'R$ 80.000 a R$ 150.000', label: t('qual_rev_80k_150k') },
    { value: 'Acima de R$ 150.000', label: t('qual_rev_above_150k') },
  ];

  // Conversões
  const conversionOptionsList = [
    { value: 'Abaixo de 2%', label: t('qual_conv_low') },
    { value: '2% a 5%', label: t('qual_conv_mid_low') },
    { value: '5% a 10%', label: t('qual_conv_mid') },
    { value: '10% a 20%', label: t('qual_conv_mid_high') },
    { value: 'Acima de 20%', label: t('qual_conv_high') },
    { value: 'Não sei estimar / Iniciando agora', label: t('qual_conv_dont_know') },
  ];

  // Cores de Cabelo
  const hairColorsList = [
    { value: 'Loiro', label: t('hair_blonde') },
    { value: 'Castanho Escuro', label: t('hair_dark_brown') },
    { value: 'Castanho Claro', label: t('hair_light_brown') },
    { value: 'Preto', label: t('hair_black') },
    { value: 'Ruivo', label: t('hair_red') },
    { value: 'Grisalho', label: t('hair_gray') },
    { value: 'Colorido', label: t('hair_colored') },
    { value: 'Outro', label: t('hair_other') },
  ];

  // Cores dos Olhos
  const eyeColorsList = [
    { value: 'Castanhos', label: t('eye_brown') },
    { value: 'Pretos', label: t('eye_black') },
    { value: 'Azuis', label: t('eye_blue') },
    { value: 'Verdes', label: t('eye_green') },
    { value: 'Mel', label: t('eye_hazel') },
    { value: 'Outro', label: t('eye_other') },
  ];

  // Tons de Pele
  const skinTonesList = [
    { value: 'Clara', label: t('skin_fair') },
    { value: 'Média', label: t('skin_medium') },
    { value: 'Morena', label: t('skin_tan') },
    { value: 'Negra', label: t('skin_dark') },
    { value: 'Outro', label: t('skin_other') },
  ];

  // ─── ETAPA 1: Cadastro Inicial & Documento ───────────────────────
  const [basicData, setBasicData] = useState({
    fullName: '',
    cpf: '',
    birthDate: '',
    email: '',
    password: '',
    address: {
      country: 'Brasil',
      state: 'SP',
      city: '',
    },
    document: null as any,
  });

  // ─── ETAPA 2: Dados Qualitativos & Medidas ────────────────────────
  const [qualitativeData, setQualitativeData] = useState({
    artisticName: '',
    category: 'Criadora de conteúdo +18' as CreatorCategory,
    categoryOtherExplanation: '',
    gender: 'Feminino Cisgênero' as GenderIdentity,
    genderOther: '',
    hobbies: '',
    platforms: {
      instagram: '',
      privacy: '',
      onlyfans: '',
      fatalModels: '',
      fatalFans: '',
      twitter: '',
      other: '',
    },
    monthlyRevenueEstimate: 'R$ 10.000 a R$ 30.000',
    conversionRateEstimate: '5% a 10%',
    availability: ['Tarde', 'Noite'] as AvailabilityPeriod[],
    hasChildren: false,
    childrenCount: 1,
    languages: ['Português'],
    exposureOpinion: '', // Max 50 chars
    personalLimits: '',
    mainGoal: '',        // Max 50 chars
    measurements: {
      height: '',
      weight: '',
      waist: '',
      bust: '',
      hips: '',
    },
    physiognomy: {
      hairColor: 'Castanho Claro',
      eyeColor: 'Castanhos',
      skinTone: 'Clara',
    },
  });

  // ─── ETAPA 3: Agendamento de Curadoria ───────────────────────────
  const [appointment, setAppointment] = useState<CurationAppointment>({
    date: '',
    timeSlot: '15:00',
    status: 'scheduled',
    notes: 'Agendamento de Curadoria Criadora',
  });

  // ─── Validação e Avanço da Etapa 1 ──────────────────────────────
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!basicData.fullName.trim() || !basicData.email.trim() || !basicData.cpf.trim() || !basicData.password.trim()) {
      setSubmissionError(t('err_fill_all_required'));
      return;
    }

    if (!basicData.address.city.trim()) {
      setSubmissionError(t('err_inform_city'));
      return;
    }

    if (!basicData.document) {
      setSubmissionError(t('err_upload_doc_required'));
      return;
    }

    if (!isKYCVerified) {
      setSubmissionError('A validação biométrica facial 3D e comprovação de maioridade (+18) é obrigatória para cadastro na Lumiardi.');
      return;
    }

    if (!is2FAVerified) {
      setSubmissionError('A ativação da Blindagem 2FA (Google Authenticator) é obrigatória para proteger sua conta.');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // ─── Validação e Avanço da Etapa 2 ──────────────────────────────
  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!qualitativeData.artisticName.trim()) {
      setSubmissionError(t('err_artistic_name_required'));
      return;
    }

    // Validação estrita do Instagram: deve conter @
    let insta = qualitativeData.platforms.instagram.trim();
    if (!insta) {
      setSubmissionError(t('err_insta_required'));
      return;
    }
    if (!insta.startsWith('@')) {
      insta = `@${insta}`;
      setQualitativeData((prev) => ({
        ...prev,
        platforms: { ...prev.platforms, instagram: insta },
      }));
    }

    if (qualitativeData.availability.length === 0) {
      setSubmissionError(t('err_availability_required'));
      return;
    }

    if (!qualitativeData.exposureOpinion.trim()) {
      setSubmissionError(t('err_exposure_required'));
      return;
    }

    if (!qualitativeData.mainGoal.trim()) {
      setSubmissionError(t('err_maingoal_required'));
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
      const fullProfile: Partial<CompleteCreatorProfile> = {
        basicInfo: {
          fullName: basicData.fullName,
          cpf: basicData.cpf,
          birthDate: basicData.birthDate,
          email: basicData.email,
          address: basicData.address,
          document: basicData.document!,
          createdAt: new Date().toISOString(),
        },
        qualitative: {
          ...qualitativeData,
          exposureOpinion: qualitativeData.exposureOpinion.slice(0, 50),
          mainGoal: qualitativeData.mainGoal.slice(0, 50),
        },
        appointment: appointment.date ? appointment : {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          timeSlot: '15:00',
          status: 'scheduled',
        },
        curationStatus: 'submitted',
      };

      const res = await fetch('/api/creators/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullProfile),
      });

      if (!res.ok) {
        throw new Error(t('err_submission_failed'));
      }

      setSubmitted(true);
      window.scrollTo({ top: 100, behavior: 'smooth' });

      // Redirecionamento automático imediato para o Checkout do Plano
      setTimeout(() => {
        router.push(`/checkout?plan=${selectedPlan}&category=criadoras&billing=${selectedBilling}`);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('err_submission_failed');
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle helper para disponibilidade
  const toggleAvailability = (period: AvailabilityPeriod) => {
    setQualitativeData((prev) => {
      const current = prev.availability;
      let updated: AvailabilityPeriod[];
      if (period === 'Total') {
        updated = current.includes('Total') ? [] : ['Total'];
      } else {
        const filtered = current.filter((p) => p !== 'Total');
        if (filtered.includes(period)) {
          updated = filtered.filter((p) => p !== period);
        } else {
          updated = [...filtered, period];
        }
      }
      return { ...prev, availability: updated };
    });
  };

  // Toggle helper para idiomas
  const toggleLanguage = (lang: string) => {
    setQualitativeData((prev) => {
      const current = prev.languages;
      let updated: string[];
      if (current.includes(lang)) {
        updated = current.length > 1 ? current.filter((l) => l !== lang) : current;
      } else {
        updated = [...current, lang];
      }
      return { ...prev, languages: updated };
    });
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

      {/* Hero da Página */}
      <section className="pt-36 pb-16 bg-[#0B0B0B] border-b border-[#C9A96B]/25 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9A96B]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center px-6 space-y-6 relative z-10">
          <Badge variant="gold">{t('qual_badge') || 'CANDIDATURA DE ELITE'}</Badge>
          
          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight">
            {t('qual_title') || 'A entrada começa com qualificação.'}
          </h1>

          <p className="text-base sm:text-lg text-ivory/70 font-sans max-w-2xl mx-auto font-light leading-relaxed">
            {t('qual_desc') || 'Processo exclusivo para criadoras que desejam gestão internacional, sigilo absoluto e conexões com agências de alta performance.'}
          </p>

          <QualificationSteps currentStep={currentStep} />
        </div>
      </section>

      {/* Container Principal do Formulário */}
      <section id="qual-form-section" className="py-20 bg-[#F7F3EC] text-[#0B0B0B]">
        <div className="max-w-4xl mx-auto px-6">
          {submitted ? (
            /* ═══════════════════════════════════════════════════════════════
               TELA DE SUCESSO & CONFIRMAÇÃO DE AGENDAMENTO
            ═══════════════════════════════════════════════════════════════ */
            <div className="bg-white border-2 border-[#C9A96B] p-10 md:p-14 text-center space-y-8 shadow-2xl animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full flex items-center justify-center mx-auto border border-[#C9A96B]">
                <CalendarCheck className="w-10 h-10 stroke-[1.5]" />
              </div>

              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C6B2F] font-sans font-semibold">
                  {t('qual_success_badge')}
                </span>
                <h2 className="font-serif-lumiardi text-3xl md:text-5xl font-light text-[#0B0B0B]">
                  {t('qual_success_title')}
                </h2>
                <p className="text-sm md:text-base text-[#0B0B0B]/75 font-sans leading-relaxed max-w-xl mx-auto font-light">
                  {t('qual_success_desc')}
                </p>
              </div>

              {/* Card Resumo do Agendamento */}
              <div className="bg-[#FAF7F2] border border-[#C9A96B]/40 p-6 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-3">
                  <span className="text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_summary_creator_label')}</span>
                  <span className="font-serif-lumiardi text-lg font-medium text-[#0B0B0B]">{qualitativeData.artisticName || basicData.fullName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-3">
                  <span className="text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_summary_insta_label')}</span>
                  <span className="text-xs font-sans text-[#8C6B2F] font-semibold">{qualitativeData.platforms.instagram}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-3">
                  <span className="text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_summary_date_label')}</span>
                  <span className="text-xs font-sans text-[#0B0B0B] font-medium">{appointment.date ? appointment.date.split('-').reverse().join('/') : t('qual_summary_tbd')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#0B0B0B]/60 font-sans">{t('qual_summary_time_label')}</span>
                  <span className="text-xs font-sans text-[#0B0B0B] font-medium">{appointment.timeSlot} {t('qual_summary_tz')}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-sans flex items-center justify-center gap-2 max-w-md mx-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{t('qual_success_email_note')} <strong>{basicData.email}</strong></span>
              </div>

              <div className="pt-6 border-t border-[#0B0B0B]/10 flex flex-col gap-3 justify-center max-w-md mx-auto">
                <Button
                  variant="primary"
                  onClick={() => router.push(`/checkout?plan=${selectedPlan}&category=criadoras&billing=${selectedBilling}`)}
                  className="w-full py-4 text-xs tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-2 bg-[#0B0B0B] hover:bg-[#8C6B2F] text-ivory shadow-xl"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C9A96B]" />
                  <span>Prosseguir para Pagamento do Plano ({selectedPlan.toUpperCase()}) →</span>
                </Button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/pendente')}
                  className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/60 hover:text-[#8C6B2F] py-2 transition-colors cursor-pointer"
                >
                  Ver Status da Minha Curadoria
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#0B0B0B]/10 p-8 md:p-12 shadow-2xl space-y-10">
              
              {/* Alerta de Erro de Validação */}
              {submissionError && (
                <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-sans flex items-center gap-2.5 animate-in fade-in duration-300">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  ETAPA 1: CADASTRO INICIAL & ENVIO DE DOCUMENTOS
              ═══════════════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <form onSubmit={handleNextStep1} className="space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">
                      {t('qual_step1_badge')}
                    </span>
                    <h2 className="font-serif-lumiardi text-3xl font-light text-[#0B0B0B] mt-1">
                      {t('qual_creator_title1')}
                    </h2>
                    <p className="text-xs text-[#0B0B0B]/60 font-sans mt-1">
                      {t('qual_creator_desc1')}
                    </p>
                  </div>

                  <div className="space-y-6 text-xs font-sans">
                    {/* Nome Completo e CPF */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_fullname_label')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('qual_fullname_placeholder')}
                          value={basicData.fullName}
                          onChange={(e) => setBasicData({ ...basicData, fullName: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_cpf_label')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('qual_cpf_placeholder')}
                          value={basicData.cpf}
                          onChange={(e) => setBasicData({ ...basicData, cpf: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>

                    {/* Data de Nascimento, E-mail e Senha */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_birthdate_label')}
                        </label>
                        <input
                          type="date"
                          required
                          value={basicData.birthDate}
                          onChange={(e) => setBasicData({ ...basicData, birthDate: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_email_label')}
                        </label>
                        <input
                          type="email"
                          required
                          placeholder={t('qual_email_placeholder')}
                          value={basicData.email}
                          onChange={(e) => setBasicData({ ...basicData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_password_label')}
                        </label>
                        <input
                          type="password"
                          required
                          placeholder={t('qual_password_placeholder')}
                          value={basicData.password}
                          onChange={(e) => setBasicData({ ...basicData, password: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>

                    {/* Dados Residenciais Hierárquicos */}
                    <div className="pt-2">
                      <span className="text-[11px] font-sans uppercase tracking-wider text-[#8C6B2F] font-semibold block mb-2">
                        {t('qual_residential_location')}
                      </span>
                      <LocationSelector
                        value={basicData.address}
                        onChange={(addr) => setBasicData({ ...basicData, address: addr })}
                      />
                    </div>

                    {/* Prova de Vida 3D Facial & Validação de Documento KYC +18 Obrigatório */}
                    <div className="pt-4 border-t border-[#0B0B0B]/10">
                      <div className="p-5 bg-[#FAF7F2] border-2 border-[#C9A96B]/60 rounded-xs space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#8C6B2F]">
                            <ScanFace className="w-5 h-5" />
                            <span className="text-xs font-semibold uppercase tracking-wider font-sans">
                              Documento Oficial com Foto & Biometria Facial 3D (+18)
                            </span>
                          </div>

                          {isKYCVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 font-bold border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Documento & Biometria Aprovados</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 font-semibold">
                              Pendente de Validação
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#0B0B0B]/70 font-sans leading-relaxed">
                          Envie a foto do seu documento oficial (RG, CNH ou Passaporte) e realize a prova de vida facial 3D com a câmera para conformidade legal com a legislação <strong>18 U.S.C. § 2257</strong>.
                        </p>

                        {basicData.document && (
                          <div className="p-2.5 bg-white border border-[#C9A96B]/40 text-xs font-sans text-[#0B0B0B]/80 flex items-center justify-between">
                            <span className="truncate"><strong>Arquivo:</strong> {basicData.document.fileName}</span>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase shrink-0">Anexado</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsKYCModalOpen(true)}
                          className={`w-full py-3.5 text-xs font-sans uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            isKYCVerified
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'bg-[#0B0B0B] hover:bg-[#8C6B2F] text-ivory shadow-md'
                          }`}
                        >
                          <ScanFace className="w-4 h-4" />
                          <span>{isKYCVerified ? 'Refazer Leitura do Documento & Biometria' : 'Anexar Documento & Iniciar Biometria 3D (+18) →'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Blindagem 2FA (Google Authenticator) Obrigatória */}
                    <div className="p-5 bg-[#FAF7F2] border-2 border-[#C9A96B]/50 rounded-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#8C6B2F]">
                          <KeyRound className="w-5 h-5" />
                          <span className="text-xs font-semibold uppercase tracking-wider font-sans">
                            Blindagem 2FA (Google Authenticator) Obrigatória
                          </span>
                        </div>

                        {is2FAVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 font-bold border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>2FA Ativado</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 font-semibold">
                            Pendente de Configuração
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#0B0B0B]/70 font-sans leading-relaxed">
                        Para proteger seus ganhos, dados bancários e book contra sequestro de conta, configure a Autenticação em Dois Fatores (2FA) com o <strong>Google Authenticator</strong> ou <strong>Authy</strong>.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIs2FAModalOpen(true)}
                        className={`w-full py-3 text-xs font-sans uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          is2FAVerified
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'bg-[#0B0B0B] hover:bg-[#8C6B2F] text-ivory'
                        }`}
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{is2FAVerified ? '2FA Concluído com Sucesso' : 'Escanear QR Code & Ativar 2FA →'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button
                      type="submit"
                      className="px-8 py-4 bg-[#0B0B0B] text-ivory text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#8C6B2F] transition-colors flex items-center gap-3 cursor-pointer shadow-lg"
                    >
                      <span>{t('qual_btn_next_pre_interview')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  ETAPA 2: DADOS QUALITATIVOS (PRÉ-ENTREVISTA)
              ═══════════════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <form onSubmit={handleNextStep2} className="space-y-10 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">
                      {t('qual_step2_badge')}
                    </span>
                    <h2 className="font-serif-lumiardi text-3xl font-light text-[#0B0B0B] mt-1">
                      {t('qual_creator_title2')}
                    </h2>
                    <p className="text-xs text-[#0B0B0B]/60 font-sans mt-1">
                      {t('qual_creator_desc2')}
                    </p>
                  </div>

                  {/* 1. Preferências Pessoais */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#0B0B0B]/10 text-sm font-serif-lumiardi text-[#8C6B2F]">
                      <User className="w-4 h-4" />
                      <span>{t('qual_sec_personal_identity')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_artistic_name_label')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('qual_artistic_name_placeholder')}
                          value={qualitativeData.artisticName}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, artisticName: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_acting_category_label')}
                        </label>
                        <select
                          value={qualitativeData.category}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, category: e.target.value as CreatorCategory })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          {categoryOptionsList.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {qualitativeData.category === 'Outro' && (
                      <div className="text-xs font-sans">
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_cat_other_explain_label')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('qual_cat_other_explain_placeholder')}
                          value={qualitativeData.categoryOtherExplanation}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, categoryOtherExplanation: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    )}

                    {/* Sexo & Gênero Inclusivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_gender_identity_label')}
                        </label>
                        <select
                          value={qualitativeData.gender}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, gender: e.target.value as GenderIdentity })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          {genderOptionsList.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_hobbies_label')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('qual_hobbies_placeholder')}
                          value={qualitativeData.hobbies}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, hobbies: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>

                    {/* Plataformas Ativas */}
                    <div className="space-y-4 pt-2">
                      <span className="text-xs font-sans uppercase tracking-wider font-semibold text-[#8C6B2F] block">
                        {t('qual_sec_platforms')}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                        <div>
                          <label className="block text-[#0B0B0B]/90 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-[#8C6B2F]" />
                            <span>{t('qual_insta_label')}</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="@seuusuario"
                            value={qualitativeData.platforms.instagram}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val && !val.startsWith('@')) val = `@${val}`;
                              setQualitativeData({
                                ...qualitativeData,
                                platforms: { ...qualitativeData.platforms, instagram: val },
                              });
                            }}
                            className="w-full px-4 py-3 border-2 border-[#C9A96B]/50 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B] font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                            {t('qual_privacy_label')}
                          </label>
                          <input
                            type="text"
                            placeholder="seu_usuario_privacy"
                            value={qualitativeData.platforms.privacy}
                            onChange={(e) => setQualitativeData({
                              ...qualitativeData,
                              platforms: { ...qualitativeData.platforms, privacy: e.target.value },
                            })}
                            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                            {t('qual_onlyfans_label')}
                          </label>
                          <input
                            type="text"
                            placeholder="seu_onlyfans"
                            value={qualitativeData.platforms.onlyfans}
                            onChange={(e) => setQualitativeData({
                              ...qualitativeData,
                              platforms: { ...qualitativeData.platforms, onlyfans: e.target.value },
                            })}
                            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                            {t('qual_fatal_models_label')}
                          </label>
                          <input
                            type="text"
                            placeholder="perfil fatal models"
                            value={qualitativeData.platforms.fatalModels}
                            onChange={(e) => setQualitativeData({
                              ...qualitativeData,
                              platforms: { ...qualitativeData.platforms, fatalModels: e.target.value },
                            })}
                            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                            {t('qual_fatal_fans_label')}
                          </label>
                          <input
                            type="text"
                            placeholder="perfil fatal fans"
                            value={qualitativeData.platforms.fatalFans}
                            onChange={(e) => setQualitativeData({
                              ...qualitativeData,
                              platforms: { ...qualitativeData.platforms, fatalFans: e.target.value },
                            })}
                            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                            {t('qual_twitter_label')}
                          </label>
                          <input
                            type="text"
                            placeholder="@seu_perfil_x"
                            value={qualitativeData.platforms.twitter}
                            onChange={(e) => setQualitativeData({
                              ...qualitativeData,
                              platforms: { ...qualitativeData.platforms, twitter: e.target.value },
                            })}
                            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                          />
                        </div>
                      </div>

                      <div className="text-xs font-sans">
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_other_platform_label')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('qual_other_platform_placeholder')}
                          value={qualitativeData.platforms.other}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            platforms: { ...qualitativeData.platforms, other: e.target.value },
                          })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>

                    {/* Faturamento e Conversão */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans pt-2">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_revenue_label')}
                        </label>
                        <select
                          value={qualitativeData.monthlyRevenueEstimate}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, monthlyRevenueEstimate: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          {revenueOptionsList.map((rev) => (
                            <option key={rev.value} value={rev.value}>
                              {rev.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_conversion_label')}
                        </label>
                        <select
                          value={qualitativeData.conversionRateEstimate}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, conversionRateEstimate: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          {conversionOptionsList.map((conv) => (
                            <option key={conv.value} value={conv.value}>
                              {conv.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Disponibilidade de Gravação */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/80">
                        {t('qual_availability_label')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availabilityOptionsList.map((p) => {
                          const isSelected = qualitativeData.availability.includes(p.value);
                          return (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => toggleAvailability(p.value)}
                              className={`px-4 py-2 text-xs font-sans uppercase tracking-wider border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0B0B0B] text-[#C9A96B] border-[#C9A96B] font-bold'
                                  : 'bg-[#FAF7F2] text-[#0B0B0B]/70 border-[#0B0B0B]/15 hover:border-[#C9A96B]'
                              }`}
                            >
                              {p.label} {isSelected && '(Selecionado)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filhos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans pt-2">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_children_has_label')}
                        </label>
                        <select
                          value={qualitativeData.hasChildren ? 'sim' : 'nao'}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, hasChildren: e.target.value === 'sim' })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          <option value="nao">{t('qual_children_no')}</option>
                          <option value="sim">{t('qual_children_yes')}</option>
                        </select>
                      </div>

                      {qualitativeData.hasChildren && (
                        <div>
                          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                            {t('qual_children_count_label')}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={qualitativeData.childrenCount}
                            onChange={(e) => setQualitativeData({ ...qualitativeData, childrenCount: Number(e.target.value) })}
                            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Idiomas */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/80">
                        {t('qual_languages_label')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGE_OPTIONS.map((lang) => {
                          const isSelected = qualitativeData.languages.includes(lang);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => toggleLanguage(lang)}
                              className={`px-3.5 py-1.5 text-xs font-sans border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#8C6B2F] text-white border-[#8C6B2F] font-semibold'
                                  : 'bg-[#FAF7F2] text-[#0B0B0B]/70 border-[#0B0B0B]/15 hover:border-[#8C6B2F]'
                              }`}
                            >
                              {lang} {isSelected && '(Selecionado)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Perguntas com Limite Estrito de 50 Caracteres */}
                    <div className="space-y-4 pt-4 border-t border-[#0B0B0B]/10">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/90">
                            {t('qual_exposure_label')}
                          </label>
                          <span className={`text-[11px] font-sans font-mono ${
                            qualitativeData.exposureOpinion.length === 50 ? 'text-amber-700 font-bold' : 'text-[#0B0B0B]/50'
                          }`}>
                            {qualitativeData.exposureOpinion.length}/50
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={50}
                          required
                          placeholder={t('qual_exposure_placeholder')}
                          value={qualitativeData.exposureOpinion}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, exposureOpinion: e.target.value.slice(0, 50) })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/90 mb-1">
                          {t('qual_limits_label')}
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder={t('qual_limits_placeholder')}
                          value={qualitativeData.personalLimits}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, personalLimits: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/90">
                            {t('qual_maingoal_label')}
                          </label>
                          <span className={`text-[11px] font-sans font-mono ${
                            qualitativeData.mainGoal.length === 50 ? 'text-amber-700 font-bold' : 'text-[#0B0B0B]/50'
                          }`}>
                            {qualitativeData.mainGoal.length}/50
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={50}
                          required
                          placeholder={t('qual_maingoal_placeholder')}
                          value={qualitativeData.mainGoal}
                          onChange={(e) => setQualitativeData({ ...qualitativeData, mainGoal: e.target.value.slice(0, 50) })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Medidas Corporais */}
                  <div className="space-y-4 pt-6 border-t border-[#0B0B0B]/10">
                    <div className="flex items-center gap-2 pb-2 text-sm font-serif-lumiardi text-[#8C6B2F]">
                      <Ruler className="w-4 h-4" />
                      <span>{t('qual_sec_measurements')}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-sans">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_height_label')}
                        </label>
                        <input
                          type="number"
                          placeholder={t('qual_height_placeholder')}
                          value={qualitativeData.measurements.height}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            measurements: { ...qualitativeData.measurements, height: e.target.value },
                          })}
                          className="w-full px-3 py-2.5 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_weight_label')}
                        </label>
                        <input
                          type="number"
                          placeholder={t('qual_weight_placeholder')}
                          value={qualitativeData.measurements.weight}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            measurements: { ...qualitativeData.measurements, weight: e.target.value },
                          })}
                          className="w-full px-3 py-2.5 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_waist_label')}
                        </label>
                        <input
                          type="number"
                          placeholder={t('qual_waist_placeholder')}
                          value={qualitativeData.measurements.waist}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            measurements: { ...qualitativeData.measurements, waist: e.target.value },
                          })}
                          className="w-full px-3 py-2.5 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_bust_label')}
                        </label>
                        <input
                          type="number"
                          placeholder={t('qual_bust_placeholder')}
                          value={qualitativeData.measurements.bust}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            measurements: { ...qualitativeData.measurements, bust: e.target.value },
                          })}
                          className="w-full px-3 py-2.5 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_hips_label')}
                        </label>
                        <input
                          type="number"
                          placeholder={t('qual_hips_placeholder')}
                          value={qualitativeData.measurements.hips}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            measurements: { ...qualitativeData.measurements, hips: e.target.value },
                          })}
                          className="w-full px-3 py-2.5 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Fisionomia */}
                  <div className="space-y-4 pt-6 border-t border-[#0B0B0B]/10">
                    <div className="flex items-center gap-2 pb-2 text-sm font-serif-lumiardi text-[#8C6B2F]">
                      <Eye className="w-4 h-4" />
                      <span>{t('qual_sec_physiognomy')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_hair_color_label')}
                        </label>
                        <select
                          value={qualitativeData.physiognomy.hairColor}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            physiognomy: { ...qualitativeData.physiognomy, hairColor: e.target.value },
                          })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          {hairColorsList.map((hc) => (
                            <option key={hc.value} value={hc.value}>
                              {hc.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_eye_color_label')}
                        </label>
                        <select
                          value={qualitativeData.physiognomy.eyeColor}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            physiognomy: { ...qualitativeData.physiognomy, eyeColor: e.target.value },
                          })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          {eyeColorsList.map((ec) => (
                            <option key={ec.value} value={ec.value}>
                              {ec.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
                          {t('qual_skin_tone_label')}
                        </label>
                        <select
                          value={qualitativeData.physiognomy.skinTone}
                          onChange={(e) => setQualitativeData({
                            ...qualitativeData,
                            physiognomy: { ...qualitativeData.physiognomy, skinTone: e.target.value },
                          })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
                        >
                          {skinTonesList.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="px-6 py-3.5 border border-[#0B0B0B]/20 text-xs uppercase tracking-[0.2em] font-medium hover:border-[#0B0B0B] transition-colors cursor-pointer"
                    >
                      {t('qual_btn_back_step1')}
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-4 bg-[#0B0B0B] text-ivory text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#8C6B2F] transition-colors flex items-center gap-3 cursor-pointer shadow-lg"
                    >
                      <span>{t('qual_btn_next_scheduling')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  ETAPA 3: AGENDAMENTO DE CURADORIA & FINALIZAÇÃO
              ═══════════════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-10 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">
                      {t('qual_step3_badge')}
                    </span>
                    <h2 className="font-serif-lumiardi text-3xl font-light text-[#0B0B0B] mt-1">
                      {t('qual_creator_title3')}
                    </h2>
                    <p className="text-xs text-[#0B0B0B]/60 font-sans mt-1">
                      {t('qual_creator_desc3')}
                    </p>
                  </div>

                  <CurationScheduler
                    userType="criadora"
                    selectedAppointment={appointment}
                    onScheduleChange={(appt) => setAppointment(appt)}
                  />

                  <div className="p-4 bg-[#FAF7F2] border border-[#0B0B0B]/10 text-xs text-[#0B0B0B]/75 font-sans space-y-2">
                    <div className="flex items-center gap-2 text-[#8C6B2F] font-semibold uppercase tracking-wider">
                      <Lock className="w-4 h-4" />
                      <span>{t('qual_privacy_guarantee_title')}</span>
                    </div>
                    <p className="leading-relaxed">
                      {t('qual_privacy_guarantee_desc')}
                    </p>
                  </div>

                  <div className="pt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="px-6 py-3.5 border border-[#0B0B0B]/20 text-xs uppercase tracking-[0.2em] font-medium hover:border-[#0B0B0B] transition-colors cursor-pointer"
                    >
                      {t('qual_btn_back_pre_interview')}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSubmit}
                      className="px-10 py-4 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-[0.25em] font-semibold hover:bg-[#D4B87A] transition-all flex items-center gap-3 cursor-pointer shadow-xl disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? t('qual_btn_submitting') : t('qual_btn_final_submit')}</span>
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
        claimedData={{
          fullName: basicData.fullName,
          cpf: basicData.cpf,
          birthDate: basicData.birthDate,
          email: basicData.email,
        }}
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

export default function QualificacaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-[#C9A96B] font-serif-lumiardi text-xl">Carregando formulário de qualificação...</div>}>
      <QualificacaoContent />
    </Suspense>
  );
}
