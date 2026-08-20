import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-[#0B0B0B] text-ivory flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      {/* Luzes de fundo sutis */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/Lumiardi logo2-Trasparente.png"
            alt="Lumiardi"
            width={120}
            height={40}
            className="h-10 w-auto object-contain opacity-90"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs font-mono uppercase tracking-widest">
          <Compass className="w-3.5 h-3.5" />
          <span>404 — Página Não Encontrada</span>
        </div>

        <h1 className="font-serif-lumiardi text-4xl md:text-5xl font-light text-ivory leading-tight">
          Destino <span className="text-gold italic">Inexistente</span>
        </h1>

        <p className="text-sm font-sans text-ivory/60 leading-relaxed">
          A página ou recurso solicitado não foi encontrado no ecossistema Lumiardi ou foi movido com segurança.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold hover:bg-gold-light text-black-matte font-sans font-semibold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(201,169,107,0.2)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retornar ao Início</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#141414] hover:bg-[#1A1A1A] text-ivory border border-white/10 hover:border-gold/40 font-sans font-medium text-xs uppercase tracking-widest transition-all duration-300"
          >
            <span>Acessar Portal</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
