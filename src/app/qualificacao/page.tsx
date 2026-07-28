'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { QualificationSteps } from '@/components/sections/QualificationSteps';
import { RevealText } from '@/components/animations/RevealText';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, ShieldCheck, UserCheck, Lock } from 'lucide-react';

export default function QualificacaoPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black-matte text-ivory font-sans">
      <Header />

      {/* Hero da Página de Qualificação */}
      <section className="pt-36 pb-16 bg-[#0B0B0B] border-b border-bronze/20">
        <div className="max-w-4xl mx-auto text-center px-6 space-y-6">
          <Badge variant="gold">PROCESSO SELETIVO DE ELITE</Badge>
          <RevealText
            text="A entrada começa com qualificação."
            as="h1"
            className="font-serif-lumiardi text-4xl md:text-6xl font-light text-ivory"
          />
          <p className="text-sm md:text-base text-ivory/70 font-sans max-w-2xl mx-auto leading-relaxed">
            A Lumiardi mantém um padrão rigoroso de curadoria para garantir a segurança dos criadores e a idoneidade das agências parceiras.
          </p>

          <QualificationSteps currentStep={1} />
        </div>
      </section>

      {/* Seção Identidade e Intenção na Entrevista Inicial (Fundo Marfim Quente #F7F3EC) */}
      <SectionWrapper bg="light">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-bronze font-semibold">
              Etapa 01 & 02 — Avaliação de Perfil
            </span>
            <h2 className="font-serif-lumiardi text-3xl md:text-5xl text-black-matte">
              Identidade e Intenção na Entrevista Inicial
            </h2>
            <p className="text-sm text-black-matte/70 max-w-xl mx-auto">
              Avaliação de alinhamento com a linguagem visual de luxo silencioso e verificação de idade e documentos corporativos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="p-8 bg-white border border-black-matte/10 space-y-4">
              <div className="p-3 bg-bronze/10 w-fit text-bronze">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif-lumiardi text-2xl font-medium text-black-matte">
                01. Validação de Idade +18
              </h3>
              <p className="text-xs text-black-matte/75 leading-relaxed font-sans">
                Verificação biométrica e documental criptografada. Nenhum dado sensível é compartilhado publicamente ou exposto a terceiros.
              </p>
            </div>

            <div className="p-8 bg-white border border-black-matte/10 space-y-4">
              <div className="p-3 bg-bronze/10 w-fit text-bronze">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif-lumiardi text-2xl font-medium text-black-matte">
                02. Entrevista Qualificada
              </h3>
              <p className="text-xs text-black-matte/75 leading-relaxed font-sans">
                Diálogo direto com curadores da rede para alinhar expectativas de receita, limites contratuais e metas de posicionamento.
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Seção Comunicação e Presença Digital (Fundo Preto Fosco #0B0B0B) */}
      <SectionWrapper bg="dark">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
              Cultura & Padrões
            </span>
            <h2 className="font-serif-lumiardi text-3xl md:text-5xl text-ivory">
              Comunicação e Presença Digital
            </h2>
            <p className="text-sm text-ivory/60 max-w-xl mx-auto">
              Critérios estéticos exigidos para manter a harmonia e o valor de marca do ecossistema Lumiardi.
            </p>
          </div>

          <div className="p-8 bg-[#0E0E0E] border border-bronze/30 space-y-6">
            <div className="flex items-center gap-3 border-b border-bronze/20 pb-4">
              <Lock className="w-5 h-5 text-gold" />
              <span className="font-serif-lumiardi text-xl text-ivory">
                Checklist de Elegância Digital
              </span>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-ivory/80">
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>Portfólio com iluminação natural e fotografia autoral</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>Postura profissional no atendimento às agências</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>Respeito estrito aos acordos de confidencialidade</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gold font-bold">•</span>
                <span>Uso exclusivo dos canais oficiais da plataforma</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => router.push('/qualificacao/limites')}
            >
              Avançar para Limites & Rotina
            </Button>
          </div>
        </div>
      </SectionWrapper>

      <Footer />
    </main>
  );
}
