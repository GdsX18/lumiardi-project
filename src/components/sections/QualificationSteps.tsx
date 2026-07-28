'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QualificationStepsProps {
  currentStep?: number;
}

export const QualificationSteps: React.FC<QualificationStepsProps> = ({
  currentStep = 1,
}) => {
  const steps = [
    { number: 1, label: '+18 Verificação', desc: 'Validação de Identidade e Idade' },
    { number: 2, label: 'Entrevista de Alinhamento', desc: 'Identidade e Intenção' },
    { number: 3, label: 'Perfil de Elite', desc: 'Ativação na Rede Lumiardi' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-10 px-4">
      <div className="flex items-center justify-between relative">
        {/* Linha conectora de fundo */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-bronze/30 -translate-y-1/2 z-0" />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center group">
              <div
                className={cn(
                  'w-12 h-12 flex items-center justify-center font-serif-lumiardi text-lg transition-all duration-300 border',
                  isCompleted && 'bg-gold text-black-matte border-gold',
                  isActive && 'bg-[#0B0B0B] text-gold border-gold gold-border-glow scale-110',
                  !isActive && !isCompleted && 'bg-[#0B0B0B] text-ivory/40 border-bronze/30'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : `0${step.number}`}
              </div>
              <span
                className={cn(
                  'text-xs font-sans font-medium uppercase tracking-wider mt-3 text-center',
                  isActive ? 'text-gold font-semibold' : 'text-ivory/60'
                )}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-ivory/40 font-sans hidden sm:block mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
