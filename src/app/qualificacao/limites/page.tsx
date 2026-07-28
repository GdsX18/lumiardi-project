'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { QualificationSteps } from '@/components/sections/QualificationSteps';
import { RevealText } from '@/components/animations/RevealText';
import { FadeIn } from '@/components/animations/FadeIn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MessageSquare, Kanban, Video, ArrowRight } from 'lucide-react';

export default function LimitesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black-matte text-ivory font-sans">
      <Header />

      {/* Stepper no topo */}
      <section className="pt-36 pb-10 bg-[#0B0B0B] border-b border-bronze/20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <QualificationSteps currentStep={2} />
        </div>
      </section>

      {/* Seção Principal: Limites, rotina e desempenho (Fundo Marfim Quente #F7F3EC) */}
      <SectionWrapper bg="light">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-bronze font-semibold">
            Metodologia Operacional
          </span>
          <RevealText
            text="Limites, rotina e desempenho."
            as="h1"
            className="font-serif-lumiardi text-4xl md:text-6xl text-black-matte"
          />
          <p className="text-sm md:text-base text-black-matte/75 max-w-2xl mx-auto leading-relaxed">
            Estabeleça fronteiras profissionais claras e gerencie seu fluxo diário com ferramentas desenvolvidas especificamente para proteger o tempo e a privacidade dos criadores.
          </p>
        </div>
      </SectionWrapper>

      {/* Subseção: O trabalho acontece dentro da plataforma (Fundo Preto Fosco #0B0B0B) */}
      <SectionWrapper bg="dark">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
              Ambiente Integrado
            </span>
            <h2 className="font-serif-lumiardi text-3xl md:text-5xl text-ivory">
              O trabalho acontece dentro da plataforma
            </h2>
            <p className="text-sm text-ivory/60 max-w-xl mx-auto">
              Sem necessidade de expor aplicativos pessoais, números de telefone ou contas de redes sociais privadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn direction="up" delay={0.1}>
              <Card number="01" title="Chat Interno" variant="dark" className="h-full">
                <div className="my-4 text-gold">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-xs text-ivory/70 leading-relaxed font-sans">
                  Mensagens criptografadas de ponta a ponta com histórico auditável, envio de arquivos pesados e controle de disponibilidade.
                </p>
              </Card>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <Card number="02" title="Organização Trello-like" variant="gold-border" className="h-full">
                <div className="my-4 text-gold">
                  <Kanban className="w-8 h-8" />
                </div>
                <p className="text-xs text-ivory/70 leading-relaxed font-sans">
                  Quadros Kanban para gestão de entregas, acompanhamento de sessões fotográficas e datas de campanhas em tempo real.
                </p>
              </Card>
            </FadeIn>

            <FadeIn direction="up" delay={0.3}>
              <Card number="03" title="Meet Integrado" variant="dark" className="h-full">
                <div className="my-4 text-gold">
                  <Video className="w-8 h-8" />
                </div>
                <p className="text-xs text-ivory/70 leading-relaxed font-sans">
                  Videoconferências nativas de alta definição para reuniões de alinhamento com agências sem sair do navegador.
                </p>
              </Card>
            </FadeIn>
          </div>

          <div className="flex justify-center pt-8">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => router.push('/dashboard')}
            >
              Experimentar Dashboard Simulado
            </Button>
          </div>
        </div>
      </SectionWrapper>

      <Footer />
    </main>
  );
}
