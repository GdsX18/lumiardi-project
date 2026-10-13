'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { useLanguage } from '@/context/LanguageContext';

function RecoverPasswordForm() {
  const searchParams = useSearchParams();
  const { t, tApiError } = useLanguage();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(tApiError(data));
      setSent(true);
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
            {t('pwd_recover_title')}
          </h1>
          <p className="text-xs text-ivory/60 font-sans leading-relaxed">{t('pwd_recover_desc')}</p>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('pwd_recover_sent')}</span>
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
                  {t('login_email_label')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-[#161616] border border-white/10 text-xs md:text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold font-sans"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span>{loading ? t('pwd_recover_sending') : t('pwd_recover_submit')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <div className="pt-4 border-t border-white/10 text-center">
          <Link href="/login" className="text-xs font-sans text-gold hover:underline uppercase tracking-wider">
            ← {t('pwd_back_to_login')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecoverPasswordPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-gold selection:text-black-matte">
      <Header />
      <section className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
        <Suspense fallback={null}>
          <RecoverPasswordForm />
        </Suspense>
      </section>
      <Footer />
    </main>
  );
}
