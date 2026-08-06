'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Star, Globe, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreatorBenefitsModalProps {
  open: boolean;
  onClose: () => void;
}

const benefits = [
  { icon: ShieldCheck, text: 'Sigilo absoluto e proteção de identidade garantida' },
  { icon: Star, text: 'Perfil verificado visível para agências de elite globais' },
  { icon: Globe, text: 'Conexões em mais de 180 países com compliance total' },
];

export const CreatorBenefitsModal = ({ open, onClose }: CreatorBenefitsModalProps) => {
  const router = useRouter();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border border-[#C9A96B]/30 w-full sm:max-w-lg p-8 sm:p-10 text-ivory space-y-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-gold uppercase tracking-[0.3em] font-sans">Exclusivo para Criadoras +18</span>
                <h3 className="font-serif-lumiardi text-2xl sm:text-3xl font-light mt-1">Por que se candidatar à Lumiardi?</h3>
              </div>
              <button onClick={onClose} className="p-2 text-ivory/50 hover:text-gold transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-4">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="p-2 bg-gold/10 text-gold border border-gold/20 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-ivory/80 font-sans font-light leading-relaxed">{b.text}</span>
                  </li>
                );
              })}
            </ul>
            <button
              onClick={() => { onClose(); router.push('/qualificacao'); }}
              className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] font-sans text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#D4B87A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Iniciar Processo de Candidatura</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
