'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  ShieldCheck,
  HardDrive,
  X,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  planName: string;
  currentPeriodEnd: string;
  storageGB: number;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  currentPeriodEnd,
  storageGB,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const formattedDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'o fim do ciclo de 30 dias';

  const handleCancelClick = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#0E0E0E] border border-gold/40 p-6 md:p-8 max-w-lg w-full text-ivory shadow-2xl space-y-6 relative rounded-sm my-8"
          >
            {/* Fechar */}
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 text-ivory/50 hover:text-gold transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-sans uppercase tracking-[0.25em] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Programação de Cancelamento</span>
              </div>
              <h3 className="font-serif-lumiardi text-2xl md:text-3xl font-light text-ivory">
                Deseja cancelar a renovação automática?
              </h3>
            </div>

            {/* Card Explicativo de Garantia de Uso até o Final do Mês */}
            <div className="p-4 bg-[#141414] border border-gold/30 rounded-xs space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-sans font-semibold text-gold block uppercase tracking-wider">
                    Acesso Total Garantido até {formattedDate}
                  </span>
                  <p className="text-xs text-ivory/80 font-sans leading-relaxed">
                    Como o seu período atual já foi quitado, <strong>você continuará usufruindo de 100% dos benefícios do Plano {planName}</strong> sem nenhuma interrupção até {formattedDate}.
                  </p>
                </div>
              </div>

              {/* Lista do que continua funcionando */}
              <div className="pt-2 border-t border-white/10 space-y-2 text-xs font-sans text-ivory/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Seus {storageGB} GB de arquivos e fotos RAW protegidos no Drive</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recebimento de propostas e chat ativo com agências</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nenhuma cobrança surpresa após {formattedDate}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-ivory/50 font-sans leading-relaxed italic">
              * Você poderá reativar a renovação automática a qualquer momento com apenas 1 clique no painel antes ou após o término do ciclo.
            </p>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:flex-1 py-3 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manter Minha Assinatura</span>
              </button>

              <button
                type="button"
                onClick={handleCancelClick}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-3 bg-transparent hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-600/40 hover:border-rose-500 text-xs font-sans uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
