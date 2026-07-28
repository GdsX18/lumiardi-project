'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#050505] text-ivory pt-24 pb-16 border-t border-gold/15 relative overflow-hidden">
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24 flex flex-col items-center">
        {/* Logo Combinada */}
        <div className="relative w-56 md:w-72 h-20 mb-8">
          <Image
            src="/LUMIARDI - Logo Combinada trasparente.png"
            alt="LUMIARDI Marca Completa"
            fill
            className="object-contain"
          />
        </div>

        <p className="text-center font-serif-lumiardi italic text-[#C9A96B] text-xl md:text-2xl max-w-lg mb-12 font-light">
          &ldquo;Luxo silencioso. Propósito claro.&rdquo;
        </p>

        {/* Links de Navegação */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-14 mb-16">
          <Link href="/#posicionamento" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            Posicionamento
          </Link>
          <Link href="/#pilares" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            Pilares da Marca
          </Link>
          <Link href="/#receita" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            Modelo de Receita
          </Link>
          <Link href="/#dashboard-showcase" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            Dashboard
          </Link>
          <Link href="/#planos" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            Planos
          </Link>
          <Link href="/qualificacao" className="text-xs tracking-[0.3em] uppercase text-ivory/60 hover:text-gold transition-colors font-sans font-light">
            Qualificação
          </Link>
        </div>

        <div className="w-full h-[1px] bg-white/10 mb-10" />

        {/* Rodapé inferior editorial */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ivory/40 font-sans tracking-widest font-light">
          <span>© {new Date().getFullYear()} LUMIARDI. Todos os direitos reservados.</span>
          <span className="font-serif-lumiardi italic text-[#C9A96B]/80 text-sm">Plataforma Global & Exclusiva</span>
          <span>Tecnologia Premium & Governança de Elite</span>
        </div>
      </div>
    </footer>
  );
};
