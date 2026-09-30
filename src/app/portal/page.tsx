'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  Lock,
  Scale,
  Clock,
  Send,
  EyeOff,
  UserX,
  FileWarning,
  HelpCircle,
  Gavel,
  Shield,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

type CategoryType =
  | 'menor'
  | 'intimo_nao_consensual'
  | 'exploracao_coercao'
  | 'perfil_falso'
  | 'direito_imagem'
  | 'copyright'
  | 'fraude'
  | 'violacao_termos'
  | 'ordem_judicial';

interface ProtocolResult {
  protocol: string;
  categoryId: CategoryType;
  date: string;
  email: string;
}

export default function PortalPage() {
  const { t, tApiError, formatDateTime } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('menor');
  const [personType, setPersonType] = useState('sim');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [url, setUrl] = useState('');
  const [contentId, setContentId] = useState('');
  const [username, setUsername] = useState('');
  const [approxDate, setApproxDate] = useState('');
  const [description, setDescription] = useState('');
  const [declaration, setDeclaration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<ProtocolResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  // Campos específicos para Ordem Judicial
  const [judicialBody, setJudicialBody] = useState('');
  const [processNumber, setProcessNumber] = useState('');
  const [authorityName, setAuthorityName] = useState('');
  const [judicialDeadline, setJudicialDeadline] = useState('');

  const categories: {
    id: CategoryType;
    code: string;
    priorityKey: string;
    badgeColor: string;
    borderHover: string;
  }[] = [
    { id: 'menor', code: 'A', priorityKey: 'lgm_portal_prio_critical', badgeColor: 'bg-red-500 text-black-matte', borderHover: 'hover:border-red-500' },
    { id: 'intimo_nao_consensual', code: 'B', priorityKey: 'lgm_portal_prio_critical_high', badgeColor: 'bg-red-500/90 text-black-matte', borderHover: 'hover:border-red-500' },
    { id: 'exploracao_coercao', code: 'C', priorityKey: 'lgm_portal_prio_critical', badgeColor: 'bg-red-500 text-black-matte', borderHover: 'hover:border-red-500' },
    { id: 'perfil_falso', code: 'D', priorityKey: 'lgm_portal_prio_high', badgeColor: 'bg-amber-500 text-black-matte', borderHover: 'hover:border-amber-500' },
    { id: 'direito_imagem', code: 'E', priorityKey: 'lgm_portal_prio_high', badgeColor: 'bg-amber-500 text-black-matte', borderHover: 'hover:border-amber-500' },
    { id: 'copyright', code: 'F', priorityKey: 'lgm_portal_prio_moderate', badgeColor: 'bg-blue-500 text-black-matte', borderHover: 'hover:border-blue-500' },
    { id: 'fraude', code: 'G', priorityKey: 'lgm_portal_prio_high', badgeColor: 'bg-amber-500 text-black-matte', borderHover: 'hover:border-amber-500' },
    { id: 'violacao_termos', code: 'H', priorityKey: 'lgm_portal_prio_moderate', badgeColor: 'bg-gray-400 text-black-matte', borderHover: 'hover:border-gray-400' },
    { id: 'ordem_judicial', code: '', priorityKey: 'lgm_portal_prio_immediate', badgeColor: 'bg-purple-500 text-white', borderHover: 'hover:border-purple-500' },
  ];

  const categoryCode = (code: string) =>
    code ? t('lgm_portal_category_code').replace('{code}', code) : t('lgm_portal_official_order');
  const categoryTitle = (id: CategoryType) => t(`lgm_portal_cat_${id}_title`);
  const categoryPriority = (id: CategoryType) =>
    t(categories.find((c) => c.id === id)?.priorityKey ?? 'lgm_portal_prio_high');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      setErrorMessage(t('lgm_portal_err_declaration'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        category: selectedCategory,
        name,
        email,
        phone: phone || undefined,
        personType,
        url,
        username: username || undefined,
        approxDate: approxDate || undefined,
        description,
        declaration,
        judicialBody: selectedCategory === 'ordem_judicial' ? judicialBody : undefined,
        processNumber: selectedCategory === 'ordem_judicial' ? processNumber : undefined,
        authorityName: selectedCategory === 'ordem_judicial' ? authorityName : undefined,
        judicialDeadline: selectedCategory === 'ordem_judicial' ? judicialDeadline : undefined,
        honeypot: honeypot || undefined,
      };

      const res = await fetch('/api/compliance/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(tApiError(data, 'lgm_portal_err_submit'));
      }

      setSubmittedResult({
        protocol: data.protocol,
        categoryId: selectedCategory,
        date: formatDateTime(new Date()),
        email: data.email || email,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('[Portal Page] Erro ao enviar denúncia:', err);
      const msg = err instanceof Error ? err.message : t('lgm_portal_err_network');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedResult(null);
    setSelectedCategory('menor');
    setName('');
    setEmail('');
    setPhone('');
    setUrl('');
    setContentId('');
    setUsername('');
    setApproxDate('');
    setDescription('');
    setDeclaration(false);
    setJudicialBody('');
    setProcessNumber('');
    setAuthorityName('');
    setJudicialDeadline('');
    setHoneypot('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-28 max-w-5xl mx-auto px-6 md:px-12 space-y-16">
        
        {/* Cabeçalho Editorial & Notice-and-Action */}
        <header className="text-center space-y-5 border-b border-white/10 pb-12 relative">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-sans uppercase tracking-[0.3em]">
            <ShieldAlert className="w-4 h-4 stroke-[1.5]" />
            <span>{t('lgm_portal_tag')}</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight leading-tight">
            {t('lgm_portal_title')}
          </h1>

          <p className="max-w-3xl mx-auto text-sm md:text-base text-ivory/70 font-light leading-relaxed">
            {t('lgm_portal_intro')}
          </p>

          <div className="p-4 bg-red-950/25 border border-red-500/30 rounded-lg max-w-2xl mx-auto text-xs text-red-200 text-center font-sans">
            ⚠️ <strong>{t('lgm_portal_warning_label')}</strong> {t('lgm_portal_warning_text')}
          </div>
        </header>

        {/* TELA DE PROTOCOLO GERADO COM SUCESSO */}
        {submittedResult ? (
          <div className="p-8 md:p-12 bg-[#0D0D0D] border-2 border-[#C9A96B] rounded-xl space-y-8 animate-fade-in shadow-2xl">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#C9A96B]/15 border border-[#C9A96B] rounded-full flex items-center justify-center mx-auto text-[#C9A96B]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif-lumiardi text-3xl md:text-4xl text-ivory font-light">
                {t('lgm_portal_success_title')}
              </h2>
              <p className="text-xs md:text-sm text-ivory/70 max-w-lg mx-auto">
                {t('lgm_portal_success_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-lg font-mono text-xs">
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgm_portal_protocol_number')}</span>
                <p className="text-base text-[#C9A96B] font-bold">{submittedResult.protocol}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgm_portal_registered_at')}</span>
                <p className="text-ivory">{submittedResult.date}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgm_portal_case_category')}</span>
                <p className="text-ivory">{categoryTitle(submittedResult.categoryId)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">{t('lgm_portal_priority_level')}</span>
                <span className="inline-block px-2.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[11px] font-bold">
                  {categoryPriority(submittedResult.categoryId)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs md:text-sm text-ivory/80 leading-relaxed">
              <p>
                {t('lgm_portal_confirmation_sent')} <strong className="text-ivory font-mono">{submittedResult.email}</strong>.
              </p>
              <p className="text-ivory/60 text-xs">
                {t('lgm_portal_success_flow')}
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-widest font-bold hover:bg-[#D4B87A] transition-all cursor-pointer"
              >
                {t('lgm_portal_new_report')}
              </button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE NOTICE-AND-ACTION */
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* ETAPA 1: Classificação Obrigatória */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">1</span>
                <span>{t('lgm_portal_step1')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-4 text-left border rounded-lg transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A96B]/10 border-[#C9A96B] shadow-lg ring-1 ring-[#C9A96B]'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C9A96B]">
                            {categoryCode(cat.code)}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${cat.badgeColor}`}>
                            {t(cat.priorityKey)}
                          </span>
                        </div>
                        <h3 className="font-serif-lumiardi text-lg text-ivory font-normal leading-snug">
                          {categoryTitle(cat.id)}
                        </h3>
                      </div>
                      <p className="text-[11px] text-ivory/60 leading-relaxed font-light">
                        {t(`lgm_portal_cat_${cat.id}_desc`)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ETAPA 2: Identificação do Denunciante */}
            <section className="space-y-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">2</span>
                <span>{t('lgm_portal_step2')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">{t('lgm_portal_full_name')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('lgm_portal_full_name_ph')}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">{t('lgm_portal_email_label')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('lgm_portal_email_ph')}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">{t('lgm_portal_phone_label')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ivory/80 uppercase tracking-wider block">
                  {t('lgm_portal_relation_label')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {[
                    { id: 'sim', label: t('lgm_portal_rel_self') },
                    { id: 'nao', label: t('lgm_portal_rel_third') },
                    { id: 'rep_legal', label: t('lgm_portal_rel_legal_rep') },
                    { id: 'procurador', label: t('lgm_portal_rel_attorney') },
                    { id: 'resp_legal', label: t('lgm_portal_rel_guardian') },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setPersonType(item.id)}
                      className={`p-2.5 text-center border rounded transition-all cursor-pointer ${
                        personType === item.id
                          ? 'bg-[#C9A96B]/20 border-[#C9A96B] text-ivory font-medium'
                          : 'bg-white/5 border-white/10 text-ivory/60 hover:text-ivory'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* SEÇÃO EXTRA PARA ORDEM JUDICIAL / AUTORIDADE */}
            {selectedCategory === 'ordem_judicial' && (
              <section className="p-6 bg-purple-950/20 border border-purple-500/40 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-purple-300 text-xs uppercase tracking-widest font-semibold">
                  <Gavel className="w-4 h-4" />
                  <span>{t('lgm_portal_judicial_section')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">{t('lgm_portal_judicial_body')}</label>
                    <input
                      type="text"
                      required
                      value={judicialBody}
                      onChange={(e) => setJudicialBody(e.target.value)}
                      placeholder={t('lgm_portal_judicial_body_ph')}
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">{t('lgm_portal_process_number')}</label>
                    <input
                      type="text"
                      required
                      value={processNumber}
                      onChange={(e) => setProcessNumber(e.target.value)}
                      placeholder="0000000-00.2026.8.00.0000"
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">{t('lgm_portal_authority')}</label>
                    <input
                      type="text"
                      required
                      value={authorityName}
                      onChange={(e) => setAuthorityName(e.target.value)}
                      placeholder={t('lgm_portal_authority_ph')}
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">{t('lgm_portal_deadline')}</label>
                    <input
                      type="text"
                      value={judicialDeadline}
                      onChange={(e) => setJudicialDeadline(e.target.value)}
                      placeholder={t('lgm_portal_deadline_ph')}
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ETAPA 3: Identificação do Conteúdo */}
            <section className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">3</span>
                <span>{t('lgm_portal_step3')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">{t('lgm_portal_url_label')}</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://lumiardi.com/..."
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">{t('lgm_portal_username_label')}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('lgm_portal_username_ph')}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">{t('lgm_portal_approx_date_label')}</label>
                  <input
                    type="text"
                    value={approxDate}
                    onChange={(e) => setApproxDate(e.target.value)}
                    placeholder={t('lgm_portal_approx_date_ph')}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-ivory/80 uppercase tracking-wider">
                  {t('lgm_portal_description_label')}
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('lgm_portal_description_ph')}
                  className="w-full p-4 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B] leading-relaxed font-sans"
                />
              </div>
            </section>

            {/* ETAPA 4: Regra Crítica de Provas & Alerta Protetivo */}
            <section className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">4</span>
                <span>{t('lgm_portal_step4')}</span>
              </div>

              {/* Alerta Protetivo Obrigatório */}
              <div className="p-6 bg-amber-950/20 border border-amber-500/40 rounded-lg space-y-3 text-amber-200 text-xs md:text-sm">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-300">
                  <FileWarning className="w-5 h-5 shrink-0" />
                  <span>{t('lgm_portal_upload_rule_title')}</span>
                </div>
                <p className="leading-relaxed">
                  <strong>{t('lgm_portal_upload_rule_strong')}</strong> {t('lgm_portal_upload_rule_text')}
                </p>
              </div>

              <div className="p-6 border border-dashed border-white/20 rounded-lg text-center space-y-3 bg-white/[0.01]">
                <UploadCloud className="w-8 h-8 text-ivory/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs text-ivory/80">
                    {t('lgm_portal_upload_links')}
                  </p>
                  <p className="text-[11px] text-ivory/50">
                    {t('lgm_portal_upload_formats')}
                  </p>
                </div>
              </div>
            </section>

            {/* ETAPA 5: Declaração Formal de Responsabilidade */}
            <section className="space-y-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">5</span>
                <span>{t('lgm_portal_step5')}</span>
              </div>

              <label className="p-4 bg-white/[0.02] border border-white/15 rounded-lg flex items-start gap-3.5 cursor-pointer hover:border-[#C9A96B]/50 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#C9A96B] rounded cursor-pointer"
                />
                <span className="text-xs md:text-sm text-ivory/90 leading-relaxed">
                  <strong>{t('lgm_portal_declaration_strong')}</strong>{t('lgm_portal_declaration_text')}
                </span>
              </label>

              {/* Honeypot invisível para bots */}
              <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                <label htmlFor="portal_honeypot">Website</label>
                <input
                  id="portal_honeypot"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-[#C9A96B] text-[#0B0B0B] text-xs md:text-sm font-sans tracking-[0.25em] uppercase font-bold hover:bg-[#D4B87A] transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? t('lgm_portal_submitting') : t('lgm_portal_submit')}</span>
              </button>
            </section>
          </form>
        )}

        {/* SEÇÕES DE GOVERNANÇA, SLA E TRANSPARÊNCIA */}
        <section className="pt-16 border-t border-white/10 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A96B]">{t('lgm_portal_gov_tag')}</span>
            <h2 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory">
              {t('lgm_portal_gov_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-5 bg-red-950/20 border border-red-500/30 rounded-lg space-y-2">
              <span className="text-red-400 font-bold uppercase tracking-wider block">{t('lgm_portal_sla_critical')}</span>
              <p className="font-mono text-ivory font-medium">{t('lgm_portal_sla_critical_time')}</p>
              <p className="text-ivory/60 leading-relaxed">{t('lgm_portal_sla_critical_desc')}</p>
            </div>

            <div className="p-5 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider block">{t('lgm_portal_sla_high')}</span>
              <p className="font-mono text-ivory font-medium">{t('lgm_portal_sla_high_time')}</p>
              <p className="text-ivory/60 leading-relaxed">{t('lgm_portal_sla_high_desc')}</p>
            </div>

            <div className="p-5 bg-blue-950/20 border border-blue-500/30 rounded-lg space-y-2">
              <span className="text-blue-400 font-bold uppercase tracking-wider block">{t('lgm_portal_sla_moderate')}</span>
              <p className="font-mono text-ivory font-medium">{t('lgm_portal_sla_moderate_time')}</p>
              <p className="text-ivory/60 leading-relaxed">{t('lgm_portal_sla_moderate_desc')}</p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-lg space-y-2">
              <span className="text-ivory/60 font-bold uppercase tracking-wider block">{t('lgm_portal_sla_ordinary')}</span>
              <p className="font-mono text-ivory font-medium">{t('lgm_portal_sla_ordinary_time')}</p>
              <p className="text-ivory/60 leading-relaxed">{t('lgm_portal_sla_ordinary_desc')}</p>
            </div>
          </div>

          {/* Princípio de Governança Documental */}
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-3 text-xs md:text-sm text-ivory/80 leading-relaxed">
            <h3 className="font-serif-lumiardi text-xl text-[#C9A96B] font-normal">
              {t('lgm_portal_principle_title')}
            </h3>
            <p>
              {t('lgm_portal_principle_intro')}
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#C9A96B] pt-2">
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">{t('lgm_portal_flow_1')}</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">{t('lgm_portal_flow_2')}</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">{t('lgm_portal_flow_3')}</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">{t('lgm_portal_flow_4')}</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">{t('lgm_portal_flow_5')}</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">{t('lgm_portal_flow_6')}</span>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
