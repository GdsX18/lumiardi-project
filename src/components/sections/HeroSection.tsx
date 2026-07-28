'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import { ArrowUpRight, ShieldCheck, Globe, Sparkles, UserCheck, Lock } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const router = useRouter();

  return (
    <div id="hero" className="w-full bg-[#0B0B0B] text-ivory">
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc="/hero-video.mp4"
        useShaderBg={true}
        title="LUMIARDI ECOSYSTEM"
        date="PLATAFORMA GLOBAL & EXCLUSIVA"
        scrollToExpand="ROLE PARA EXPANDIR E DESCOBRIR"
        textBlend={false}
      >
        {/* Conteúdo revelado após expansão completa */}
        <div className="w-full min-h-screen bg-[#0B0B0B] text-ivory flex flex-col justify-center items-center px-6 md:px-16 lg:px-24 py-24 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A96B]/5 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-6xl mx-auto w-full flex flex-col items-center text-center space-y-10 relative z-10">
            {/* Tag Subtil */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-gold/30 bg-gold/5 text-gold text-xs font-sans tracking-[0.3em] uppercase">
              <Sparkles className="w-3.5 h-3.5 stroke-[1.2]" />
              <span>TECNOLOGIA DE LUXO & GOVERNANÇA DE ELITE</span>
            </div>

            {/* Título de Impacto Editorial */}
            <h1 className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-ivory tracking-tight leading-[1.05] max-w-5xl">
              O ponto de encontro entre <span className="text-[#C9A96B] italic font-normal">privacidade</span>, escala e reputação.
            </h1>

            {/* Texto de Apoio Editorial */}
            <p className="font-sans text-base md:text-xl text-ivory/70 font-light leading-relaxed max-w-3xl">
              Infraestrutura tecnológica global que conecta os maiores talentos da economia de criadores a agências de gestão corporativa de elite sob rígidos padrões de sigilo e compliance.
            </p>

            {/* CTAs Assimétricos de Ação */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pt-4 w-full sm:w-auto">
              <button
                onClick={() => router.push('/qualificacao')}
                className="w-full sm:w-auto px-8 py-4 bg-[#C9A96B] text-[#0B0B0B] font-sans text-xs md:text-sm tracking-[0.25em] uppercase font-medium hover:bg-[#D4B87A] transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer shadow-lg hover:shadow-gold/20"
              >
                <UserCheck className="w-4 h-4 stroke-[1.2]" />
                <span>MODELOS +18 / QUALIFICAR</span>
                <ArrowUpRight className="w-4 h-4 stroke-[1.2] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-ivory/30 text-ivory font-sans text-xs md:text-sm tracking-[0.25em] uppercase font-light hover:border-gold hover:text-gold transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <Lock className="w-4 h-4 stroke-[1.2]" />
                <span>AGÊNCIAS DE ELITE / ACESSO</span>
                <ArrowUpRight className="w-4 h-4 stroke-[1.2] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* Tópicos de Garantia Institucional */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-white/10 w-full text-left">
              <div className="flex items-start gap-4">
                <div className="p-3 border border-gold/20 bg-gold/5 text-gold shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[1.2]" />
                </div>
                <div>
                  <h4 className="font-serif-lumiardi text-xl font-normal text-ivory">Sigilo Absoluto</h4>
                  <p className="font-sans text-xs text-ivory/60 font-light mt-1 leading-relaxed">
                    Criptografia militar e gestão de dados com anonimato total garantido.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 border border-gold/20 bg-gold/5 text-gold shrink-0">
                  <Globe className="w-5 h-5 stroke-[1.2]" />
                </div>
                <div>
                  <h4 className="font-serif-lumiardi text-xl font-normal text-ivory">Rede Internacional</h4>
                  <p className="font-sans text-xs text-ivory/60 font-light mt-1 leading-relaxed">
                    Conexão direta entre hubs em São Paulo, Londres, Paris e Nova York.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 border border-gold/20 bg-gold/5 text-gold shrink-0">
                  <Sparkles className="w-5 h-5 stroke-[1.2]" />
                </div>
                <div>
                  <h4 className="font-serif-lumiardi text-xl font-normal text-ivory">Qualificação Rigorosa</h4>
                  <p className="font-sans text-xs text-ivory/60 font-light mt-1 leading-relaxed">
                    Apenas perfis e agências auditados acessam o ambiente de oportunidades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollExpandMedia>
    </div>
  );
};
