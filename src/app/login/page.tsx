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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { refreshData } = useAuthPortal();

  const [role, setRole] = useState<'criadora' | 'agencia'>('criadora');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar credencial.');
      }

      await refreshData();

      if (data.user.curationStatus === 'APROVADO') {
        router.push(redirectUrl || '/dashboard');
      } else {
        router.push('/dashboard/pendente');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro na autenticação';
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
            <span>Acesso Seguro Criptografado</span>
          </div>
          <h1 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory tracking-wide">
            Portal Lumiardi
          </h1>
          <p className="text-xs text-ivory/60 font-sans leading-relaxed">
            Informe suas credenciais para acessar os módulos e recursos da plataforma.
          </p>
        </div>

        {/* Alternador de Perfil */}
        <div className="flex bg-[#161616] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setRole('criadora');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-sans font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'criadora'
                ? 'bg-gold text-black-matte font-semibold shadow-md'
                : 'text-ivory/60 hover:text-ivory'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Acesso Modelo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('agencia');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-sans font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'agencia'
                ? 'bg-gold text-black-matte font-semibold shadow-md'
                : 'text-ivory/60 hover:text-ivory'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Acesso Agência</span>
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
              {role === 'criadora' ? 'E-mail Cadastrado' : 'E-mail Corporativo'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'criadora' ? 'seu.email@exclusivo.com' : 'contato@suaagencia.com'}
                className="w-full pl-9 pr-4 py-3 bg-[#161616] border border-white/10 text-xs md:text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-sans uppercase tracking-wider text-ivory/70">
                Senha de Acesso
              </label>
              <span className="text-[10px] text-bronze uppercase tracking-wider">
                Criptografada
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <span>{loading ? 'Validando Credenciais...' : 'Acessar Ambiente Seguro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Links de Criação de Conta */}
        <div className="pt-4 border-t border-white/10 text-center space-y-2">
          <span className="text-xs font-sans text-ivory/50 block">
            Ainda não possui credencial verificada?
          </span>
          <div className="flex items-center justify-center gap-4 text-xs font-sans">
            <Link
              href="/qualificacao"
              className="text-gold hover:underline uppercase tracking-wider font-medium"
            >
              Cadastrar como Modelo →
            </Link>
            <span className="text-ivory/30">•</span>
            <Link
              href="/qualificacao/agencia"
              className="text-gold hover:underline uppercase tracking-wider font-medium"
            >
              Credenciar Agência →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col justify-between selection:bg-gold selection:text-black-matte">
      <Header />

      <section className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center py-20 text-gold font-serif-lumiardi">Carregando portal seguro...</div>}>
          <LoginForm />
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}
