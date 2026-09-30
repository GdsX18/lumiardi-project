'use client';

import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, X, XCircle } from 'lucide-react';

export type AdminNoticeType = 'success' | 'warning' | 'error';

interface AdminNoticeProps {
  type: AdminNoticeType;
  message: string;
  onClose: () => void;
  /** Tempo até fechar sozinho (ms). Padrão: 5 s. */
  durationMs?: number;
  /** `toast`: flutuante no canto superior direito. `inline`: banner dentro do fluxo da página. */
  variant?: 'toast' | 'inline';
}

const STYLES: Record<AdminNoticeType, { box: string; icon: React.ReactNode }> = {
  success: {
    box: 'bg-[#111827] border-emerald-500 text-emerald-300',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  },
  warning: {
    box: 'bg-[#1f1a0f] border-amber-500 text-amber-300',
    icon: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />,
  },
  error: {
    box: 'bg-[#1f1315] border-rose-500 text-rose-300',
    icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  },
};

/**
 * Aviso de ação da Mesa de Curadoria: fecha sozinho em 5 s (ou no botão X) e não anima em loop.
 * O timer depende só da mensagem — re-renders do pai não o reiniciam — e é cancelado ao desmontar
 * ou quando uma nova mensagem substitui a anterior.
 */
export function AdminNotice({ type, message, onClose, durationMs = 5000, variant = 'toast' }: AdminNoticeProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [message, type, durationMs]);

  const { box, icon } = STYLES[type];
  const position =
    variant === 'toast' ? 'shadow-2xl pointer-events-auto max-w-sm' : 'w-full';

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`${box} ${position} border px-4 py-3 text-xs font-sans flex items-start gap-2 rounded-sm animate-in fade-in duration-200`}
    >
      <span className="mt-0.5">{icon}</span>
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        className="shrink-0 -mr-1 p-0.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
