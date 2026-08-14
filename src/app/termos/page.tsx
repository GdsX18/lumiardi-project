'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Shield, Lock, Scale, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-24 max-w-4xl mx-auto px-6 md:px-8 space-y-12">
        {/* Cabeçalho */}
        <div className="text-center space-y-4 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[10px] font-sans uppercase tracking-[0.3em]">
            <Scale className="w-3.5 h-3.5" />
            <span>Documentação Jurídica & Compliance</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl font-light text-ivory tracking-tight">
            Termos e Condições de Uso
          </h1>
          <p className="text-xs font-sans text-ivory/60 uppercase tracking-widest font-mono">
            Última atualização: Agosto de 2026 · Versão 2.4 Oficial
          </p>
        </div>

        {/* Conteúdo Jurídico */}
        <div className="space-y-8 text-sm text-ivory/80 font-light leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              1. Natureza do Ecossistema Lumiardi
            </h2>
            <p>
              A <strong>LUMIARDI TECHNOLOGIES S.A.</strong> opera como uma infraestrutura tecnológica exclusiva de conexão, curadoria, gestão e blindagem contratual entre criadoras de conteúdo independentes (+18) e agências corporativas de casting e assessoria devidamente credenciadas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              2. Elegibilidade e Verificação de Maioridade (+18)
            </h2>
            <p>
              O acesso à plataforma é restrito a indivíduos civilmente capazes com idade igual ou superior a <strong>18 (dezoito) anos completos</strong>. A homologação da conta está condicionada à aprovação documental por prova de vida biométrica 3D e validação de documento emitido pelo governo (Passaporte, CNH ou RG oficial).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              3. Proteção de Imagem, Direitos Autorais & NDA
            </h2>
            <p>
              Todos os materiais fotográficos, audiovisuais e documentos disponibilizados no <em>Lumiardi Drive</em> são protegidos por criptografia de ponta a ponta e marcas d'água dinâmicas tokenizadas. É expressamente proibida a reprodução, vazamento, comercialização ou distribuição não autorizada de qualquer ativo de mídia de criadoras sob pena de processo cível e criminal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              4. Pagamentos, Assinaturas e Modelo Escrow
            </h2>
            <p>
              Os pagamentos de assinaturas de acesso e cotas de serviços são processados via gateways certificados de alto risco (CCBill para moeda fiduciária) e NOWPayments (para ativos digitais/criptoativos). Repasses de campanhas entre agências e modelos contam com retenção garantida por *Escrow Shield* até a entrega comprovada das tarefas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif-lumiardi text-2xl text-[#C9A96B] font-normal">
              5. Foro de Eleição e Legislação Aplicável
            </h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil e pelas diretrizes de compliance internacional de comércio eletrônico. Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer litígios oriundos deste contrato.
            </p>
          </section>
        </div>

        {/* Links Rápidos de Navegação Legal */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-xs">
          <div className="flex gap-4">
            <Link href="/privacidade" className="text-[#C9A96B] hover:underline">
              Política de Privacidade (LGPD/GDPR) →
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
