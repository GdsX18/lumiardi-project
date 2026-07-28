'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const PinnedHeroCards: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !card1Ref.current || !card2Ref.current || !card3Ref.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Card 1 começa visível. Card 2 e 3 começam abaixo.
      gsap.set(card1Ref.current, { yPercent: 0, opacity: 1 });
      gsap.set(card2Ref.current, { yPercent: 120, opacity: 0 });
      gsap.set(card3Ref.current, { yPercent: 120, opacity: 0 });

      // Passo 1: Card 1 sobe e desaparece. Card 2 entra.
      tl.to(
        card1Ref.current,
        {
          yPercent: -120,
          opacity: 0,
          ease: 'power2.inOut',
        },
        0.5
      ).to(
        card2Ref.current,
        {
          yPercent: 0,
          opacity: 1,
          ease: 'power2.out',
        },
        0.5
      );

      // Passo 2: Card 2 sobe e desaparece. Card 3 entra.
      tl.to(
        card2Ref.current,
        {
          yPercent: -120,
          opacity: 0,
          ease: 'power2.inOut',
        },
        1.2
      ).to(
        card3Ref.current,
        {
          yPercent: 0,
          opacity: 1,
          ease: 'power2.out',
        },
        1.2
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative w-full h-screen flex flex-col justify-center items-center py-12 overflow-hidden bg-[#0B0B0B]">
      <div className="max-w-4xl lg:max-w-5xl mx-auto w-full px-6 relative h-[400px] md:h-[440px] flex items-center justify-center">
        {/* Card 1 */}
        <div
          ref={card1Ref}
          className="absolute inset-0 w-full h-full flex flex-col justify-between z-10 pointer-events-auto"
        >
          <div className="h-full border-2 border-gold/60 bg-[#0E0E0E] shadow-[0_0_40px_rgba(201,169,107,0.15)] p-8 md:p-10 lg:p-12 flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif-lumiardi text-3xl md:text-4xl font-light text-gold tracking-widest">
                  01
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-gold/80 border border-gold/30 px-3.5 py-1 font-sans">
                  EXCLUSIVO
                </span>
              </div>
              <h3 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory tracking-tight mb-2">
                Criadores Premium
              </h3>
              <p className="text-xs md:text-sm text-gold uppercase tracking-[0.25em] font-sans font-medium mb-4">
                QUALIFICAÇÃO & SEGURANÇA
              </p>
            </div>
            <p className="text-sm md:text-base text-ivory/85 font-sans font-light leading-relaxed max-w-3xl">
              Curadoria rigorosa, preservação da identidade privada e posicionamento estratégico ao lado das maiores marcas de luxo do mundo.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div
          ref={card2Ref}
          className="absolute inset-0 w-full h-full flex flex-col justify-between z-20 pointer-events-auto"
        >
          <div className="h-full border-2 border-bronze/60 bg-[#121212] shadow-[0_0_40px_rgba(169,119,69,0.15)] p-8 md:p-10 lg:p-12 flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif-lumiardi text-3xl md:text-4xl font-light text-gold tracking-widest">
                  02
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-gold/80 border border-gold/30 px-3.5 py-1 font-sans">
                  PLATAFORMA
                </span>
              </div>
              <h3 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory tracking-tight mb-2">
                Lumiardi
              </h3>
              <p className="text-xs md:text-sm text-gold uppercase tracking-[0.25em] font-sans font-medium mb-4">
                TECNOLOGIA & MEDIAÇÃO
              </p>
            </div>
            <p className="text-sm md:text-base text-ivory/85 font-sans font-light leading-relaxed max-w-3xl">
              Plataforma de alta tecnologia financeira e contratual. Intermediamos conexões de alto nível com transparência total de receita.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div
          ref={card3Ref}
          className="absolute inset-0 w-full h-full flex flex-col justify-between z-30 pointer-events-auto"
        >
          <div className="h-full border-2 border-black-matte bg-[#F7F3EC] text-black-matte shadow-2xl p-8 md:p-10 lg:p-12 flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif-lumiardi text-3xl md:text-4xl font-light text-bronze tracking-widest">
                  03
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-black-matte/80 border border-black-matte/30 px-3.5 py-1 font-sans">
                  GESTÃO DE ELITE
                </span>
              </div>
              <h3 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-black-matte tracking-tight mb-2">
                Agências de Elite
              </h3>
              <p className="text-xs md:text-sm text-bronze uppercase tracking-[0.25em] font-sans font-semibold mb-4">
                GESTÃO CORPORATIVA
              </p>
            </div>
            <p className="text-sm md:text-base text-black-matte/85 font-sans font-light leading-relaxed max-w-3xl">
              Acesso exclusivo a talentos verificados, ferramentas Kanban compartilhadas e ambiente de videoconferência de alta definição.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


