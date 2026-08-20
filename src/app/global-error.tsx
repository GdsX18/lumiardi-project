'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR" className="h-full bg-[#0B0B0B]">
      <body className="h-full flex items-center justify-center p-6 bg-[#0B0B0B] text-[#F5F5F0] font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-mono uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Erro Global de Sistema</span>
          </div>

          <h1 className="text-3xl font-light text-[#F5F5F0]">
            LUMIARDI <span className="text-[#C9A96B] italic">Proteção</span>
          </h1>

          <p className="text-sm text-[#F5F5F0]/60 leading-relaxed">
            Uma falha crítica foi interceptada. Seus dados de acesso e transações permanecem seguros.
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A96B] text-[#0B0B0B] font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar Plataforma</span>
          </button>
        </div>
      </body>
    </html>
  );
}
