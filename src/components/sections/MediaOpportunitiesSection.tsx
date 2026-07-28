'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Rocket, Building2, Users, Handshake, Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const MediaOpportunitiesSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const opportunities = [
    {
      icon: <Rocket className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      title: 'Lançamentos da Plataforma',
      subtitle: 'Inovação e Mídia Exclusiva',
      desc: 'Divulgação estratégica de novas atualizações de produto, recursos contratuais e ferramentas corporativas de alta tecnologia.',
      colSpan: 'lg:col-span-7',
    },
    {
      icon: <Building2 className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      title: 'Aquisição de Agências',
      subtitle: 'Expansão de Rede de Elite',
      desc: 'Programas de integração rápida para agências de gestão com histórico comprovado de profissionalismo e ética.',
      colSpan: 'lg:col-span-5',
    },
    {
      icon: <Users className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      title: 'Recrutamento de Criadores',
      subtitle: 'Talentos Selecionados',
      desc: 'Campanhas institucionais focadas na atração de criadores premium que buscam discrição, valor de marca e segurança.',
      colSpan: 'lg:col-span-5',
    },
    {
      icon: <Handshake className="w-5 h-5 stroke-[1.2] text-[#8C6B2F]" />,
      title: 'Alianças Estratégicas',
      subtitle: 'Parcerias Institucionais',
      desc: 'Conexões corporativas com provedores de tecnologia financeira, consultorias jurídicas internacionais e marcas de luxo.',
      colSpan: 'lg:col-span-7',
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current.querySelectorAll('.opp-card'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="midia"
      className="w-full bg-[#F7F3EC] text-[#0B0B0B] py-24 md:py-36 relative overflow-hidden"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium">
            <Sparkles className="w-4 h-4 stroke-[1.2]" />
            <span>EXPANSÃO ECOSSISTÊMICA</span>
          </div>

          <h2 className="font-serif-lumiardi text-5xl sm:text-7xl md:text-8xl font-light text-[#0B0B0B] tracking-tight leading-[0.95]">
            Parcerias com propósito.
          </h2>

          <p className="text-lg md:text-2xl text-[#0B0B0B]/80 font-sans font-light leading-relaxed max-w-2xl">
            Oportunidades de mídia, co-marketing e desenvolvimento estratégico estruturadas para acelerar o ecossistema.
          </p>
        </div>

        {/* Asymmetric Opportunities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {opportunities.map((item) => (
            <div
              key={item.title}
              className={`opp-card ${item.colSpan} bg-white border border-[#0B0B0B]/10 p-8 md:p-12 shadow-lg hover:border-[#C9A96B] transition-all duration-500 flex flex-col justify-between`}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[#C9A96B]/15 border border-[#C9A96B]/30 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#A97745] font-sans font-semibold block">
                    {item.subtitle}
                  </span>
                  <h3 className="font-serif-lumiardi text-2xl md:text-3xl font-light text-[#0B0B0B] mt-1">
                    {item.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm md:text-base text-[#0B0B0B]/80 font-sans font-light leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
