'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Badge } from './Badge';
import { useLanguage } from '@/context/LanguageContext';

interface AgencyPlan {
  name: string;
  price: string;
  badge?: string;
  isPopular?: boolean;
}

interface AgencyPricingTableProps {
  currency: 'BRL' | 'USD';
  isYearly: boolean;
}

export const AgencyPricingTable: React.FC<AgencyPricingTableProps> = ({ currency, isYearly }) => {
  const { t } = useLanguage();

  const formatPrice = (brl: number, usd: number): string => {
    const amount = currency === 'USD' ? usd : brl;
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const plans: AgencyPlan[] = [
    {
      name: 'Select',
      price: formatPrice(isYearly ? 233.10 : 259.00, isYearly ? 44.10 : 49.00),
      badge: undefined,
      isPopular: false,
    },
    {
      name: 'Signature',
      price: formatPrice(isYearly ? 441.00 : 490.00, isYearly ? 89.10 : 99.00),
      badge: t('plan_sig_rec_badge'),
      isPopular: true,
    },
  ];

  const YES = t('agency_tbl_yes');

  const features = [
    {
      label: t('agency_tbl_f1'),
      select: t('agency_tbl_scout_200'),
      signature: t('agency_tbl_scout_unlimited'),
    },
    {
      label: t('agency_tbl_f2'),
      select: t('agency_tbl_roster_10'),
      signature: t('agency_tbl_roster_unlimited'),
    },
    {
      label: t('agency_tbl_f3'),
      select: t('agency_tbl_drive_100'),
      signature: t('agency_tbl_drive_500'),
    },
    {
      label: t('agency_tbl_f4'),
      select: YES,
      signature: YES,
    },
    {
      label: t('agency_tbl_f5'),
      select: YES,
      signature: YES,
    },
    {
      label: t('agency_tbl_f6'),
      select: '—',
      signature: YES,
    },
    {
      label: t('agency_tbl_f7'),
      select: t('agency_tbl_std'),
      signature: t('agency_tbl_priority'),
    },
    {
      label: t('agency_tbl_f8'),
      select: YES,
      signature: YES,
    },
  ];

  const renderCell = (value: string, isPopular: boolean) => {
    if (value === YES) {
      return <Check className={`w-4 h-4 mx-auto ${isPopular ? 'text-[#C9A96B]' : 'text-[#8C6B2F]'}`} />;
    }
    if (value === '—') {
      return <span className="text-gray-500">—</span>;
    }
    return <span>{value}</span>;
  };

  return (
    <div className="w-full overflow-x-auto my-8 border border-black-matte/15 bg-white shadow-2xl p-4 md:p-8">
      <table className="w-full text-left border-collapse min-w-[500px]">
        <thead>
          <tr className="border-b border-black-matte/15">
            <th className="py-6 px-4 font-serif-lumiardi text-xl md:text-2xl font-light text-black-matte w-1/3">
              {t('agency_tbl_feature')}
            </th>
            {plans.map((plan) => (
              <th
                key={plan.name}
                className={`py-6 px-4 w-1/3 text-center relative ${
                  plan.isPopular ? 'bg-[#0B0B0B] border-x border-[#C9A96B]/40' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge variant="gold" className="text-[9px] px-2 py-0.5">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <span className={`font-serif-lumiardi text-2xl md:text-3xl font-normal block ${plan.isPopular ? 'text-[#C9A96B]' : 'text-[#8C6B2F]'}`}>
                  {plan.name}
                </span>
                <span className={`font-sans text-xs tracking-widest uppercase mt-1 block ${plan.isPopular ? 'text-ivory/70' : 'text-black-matte/70'}`}>
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
                {renderCell(feature.select, false)}
              </td>
              <td className="py-4 px-4 text-center font-sans text-xs md:text-sm text-[#C9A96B] font-medium bg-[#0B0B0B] border-x border-[#C9A96B]/20">
                {renderCell(feature.signature, true)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

