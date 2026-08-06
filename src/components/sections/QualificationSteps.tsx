'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export interface QualificationStepsProps {
  currentStep?: number;
}

export const QualificationSteps: React.FC<QualificationStepsProps> = ({
  currentStep = 1,
}) => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: t('qual_step1_title'), desc: t('qual_step1_desc') },
    { number: 2, label: t('qual_step2_title'), desc: t('qual_step2_desc') },
    { number: 3, label: t('qual_step3_title'), desc: t('qual_step3_desc') },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-10 px-4">
      {/* Layout: coluna em mobile, linha a partir de sm */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-0 relative"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Linha conectora horizontal — só visível em sm+ */}
        <div className="hidden sm:block absolute top-6 left-0 right-0 h-[1px] bg-bronze/30 z-0" />

        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="relative z-10 flex sm:flex-col items-center sm:items-center gap-4 sm:gap-0 w-full sm:w-auto group"
            >
              {/* Linha conectora vertical — só em mobile entre items */}
              {index < steps.length - 1 && (
                <div className="sm:hidden absolute left-6 top-12 w-[1px] h-8 bg-bronze/30" />
              )}

              {/* Círculo numerado */}
              <div
                className={cn(
                  'w-12 h-12 shrink-0 flex items-center justify-center font-serif-lumiardi text-lg transition-all duration-300 border',
                  isCompleted && 'bg-gold text-black-matte border-gold',
                  isActive && 'bg-[#0B0B0B] text-gold border-gold gold-border-glow scale-110',
                  !isActive && !isCompleted && 'bg-[#0B0B0B] text-ivory/40 border-bronze/30'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : `0${step.number}`}
              </div>

              {/* Textos do step */}
              <div className="flex flex-col sm:items-center sm:mt-3 text-left sm:text-center">
                <span
                  className={cn(
                    'text-xs font-sans font-medium uppercase tracking-wider',
                    isActive ? 'text-gold font-semibold' : 'text-ivory/60'
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-ivory/40 font-sans mt-0.5 max-w-[140px]">
                  {step.desc}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
