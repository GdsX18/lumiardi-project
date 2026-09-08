'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Badge } from './Badge';
import { useLanguage } from '@/context/LanguageContext';

export interface PricingPlan {
  name: string;
  price: string;
  badge?: string;
  isPopular?: boolean;
}

interface PricingTableProps {
  currency?: 'BRL' | 'USD';
  isYearly?: boolean;
}

export const PricingTable: React.FC<PricingTableProps> = ({ currency = 'BRL', isYearly = false }) => {
  const { t } = useLanguage();

  const formatPrice = (brl: number, usd: number): string => {
    const amount = currency === 'USD' ? usd : brl;
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const plans: PricingPlan[] = [
    { name: 'Glow', price: formatPrice(isYearly ? 17.91 : 19.90, isYearly ? 3.59 : 3.99) },
    { name: 'Radiance', price: formatPrice(isYearly ? 62.91 : 69.90, isYearly ? 12.59 : 13.99) },
    { name: 'Icon', price: formatPrice(isYearly ? 116.91 : 129.90, isYearly ? 23.39 : 25.99), badge: t('plan_icon_rec_badge'), isPopular: true },
  ];

  const features = [
    { label: t('tbl_f1'), glow: t('tbl_yes'), radiance: t('tbl_yes'), icon: t('tbl_yes') },
    { label: t('tbl_f2'), glow: t('tbl_yes'), radiance: t('tbl_yes'), icon: t('tbl_yes') },
    { label: t('tbl_f3'), glow: t('tbl_unlimited'), radiance: t('tbl_unlimited'), icon: t('tbl_unlimited') },
    { label: t('tbl_f4'), glow: t('tbl_up_to_5'), radiance: t('tbl_up_to_25'), icon: t('tbl_unlimited') },
    { label: t('tbl_f5'), glow: t('tbl_yes'), radiance: t('tbl_yes'), icon: t('tbl_yes') },
    { label: t('tbl_f6'), glow: t('tbl_1_active'), radiance: t('tbl_up_to_3'), icon: t('tbl_unlimited') },
    { label: t('tbl_f7'), glow: '—', radiance: t('tbl_3_per_mo'), icon: t('tbl_10_per_mo') },
    { label: t('tbl_f8'), glow: t('tbl_std'), radiance: t('tbl_priority'), icon: t('tbl_max_priority') },
    { label: t('tbl_f9'), glow: '—', radiance: '—', icon: t('tbl_yes') },
    { label: t('tbl_f10'), glow: t('tbl_views'), radiance: t('tbl_views_full'), icon: t('tbl_report') },
    { label: t('tbl_f11'), glow: t('tbl_std'), radiance: t('tbl_priority'), icon: t('tbl_max_priority') },
  ];

  return (
    <div className="w-full overflow-x-auto my-8 border border-black-matte/15 bg-white shadow-2xl p-4 md:p-8">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-black-matte/15">
            <th className="py-6 px-4 font-serif-lumiardi text-xl md:text-2xl font-light text-black-matte w-1/4">
              {t('plans_feature_header')}
            </th>
            {plans.map((plan) => (
              <th
                key={plan.name}
                className={`py-6 px-4 w-1/4 text-center relative ${
                  plan.isPopular ? 'bg-[#C9A96B]/10 border-x border-[#C9A96B]/30' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge variant="gold" className="text-[9px] px-2 py-0.5">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <span className="font-serif-lumiardi text-2xl md:text-3xl text-[#8C6B2F] font-normal block">
                  {plan.name}
                </span>
                <span className="font-sans text-xs tracking-widest text-black-matte/70 uppercase mt-1 block">
                  {plan.price} {t('plans_per_month')}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr
              key={idx}
              className="border-b border-black-matte/10 transition-colors hover:bg-black-matte/[0.02]"
            >
              <td className="py-4 px-4 font-sans text-xs md:text-sm text-black-matte/90 font-normal">
                {feature.label}
              </td>
              <td className="py-4 px-4 text-center font-sans text-xs md:text-sm text-black-matte/80">
                {feature.glow === t('tbl_yes') ? <Check className="w-4 h-4 mx-auto text-[#8C6B2F]" /> : feature.glow === '—' ? <span className="text-gray-400">—</span> : feature.glow}
              </td>
              <td className="py-4 px-4 text-center font-sans text-xs md:text-sm text-black-matte/80">
                {feature.radiance === t('tbl_yes') ? <Check className="w-4 h-4 mx-auto text-[#8C6B2F]" /> : feature.radiance === '—' ? <span className="text-gray-400">—</span> : feature.radiance}
              </td>
              <td className="py-4 px-4 text-center font-sans text-xs md:text-sm text-[#8C6B2F] font-medium bg-[#C9A96B]/10 border-x border-[#C9A96B]/20">
                {feature.icon === t('tbl_yes') ? <Check className="w-4 h-4 mx-auto text-[#8C6B2F]" /> : feature.icon === '—' ? <span className="text-gray-400">—</span> : feature.icon}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
