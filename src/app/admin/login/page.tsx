'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Acesso administrativo negado.');
      }

      router.push('/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na autenticação administrativa';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-ivory flex flex-col justify-between selection:bg-gold selection:text-black-matte">
      {/* Barra Superior Minimalista */}
      <header className="border-b border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src="/Lumiardi logo2-Trasparente.png"
              alt="Lumiardi Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-serif-lumiardi text-lg tracking-[0.2em] uppercase text-ivory">
            LUMIARDI <span className="text-gold text-xs tracking-normal font-sans ml-1">ADMIN</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-ivory/50">
          <Lock className="w-3.5 h-3.5 text-gold" />
          <span>Mesa de Curadoria & Gestão</span>
        </div>
      </header>

      {/* Container Central de Autenticação */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md bg-[#0D0D0D] border border-gold/30 p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Luz de Fundo Luxuosa */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 border border-gold/40 text-gold mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="font-serif-lumiardi text-2xl md:text-3xl font-light text-ivory tracking-wide">
                Portal de Curadoria
              </h1>
              <p className="text-xs text-ivory/60 font-sans">
                Acesso restrito para auditores e gestores da plataforma Lumiardi.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-sans flex items-start gap-2.5 rounded-sm animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                  E-mail do Auditor
                </label>
                <input
                  type="email"
                  required
                  placeholder="curadoria@lumiardi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-sm text-ivory placeholder-ivory/30 outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-sm text-ivory placeholder-ivory/30 outline-none transition-colors rounded-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full py-3 text-xs tracking-[0.2em] font-semibold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gold/10"
                >
                  {loading ? (
                    'Autenticando...'
                  ) : (
                    <>
                      <span>Acessar Painel de Curadoria</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-sans text-ivory/40">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                Criptografia SHA-256 / AES
              </span>
              <span>Lumiardi Security Protocol</span>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Minimalista */}
      <footer className="border-t border-white/[0.06] py-3 text-center text-[11px] font-sans text-ivory/40">
        © 2026 LUMIARDI — Todos os direitos reservados. Ambiente exclusivo para gestão corporativa.
      </footer>
    </div>
  );
}
