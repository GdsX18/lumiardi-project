'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserCheck,
  Building2,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { refreshData } = useAuthPortal();
  const { t, tApiError } = useLanguage();

  const [role, setRole] = useState<'criadora' | 'agencia'>('criadora');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Contas com 2FA ativo: o servidor pede o código TOTP após validar a senha
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, ...(requiresTwoFactor ? { totpCode } : {}) }),
      });

      const data = await res.json();

      if (data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTotpCode('');
        // Primeiro pedido do código não é erro: só mostra o campo
        if (data.code === 'two_factor_code_required') return;
      }

      if (!res.ok) {
        throw new Error(tApiError(data, 'pub_login_auth_failed'));
      }

      await refreshData();

      if (data.user.curationStatus === 'APROVADO') {
        router.push(redirectUrl || '/dashboard');
      } else if (data.user.curationStatus === 'APROVADA_PAGAMENTO') {
        const planQuery = data.user.planId ? `?plan=${data.user.planId}&billing=${data.user.planBillingInterval || 'yearly'}` : '';
        router.push(redirectUrl || `/checkout${planQuery}`);
      } else {
        router.push('/dashboard/pendente');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('pub_login_auth_failed');
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="p-6 md:p-10 bg-[#0E0E0E] border border-white/15 shadow-2xl space-y-6">
        
        {/* Cabeçalho do Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/40 text-gold text-[10px] font-sans uppercase tracking-[0.25em]">
            <Lock className="w-3 h-3" />
            <span>{t('login_secure_title')}</span>
          </div>
          <h1 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory tracking-wide">
            {t('login_portal_title')}
          </h1>
          <p className="text-xs text-ivory/60 font-sans leading-relaxed">
            {t('login_portal_desc')}
          </p>
        </div>

        {/* Alternador de Perfil */}
        <div className="flex bg-[#161616] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setRole('criadora');
              setRequiresTwoFactor(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-sans font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'criadora'
                ? 'bg-gold text-black-matte font-semibold shadow-md'
                : 'text-ivory/60 hover:text-ivory'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('login_role_creator')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('agencia');
              setRequiresTwoFactor(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-sans font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'agencia'
                ? 'bg-gold text-black-matte font-semibold shadow-md'
                : 'text-ivory/60 hover:text-ivory'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('login_role_agency')}</span>
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/70 border border-rose-600/50 text-rose-300 text-xs font-sans flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-sans uppercase tracking-wider text-ivory/70 mb-1.5">
              {t('login_email_label')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setRequiresTwoFactor(false);
                }}
                placeholder={role === 'criadora' ? t('pub_login_email_placeholder_creator') : t('pub_login_email_placeholder_agency')}
                className="w-full pl-9 pr-4 py-3 bg-[#161616] border border-white/10 text-xs md:text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-sans uppercase tracking-wider text-ivory/70">
                {t('login_pass_label')}
              </label>
              <span className="text-[10px] text-bronze uppercase tracking-wider">
                {t('chat_e2e_shield')}
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-3 bg-[#161616] border border-white/10 text-xs md:text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-gold cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {requiresTwoFactor && (
            <div className="animate-in fade-in">
              <label className="block text-xs font-sans uppercase tracking-wider text-ivory/70 mb-1.5">
                {t('api_err_two_factor_code_required')}
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gold" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full pl-9 pr-4 py-3 bg-[#161616] border border-gold/40 text-sm text-ivory tracking-[0.5em] font-mono placeholder:text-ivory/30 focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <span>{loading ? (t('login_logging_in')) : (t('login_submit_btn'))}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Links de Criação de Conta */}
        <div className="pt-4 border-t border-white/10 text-center space-y-2">
          <span className="text-xs font-sans text-ivory/50 block">
            {t('login_no_account')}
          </span>
          <div className="flex items-center justify-center gap-4 text-xs font-sans">
            <Link
              href={searchParams.get('plan') ? `/qualificacao?plan=${searchParams.get('plan')}&billing=${searchParams.get('billing') || 'yearly'}` : '/qualificacao'}
              className="text-gold hover:underline uppercase tracking-wider font-medium"
            >
              {t('login_register_creator')} →
            </Link>
            <span className="text-ivory/30">•</span>
            <Link
              href={searchParams.get('plan') ? `/qualificacao/agencia?plan=${searchParams.get('plan')}&billing=${searchParams.get('billing') || 'yearly'}` : '/qualificacao/agencia'}
              className="text-gold hover:underline uppercase tracking-wider font-medium"
            >
              {t('login_register_agency')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-gold selection:text-black-matte">
      <Header />

      <section className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center py-20 text-gold font-serif-lumiardi">{t('pub_login_loading')}</div>}>
          <LoginForm />
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}
