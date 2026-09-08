'use client';

import React, { useState } from 'react';
import { Mail, Building2, HelpCircle, Headphones, Newspaper, Send, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type FormState = {
  name: string;
  email: string;
  type: string;
  subject: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const CONTACT_TYPES_ICONS: Record<string, React.ElementType> = {
  contact_form_type_general: HelpCircle,
  contact_form_type_partnership: Building2,
  contact_form_type_support: Headphones,
  contact_form_type_press: Newspaper,
};

export default function ContatoPage() {
  const { t } = useLanguage();

  const CONTACT_TYPES = [
    { key: 'contact_form_type_general', icon: HelpCircle },
    { key: 'contact_form_type_partnership', icon: Building2 },
    { key: 'contact_form_type_support', icon: Headphones },
    { key: 'contact_form_type_press', icon: Newspaper },
  ];

  const [form, setForm] = useState<FormState>({ name: '', email: '', type: '', subject: '', message: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = t('contact_form_required');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t('contact_form_email_invalid');
    if (!form.type) next.type = t('contact_form_required');
    if (!form.subject.trim()) next.subject = t('contact_form_required');
    if (!form.message.trim() || form.message.trim().length < 10) next.message = t('contact_form_required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: t(form.type) }),
      });
      if (!res.ok) throw new Error('server error');
      setStatus('success');
      setForm({ name: '', email: '', type: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputClass = (field: keyof FormState) =>
    `w-full bg-white/5 border ${errors[field] ? 'border-red-500/70' : 'border-white/10'} text-ivory placeholder-ivory/30 font-sans text-sm px-4 py-3 focus:outline-none focus:border-[#C9A96B]/60 transition-colors`;

  const directContacts = [
    { labelKey: 'contact_info_general_label', email: 'contato@lumiardi.com', Icon: HelpCircle },
    { labelKey: 'contact_info_partnership_label', email: 'parcerias@lumiardi.com', Icon: Building2 },
    { labelKey: 'contact_info_support_label', email: 'suporte@lumiardi.com', Icon: Headphones },
  ];

  return (
    <>
      {/* Hero */}
      <section className="pt-36 pb-20 relative overflow-hidden border-b border-[#C9A96B]/20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A96B]/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-[#C9A96B]/30 bg-[#C9A96B]/5 text-[#C9A96B] text-xs font-sans tracking-[0.3em] uppercase">
            <Mail className="w-3.5 h-3.5 stroke-[1.2]" />
            <span>{t('contact_hero_tag')}</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl md:text-6xl font-light text-ivory tracking-tight leading-[1.05] max-w-3xl mx-auto">
            {t('contact_hero_title')}
          </h1>
          <p className="font-sans text-base md:text-lg text-ivory/60 font-light leading-relaxed max-w-xl mx-auto">
            {t('contact_hero_desc')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

            {/* Form — 3/5 */}
            <div className="lg:col-span-3">
              {status === 'success' ? (
                <div className="border border-emerald-500/30 bg-emerald-500/5 p-10 flex flex-col items-center text-center gap-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  <h2 className="font-serif-lumiardi text-2xl font-light text-ivory">{t('contact_form_success_title')}</h2>
                  <p className="font-sans text-sm text-ivory/70">{t('contact_form_success_desc')}</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-4 px-6 py-2.5 border border-[#C9A96B]/50 text-[#C9A96B] text-xs uppercase font-sans tracking-widest hover:bg-[#C9A96B] hover:text-black transition-all"
                  >
                    {t('contact_form_send')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Contact type cards */}
                  <div className="space-y-2">
                    <label className="block text-xs font-sans uppercase tracking-[0.2em] text-ivory/50">
                      {t('contact_form_type')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CONTACT_TYPES.map(({ key, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleChange('type', key)}
                          className={`flex flex-col items-center gap-2 p-4 border text-center transition-all cursor-pointer ${
                            form.type === key
                              ? 'border-[#C9A96B] bg-[#C9A96B]/10 text-[#C9A96B]'
                              : 'border-white/10 bg-white/[0.03] text-ivory/50 hover:border-white/20 hover:text-ivory/70'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[10px] font-sans uppercase tracking-wider leading-tight">{t(key)}</span>
                        </button>
                      ))}
                    </div>
                    {errors.type && <p className="text-red-400 text-xs font-sans mt-1">{errors.type}</p>}
                  </div>

                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-sans uppercase tracking-[0.2em] text-ivory/50">{t('contact_form_name')}</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder={t('contact_form_name')}
                        className={inputClass('name')}
                        autoComplete="name"
                      />
                      {errors.name && <p className="text-red-400 text-xs font-sans">{errors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-sans uppercase tracking-[0.2em] text-ivory/50">{t('contact_form_email')}</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        placeholder={t('contact_form_email')}
                        className={inputClass('email')}
                        autoComplete="email"
                      />
                      {errors.email && <p className="text-red-400 text-xs font-sans">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans uppercase tracking-[0.2em] text-ivory/50">{t('contact_form_subject')}</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => handleChange('subject', e.target.value)}
                      placeholder={t('contact_form_subject')}
                      className={inputClass('subject')}
                    />
                    {errors.subject && <p className="text-red-400 text-xs font-sans">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans uppercase tracking-[0.2em] text-ivory/50">{t('contact_form_message')}</label>
                    <textarea
                      value={form.message}
                      onChange={e => handleChange('message', e.target.value)}
                      placeholder={t('contact_form_message')}
                      rows={6}
                      className={`${inputClass('message')} resize-none`}
                    />
                    {errors.message && <p className="text-red-400 text-xs font-sans">{errors.message}</p>}
                  </div>

                  {status === 'error' && (
                    <div className="flex items-start gap-3 border border-red-500/30 bg-red-500/5 px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm font-sans">{t('contact_form_error')}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] font-sans text-xs tracking-[0.25em] uppercase font-bold hover:bg-[#D4B87A] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>{status === 'sending' ? t('contact_form_sending') : t('contact_form_send')}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar — 2/5 */}
            <aside className="lg:col-span-2 space-y-8">
              {/* Direct contact info */}
              <div className="space-y-6">
                <h2 className="font-serif-lumiardi text-xl font-light text-ivory tracking-wide">
                  {t('contact_info_title')}
                </h2>
                <div className="space-y-4">
                  {directContacts.map(({ labelKey, email, Icon }) => (
                    <div key={labelKey} className="flex items-start gap-4 p-4 border border-white/8 bg-white/[0.02] hover:border-[#C9A96B]/30 transition-colors group">
                      <div className="p-2 bg-[#C9A96B]/10 text-[#C9A96B] shrink-0 group-hover:bg-[#C9A96B]/20 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-ivory/40 mb-1">
                          {t(labelKey)}
                        </p>
                        <a
                          href={`mailto:${email}`}
                          className="text-sm font-sans text-ivory/80 hover:text-[#C9A96B] transition-colors break-all"
                        >
                          {email}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response time */}
              <div className="border border-[#C9A96B]/20 bg-[#C9A96B]/5 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-[#C9A96B]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-sans uppercase tracking-[0.2em]">{t('contact_info_response_time')}</span>
                </div>
                <p className="text-xs text-ivory/50 font-sans leading-relaxed">
                  {t('contact_info_secure_note')}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

