'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, ArrowRight, Award, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VIPWelcomeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
  memberId?: string;
  category?: string;
}

export function VIPWelcomeCelebrationModal({
  isOpen,
  onClose,
  userName = 'Membro VIP',
  userRole = 'criadora',
  memberId = 'LUM-8842',
  category = 'Criadora de Elite',
}: VIPWelcomeCelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Dispara confetes dourados e brancos de luxo
      try {
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          colors: ['#D4AF37', '#F5D77F', '#AA820A', '#FFFFFF', '#C9A96B'],
        };

        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch (e) {
        // Fallback gracioso se canvas-confetti não estiver carregado
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#181611] via-[#0F0E0B] to-[#070707] border-2 border-[#D4AF37]/60 p-8 sm:p-10 shadow-[0_0_80px_rgba(212,175,55,0.25)] rounded-xl text-center space-y-8 overflow-hidden"
        >
          {/* Efeitos de Iluminação de Fundo */}
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#D4AF37]/15 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-[#D4AF37]/15 rounded-full blur-[70px] pointer-events-none" />

          {/* Badge Superior */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-full text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-semibold">
            <Crown className="w-3.5 h-3.5 text-[#F5D77F]" />
            <span>Homologação Concluída</span>
          </div>

          {/* Título de Celebração */}
          <div className="space-y-3">
            <h2 className="font-serif-lumiardi text-3xl sm:text-5xl font-light text-ivory tracking-tight leading-tight">
              Você foi <span className="text-[#F5D77F] italic font-normal">Aprovada(o)!</span>
            </h2>
            <p className="text-sm sm:text-base text-ivory/75 font-sans max-w-md mx-auto font-light leading-relaxed">
              O Comitê de Curadoria Lumiardi validou seus documentos 18 U.S.C. § 2257 e sua anuidade VIP. Seu acesso de elite está liberado.
            </p>
          </div>

          {/* Cartão de Membro Digital 3D de Luxo */}
          <motion.div
            initial={{ rotateX: 20, y: 15 }}
            animate={{ rotateX: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto max-w-md bg-gradient-to-br from-[#231E15] via-[#15130E] to-[#0A0907] border border-[#D4AF37]/50 p-6 rounded-lg shadow-2xl text-left space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div>
                <span className="font-serif-lumiardi text-xl font-bold tracking-[0.25em] text-[#F5D77F] block">
                  LUMIARDI
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#A89874] block">
                  Private Members Club
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full text-[#F5D77F] text-[10px] font-mono font-bold tracking-wider uppercase">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Audited § 2257</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ivory/40 block font-sans">
                  Nome do Membro
                </span>
                <span className="font-serif-lumiardi text-base text-ivory font-medium truncate block">
                  {userName}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ivory/40 block font-sans">
                  Categoria
                </span>
                <span className="text-xs text-[#F5D77F] font-sans font-semibold truncate block">
                  {category}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ivory/40 block font-sans">
                  Status de Entrada
                </span>
                <span className="text-xs text-emerald-400 font-sans font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Membro Ativo
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ivory/40 block font-sans">
                  Número de Registro
                </span>
                <span className="font-mono text-xs text-ivory/80 font-bold">
                  {memberId}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Botão de Ação Principal */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-4 px-8 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C9A96B] hover:brightness-110 text-[#0B0B0B] text-xs sm:text-sm uppercase tracking-[0.25em] font-bold shadow-[0_10px_30px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3 cursor-pointer rounded-sm"
            >
              <span>Entrar no Universo Lumiardi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
