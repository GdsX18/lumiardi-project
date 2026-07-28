'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

export interface ComparisonTableProps {
  isListRef?: React.RefObject<HTMLUListElement | null>;
  isNotListRef?: React.RefObject<HTMLUListElement | null>;
  headerIsRef?: React.RefObject<HTMLDivElement | null>;
  headerIsNotRef?: React.RefObject<HTMLDivElement | null>;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  isListRef,
  isNotListRef,
  headerIsRef,
  headerIsNotRef,
}) => {
  const isList = [
    'Tecnologia de ponta e infraestrutura global',
    'Moda de luxo e estética editorial refinada',
    'Gestão estratégica e ecossistema de elite',
    'Privacidade absoluta e controle total da marca',
    'Contratos transparentes e modelo de receita claro',
  ];

  const isNotList = [
    'Entretenimento adulto genérico ou popular',
    'Estética caótica, luzes neon ou apelo apelativo',
    'Exposição descontrolada ou falta de segurança',
    'Linguagem vulgar ou espetacularização',
    'Práticas informais ou intermediários não verificados',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 my-4 p-0 bg-transparent">
      {/* Coluna A LUMIARDI É */}
      <div className="space-y-6">
        <div ref={headerIsRef} className="pb-3 border-b border-black-matte/15">
          <span className="text-xs uppercase tracking-[0.3em] text-bronze font-semibold font-sans block">
            Posicionamento
          </span>
          <h3 className="font-serif-lumiardi text-3xl md:text-4xl font-normal text-black-matte mt-1 tracking-tight">
            A LUMIARDI É
          </h3>
        </div>
        <ul ref={isListRef} className="space-y-5">
          {isList.map((item, index) => (
            <li key={index} className="flex items-start gap-4">
              <span className="p-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full mt-0.5 shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </span>
              <span className="text-base md:text-xl text-black-matte/90 font-sans font-light leading-snug">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Coluna A LUMIARDI NÃO É */}
      <div className="space-y-6">
        <div ref={headerIsNotRef} className="pb-3 border-b border-black-matte/15">
          <span className="text-xs uppercase tracking-[0.3em] text-rose-900/60 font-semibold font-sans block">
            Diferenciação
          </span>
          <h3 className="font-serif-lumiardi text-3xl md:text-4xl font-normal text-rose-950/80 mt-1 tracking-tight">
            A LUMIARDI NÃO É
          </h3>
        </div>
        <ul ref={isNotListRef} className="space-y-5">
          {isNotList.map((item, index) => (
            <li key={index} className="flex items-start gap-4 opacity-80">
              <span className="p-1.5 bg-rose-900/10 text-rose-900 rounded-full mt-0.5 shrink-0">
                <X className="w-5 h-5 stroke-[2.5]" />
              </span>
              <span className="text-base md:text-xl text-black-matte/75 font-sans font-light leading-snug">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

