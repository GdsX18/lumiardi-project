'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { ShieldCheck, FileCheck2, Scale } from 'lucide-react';
import Link from 'next/link';

export default function Compliance2257Page() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-24 max-w-4xl mx-auto px-6 md:px-8 space-y-12">
        {/* Cabeçalho */}
        <div className="text-center space-y-4 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[10px] font-sans uppercase tracking-[0.3em]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Regulamentação Internacional de Mídia</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl font-light text-ivory tracking-tight">
            Declaração de Custódia de Registros — 18 U.S.C. § 2257
          </h1>
          <p className="text-xs font-sans text-ivory/60 uppercase tracking-widest font-mono">
            Record-Keeping Requirements & Compliance Statement
          </p>
        </div>

        {/* Conteúdo Jurídico */}
        <div className="space-y-8 text-sm text-ivory/80 font-light leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              1. Declaração de Guarda e Custódia de Registros
            </h2>
            <p>
              Em estrita conformidade com o Título 18 do Código dos Estados Unidos, Seção 2257 (18 U.S.C. § 2257) e com o Código de Regulamentos Federais 28 C.F.R. Parte 75, a <strong>LUMIARDI TECHNOLOGIES S.A.</strong> declara que todos os modelos, criadoras e participantes de conteúdos audiovisuais ou fotográficos exibidos ou agenciados na plataforma possuíam no mínimo 18 (dezoito) anos de idade na data da respectiva produção ou cadastro.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              2. Localização e Custódia dos Registros Físicos e Digitais
            </h2>
            <p>
              Os registros documentais originais, cópias autenticadas de documentos governamentais de identificação com foto e registros biométricos de data de nascimento são mantidos em custódia segura pelo Custodiante de Registros Oficial da Lumiardi.
            </p>
            <div className="p-4 bg-[#141414] border border-white/10 space-y-1 text-xs font-mono text-ivory/70">
              <p><strong>Custodiante Designado:</strong> Lumiardi Compliance & Legal Affairs Department</p>
              <p><strong>Endereço de Contato:</strong> Av. Brigadeiro Faria Lima, São Paulo - SP, Brasil</p>
              <p><strong>E-mail de Notificações Oficiais:</strong> compliance@lumiardi.com</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              3. Isenção e Mídia Secundária
            </h2>
            <p>
              Para materiais produzidos por terceiros ou agências credenciadas em que a Lumiardi atue como mera intermediária de hospedagem segura (Safe Harbor), os registros primários de produção permanecem sob custódia legal do produtor original ou da agência contratante.
            </p>
          </section>
        </div>

        {/* Links Rápidos */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-xs">
          <div className="flex gap-4">
            <Link href="/termos" className="text-[#C9A96B] hover:underline">
              ← Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-[#C9A96B] hover:underline">
              Política de Privacidade →
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
