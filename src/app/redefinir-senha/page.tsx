'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PasswordInput, PasswordRequirements } from '@/components/ui/PasswordInput';
import { useLanguage } from '@/context/LanguageContext';
import { isStrongPassword, normalizePassword } from '@/lib/passwordPolicy';

const inputClass =
  'w-full pl-9 py-3 bg-[#161616] border border-white/10 text-xs md:text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold font-sans';
const iconClass = 'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { t, tApiError } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!isStrongPassword(password)) {
      setErrorMsg(t('api_err_weak_password'));
      return;
    }
    if (normalizePassword(password) !== normalizePassword(confirm)) {
      setErrorMsg(t('pwd_mismatch'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(tApiError(data));
      setDone(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('api_err_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="p-6 md:p-10 bg-[#0E0E0E] border border-white/15 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 border border-gold/40 text-gold mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory tracking-wide">
            {t('pwd_reset_title')}
          </h1>
          <p className="text-xs text-ivory/60 font-sans leading-relaxed">{t('pwd_reset_desc')}</p>
        </div>

        {!token ? (
          <div className="p-3.5 bg-rose-950/70 border border-rose-600/50 text-rose-300 text-xs font-sans flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{t('api_err_reset_token_invalid')}</span>
          </div>
        ) : done ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t('pwd_reset_done')}</span>
            </div>
            <Link
              href="/login"
              className="w-full py-3.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>{t('pwd_back_to_login')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-600/50 text-rose-300 text-xs font-sans flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-ivory/70 mb-1.5">
                  {t('pwd_new_label')}
                </label>
                <PasswordInput
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<KeyRound className={iconClass} />}
                  className={inputClass}
                />
                <PasswordRequirements password={password} />
              </div>
              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-ivory/70 mb-1.5">
                  {t('pwd_confirm_label')}
                </label>
                <PasswordInput
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  leftIcon={<KeyRound className={iconClass} />}
                  className={inputClass}
                />
                {confirm && normalizePassword(confirm) !== normalizePassword(password) && (
                  <p className="mt-1.5 text-[11px] text-rose-400">{t('pwd_mismatch')}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span>{loading ? t('pwd_reset_saving') : t('pwd_reset_submit')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {!done && (
          <div className="pt-4 border-t border-white/10 text-center space-x-4">
            <Link href="/recuperar-senha" className="text-xs font-sans text-ivory/50 hover:text-gold hover:underline">
              {t('pwd_request_new_link')}
            </Link>
            <Link href="/login" className="text-xs font-sans text-gold hover:underline uppercase tracking-wider">
              {t('pwd_back_to_login')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-gold selection:text-black-matte">
      <Header />
      <section className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </section>
      <Footer />
    </main>
  );
}
