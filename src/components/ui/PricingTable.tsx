'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Badge } from './Badge';

export interface PricingPlan {
  name: string;
  price: string;
  badge?: string;
  isPopular?: boolean;
}

export const PricingTable: React.FC = () => {
  const plans: PricingPlan[] = [
    { name: 'Glow', price: 'R$ 19,90' },
    { name: 'Radiance', price: 'R$ 69,90' },
    { name: 'Icon', price: 'R$ 129,90', badge: 'RECOMENDADO', isPopular: true },
  ];

  const features = [
    { label: 'Mensalidade', glow: 'R$ 19,90', radiance: 'R$ 69,90', icon: 'R$ 129,90', isHeader: true },
    { label: 'Perfil ativo', glow: 'Sim', radiance: 'Sim', icon: 'Sim' },
    { label: 'Receber contatos de agências', glow: 'Ilimitado', radiance: 'Ilimitado', icon: 'Ilimitado' },
    { label: 'Iniciar contatos com agências', glow: '5 por mês', radiance: '25 por mês', icon: 'Ilimitado' },
    { label: 'Chat interno', glow: 'Sim', radiance: 'Sim', icon: 'Sim' },
    { label: 'Espaços de organização', glow: '1 ativo', radiance: 'Até 3 ativos', icon: 'Ilimitados' },
    { label: 'Destaques de 24 horas', glow: '—', radiance: '3 por mês', icon: '10 por mês' },
    { label: 'Posição nas pesquisas', glow: 'Padrão', radiance: 'Prioritária', icon: 'Máxima prioridade rotativa' },
    { label: 'Dados internos', glow: 'Visualizações', radiance: 'Visualizações e salvamentos', icon: 'Relatório completo' },
    { label: 'Suporte', glow: 'Padrão', radiance: 'Prioritário', icon: 'Prioridade máxima' },
  ];

  return (
    <div className="w-full overflow-x-auto my-8 border border-black-matte/15 bg-white/80 shadow-xl p-4 md:p-8">
      <table className="w-full text-left border-collapse min-w-[640px]">
        <thead>
          <tr className="border-b border-black-matte/15">
            <th className="py-6 px-4 font-serif-lumiardi text-xl md:text-2xl font-light text-black-matte w-1/4">
              Funcionalidade
            </th>
            {plans.map((plan) => (
              <th
                key={plan.name}
                className={`py-6 px-4 w-1/4 text-center relative ${
                  plan.isPopular ? 'bg-bronze/10 border-x border-bronze/30' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gold" className="text-[9px] px-2 py-0.5">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <span className="font-serif-lumiardi text-2xl md:text-3xl text-bronze font-normal block">
                  {plan.name}
                </span>
                <span className="font-sans text-xs tracking-widest text-black-matte/70 uppercase mt-1 block">
                  {plan.price} / mês
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr
              key={idx}
              className={`border-b border-black-matte/10 transition-colors hover:bg-black-matte/[0.02] ${
                feature.isHeader ? 'bg-black-matte/[0.03] font-medium' : ''
              }`}
            >
              <td className="py-4 px-4 font-sans text-xs md:text-sm text-black-matte/85 font-normal">
                {feature.label}
              </td>
              <td className="py-4 px-4 text-center font-sans text-xs md:text-sm text-black-matte/80">
                {feature.glow === 'Sim' ? <Check className="w-4 h-4 mx-auto text-[#8C6B2F]" /> : feature.glow}
              </td>
              <td className="py-4 px-4 text-center font-sans text-xs md:text-sm text-black-matte/80">
                {feature.radiance === 'Sim' ? <Check className="w-4 h-4 mx-auto text-[#8C6B2F]" /> : feature.radiance}
              </td>
              <td className="py-4 px-4 text-center font-sans text-xs md:text-sm text-[#8C6B2F] font-medium bg-bronze/10 border-x border-bronze/20">
                {feature.icon === 'Sim' ? <Check className="w-4 h-4 mx-auto text-[#8C6B2F]" /> : feature.icon}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
