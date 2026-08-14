'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Lock, ShieldCheck, Database, Key } from 'lucide-react';
import Link from 'next/link';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-24 max-w-4xl mx-auto px-6 md:px-8 space-y-12">
        {/* Cabeçalho */}
        <div className="text-center space-y-4 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[10px] font-sans uppercase tracking-[0.3em]">
            <Lock className="w-3.5 h-3.5" />
            <span>Privacidade & Proteção de Dados</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl font-light text-ivory tracking-tight">
            Política de Privacidade (LGPD & GDPR)
          </h1>
          <p className="text-xs font-sans text-ivory/60 uppercase tracking-widest font-mono">
            Conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e GDPR EU 2016/679
          </p>
        </div>

        {/* Conteúdo Jurídico */}
        <div className="space-y-8 text-sm text-ivory/80 font-light leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              1. Compromisso com o Sigilo Absoluto
            </h2>
            <p>
              A Lumiardi foi arquitetada sobre o princípio de <em>Privacy by Design</em>. Todos os dados pessoais, fotos de book em alta resolução, contratos societários e dados de faturamento são armazenados em bancos de dados criptografados em repouso com algoritmo AES-256 e transmitidos exclusivamente via TLS 1.3.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              2. Coleta e Tratamento de Dados Biométricos (KYC)
            </h2>
            <p>
              Para cumprimento de exigências regulatórias internacionais relativas a conteúdo adulto e prevenção de fraudes, a Lumiardi processa dados biométricos faciais (Liveness Check) estritamente durante o ato de credenciamento. Esses dados são processados por parceiros certificados (SOC-2 Type II e ISO 27001) e nunca são comercializados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              3. Armazenamento e Exclusão de Dados
            </h2>
            <p>
              O titular dos dados tem o direito de solicitar a exportação ou exclusão definitiva de sua conta a qualquer momento por meio do canal direto da Curadoria (`curadoria@lumiardi.com`), ressalvadas as obrigações legais de guarda fiscal e conformidade da seção 2257.
            </p>
          </section>
        </div>

        {/* Links Rápidos */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-xs">
          <div className="flex gap-4">
            <Link href="/termos" className="text-[#C9A96B] hover:underline">
              ← Termos de Uso
            </Link>
            <Link href="/compliance-2257" className="text-[#C9A96B] hover:underline">
              Conformidade 18 U.S.C. § 2257 →
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 transition-all font-semibold uppercase tracking-wider"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
