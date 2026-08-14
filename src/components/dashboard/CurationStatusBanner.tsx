'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock, CheckCircle2, FileCheck, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export const CurationStatusBanner: React.FC = () => {
  const { curationStatus, setCurationStatus, role, activeCreator, activeAgency } = useAuthPortal();

  const isApproved = curationStatus === 'APROVADO' || curationStatus === 'approved';

  const handleToggle = async () => {
    if (!isApproved) {
      await fetch('/api/curation/approve', { method: 'POST' });
      setCurationStatus('APROVADO');
    } else {
      setCurationStatus('EM_CURATORIA');
    }
  };

  return (
    <div className="w-full mb-6">
      <div
        className={cn(
          'p-4 md:p-5 border transition-all duration-300 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4',
          isApproved
            ? 'bg-[#0E150F] border-emerald-500/30 text-ivory'
            : 'bg-[#18120B] border-gold/40 text-ivory'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-10 h-10 border flex items-center justify-center shrink-0 mt-0.5',
              isApproved
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-gold/10 border-gold/40 text-gold'
            )}
          >
            {isApproved ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5 animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={isApproved ? 'gold' : 'bronze'}>
                {isApproved ? 'STATUS: ACREDITADO & APROVADO' : 'STATUS: EM CURADORIA LUMIARDI'}
              </Badge>
              <span className="text-[10px] font-sans tracking-widest uppercase text-ivory/50">
                {role === 'criadora' ? 'Perfil Criadora VIP' : 'Agência Credenciada'} · ID: #{role === 'criadora' ? (activeCreator?.id || 'CR-9042') : (activeAgency?.id || 'AG-8821')}
              </span>
            </div>

            <p className="text-xs md:text-sm font-sans text-ivory/80 leading-relaxed max-w-2xl">
              {isApproved
                ? 'Sua credencial exclusiva foi validada pela mesa de curadoria internacional Lumiardi. Acesso total e irrestrito ao ecossistema de contratações e tráfego seguro liberado.'
                : 'Documentos e respostas da pré-entrevista recebidos. Nossa equipe de curadores e compliance está auditando o perfil para liberação de contratos.'}
            </p>

            {/* Checklist de Curadoria */}
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-2 border-t border-white/[0.08] text-[11px] font-sans text-ivory/60">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Documentos Verificados
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <FileCheck className="w-3.5 h-3.5" /> Pré-Entrevista Analisada
              </span>
              <span className={cn('flex items-center gap-1', isApproved ? 'text-emerald-400' : 'text-gold')}>
                <Calendar className="w-3.5 h-3.5" /> {isApproved ? 'Entrevista Realizada' : 'Entrevista Agendada'}
              </span>
            </div>
          </div>
        </div>

        {/* Simulador de Fluxo de Curadoria (Item 2C do Requisito) */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 bg-black/50 p-2 border border-white/10">
          <span className="text-[10px] font-sans uppercase tracking-widest text-ivory/50 hidden sm:inline">
            Simulador de Curadoria:
          </span>
          <button
            onClick={handleToggle}
            className={cn(
              'px-3 py-1.5 text-[10px] font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all cursor-pointer border',
              isApproved
                ? 'bg-gold/10 border-gold/40 text-gold hover:bg-gold hover:text-black-matte'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-black-matte'
            )}
          >
            <RefreshCw className="w-3 h-3" />
            {isApproved ? 'Alternar p/ Em Curadoria' : 'Aprovar Imediatamente'}
          </button>
        </div>
      </div>
    </div>
  );
};
