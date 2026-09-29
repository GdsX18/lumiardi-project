'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Lock } from 'lucide-react';

// Inline SVG icons for payment brands in Lumiardi luxury gold
const PixIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[21px] h-[21px] transition-transform duration-300 group-hover:scale-105" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"/>
  </svg>
);

const VisaIcon = () => (
  <svg viewBox="0 0 750 240" className="w-[36px] h-auto transition-transform duration-300 group-hover:scale-105" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M278.2 201.7L305.6 3H349.5L322 201.7H278.2Z"/>
    <path d="M481.5 7.1C472.7 3.9 458.8 0.5 441.6 0.5C399.1 0.5 369 21.8 368.8 52.4C368.5 75 390.4 87.6 407 95.2C424.1 102.9 430.1 107.8 430.1 114.6C430 125 416.8 129.7 404.4 129.7C386.9 129.7 377.6 127.2 363.3 121.2L357.5 118.6L351.2 156.2C361.6 160.8 380.8 164.8 400.6 165C445.7 165 475.3 143.9 475.5 111.2C475.7 93.1 464.3 79.2 440 67.7C424.6 60.5 415.2 55.7 415.2 48.4C415.3 42 423.1 35.4 440 35.4C454.2 35.2 464.8 38.2 473 41.4L477 43.2L483.2 6.7L481.5 7.1Z"/>
    <path d="M566.6 3H532.1C521.4 3 513.3 6 508.7 17.2L444.2 201.7H489.3L499.2 174.4H553.2L558.9 201.7H598.7L566.6 3ZM511.6 141.8C514.8 133.2 530.4 90.8 530.4 90.8C530.2 91.2 533.6 82.2 535.6 76.7L538.3 89.3C538.3 89.3 546.5 128.9 548.3 141.9L511.6 141.8Z"/>
    <path d="M241.8 3L199.6 132.3L195.2 110.4C187.4 85.4 163.5 58.2 136.8 44.6L175.3 201.5H220.7L287.2 3H241.8Z"/>
    <path d="M160.7 3H89.2L88.5 6.5C143.3 20.3 179.4 51.2 195.2 110.4L179.1 17.6C176.3 6.6 168.4 3.4 160.7 3Z"/>
  </svg>
);

const MastercardIcon = () => (
  <svg viewBox="0 0 32 20" className="w-[30px] h-auto transition-transform duration-300 group-hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="10" r="7.5" fill="currentColor" fillOpacity="0.65" />
    <circle cx="21" cy="10" r="7.5" fill="currentColor" fillOpacity="0.65" />
    <path d="M16 4.38a7.48 7.48 0 0 1 2.5 5.62 7.48 7.48 0 0 1-2.5 5.62A7.48 7.48 0 0 1 13.5 10c0-2.22.97-4.22 2.5-5.62z" fill="currentColor" />
  </svg>
);

const AmexIcon = () => (
  <svg viewBox="0 0 543 118" className="w-[36px] h-auto transition-transform duration-300 group-hover:scale-105" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M 50.44 0.02 L 0.00 117.28 L 32.84 117.28 L 42.14 93.80 L 96.24 93.80 L 105.50 117.28 L 139.06 117.28 L 88.67 0.02 L 50.44 0.02 Z M 69.09 27.31 L 85.58 68.34 L 52.56 68.34 L 69.09 27.31 Z M 147.06 117.26 L 147.06 0.00 L 193.72 0.17 L 220.86 75.78 L 247.35 0.00 L 293.64 0.00 L 293.64 117.26 L 264.32 117.26 L 264.32 30.86 L 233.25 117.26 L 207.54 117.26 L 176.37 30.86 L 176.37 117.26 Z M 308.34 117.26 L 308.34 0.00 L 404.00 0.00 L 404.00 26.23 L 337.96 26.23 L 337.96 46.29 L 402.46 46.29 L 402.46 70.97 L 337.96 70.97 L 337.96 91.80 L 404.00 91.80 L 404.00 117.26 Z M 414.00 117.26 L 460.58 59.36 L 412.89 0.00 L 449.83 0.00 L 478.23 36.69 L 506.72 0.00 L 542.21 0.00 L 495.15 58.63 L 541.81 117.26 L 504.88 117.26 L 477.31 81.15 L 450.40 117.26 Z"/>
  </svg>
);

const UsdtIcon = () => (
  <svg viewBox="0 0 1000 1000" className="w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-105" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M561.7 452.8v-70H735V290.5H265v72.3h173.3v70C309.3 456.3 241.5 475.4 241.5 498s67.8 41.7 196.8 45.3V740.5h123.4V543.3C690.8 539.7 758.5 520.6 758.5 498c0-22.6-67.8-41.7-196.8-45.2z"/>
    <path d="M500 960c-254 0-460-206-460-460S246 40 500 40s460 206 460 460-206 460-460 460zm0-80c210 0 380-170 380-380S710 120 500 120 120 290 120 500s170 380 380 380z" opacity="0.75"/>
  </svg>
);

const BtcIcon = () => (
  <svg viewBox="0 0 1000 1000" className="w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-105" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M691.5 451.5c26-48.5 19.5-111.5-35-134.5 38.5-20.5 60.5-57.5 54.5-102.5-9.5-69-81.5-87.5-152-94.5V250h-47.5v115.5h-47.5V250H414v115.5H284v66h53.5c24 0 30.5 11.5 32.5 27.5v270.5c0 22.5-7.5 35-32.5 35H284v69.5h130V950h47.5V834.5h47.5V950h66V834.5c81.5-5 146.5-37.5 158-115 9-62-12-104.5-60.5-126 42.7-9.6 75-38 84-96.5zm-199-158c43 0 107 7 107 57.5 0 46-61.5 55.5-107 55.5V293.5zm0 280.5c48.5 0 120.5 7 120.5 64 0 53.5-65 64-120.5 64V574z"/>
    <path d="M500 960c-254 0-460-206-460-460S246 40 500 40s460 206 460 460-206 460-460 460zm0-80c210 0 380-170 380-380S710 120 500 120 120 290 120 500s170 380 380 380z" opacity="0.75"/>
  </svg>
);

interface PaymentMethod {
  label: string;
  icon: React.ReactNode;
  category: string;
}

export const PaymentMethodsBar: React.FC = () => {
  const { t } = useLanguage();

  const methods: PaymentMethod[] = [
    { label: t('payment_methods_pix'), icon: <PixIcon />, category: 'BR' },
    { label: 'Visa', icon: <VisaIcon />, category: t('payment_methods_cards') },
    { label: 'Mastercard', icon: <MastercardIcon />, category: t('payment_methods_cards') },
    { label: 'Amex', icon: <AmexIcon />, category: t('payment_methods_cards') },
    { label: 'USDT', icon: <UsdtIcon />, category: t('payment_methods_crypto') },
    { label: 'Bitcoin', icon: <BtcIcon />, category: t('payment_methods_crypto') },
  ];

  return (
    <section id="payment-methods" className="py-12 bg-[#0B0B0B] border-t border-[#C9A96B]/15">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
          {/* Label */}
          <div className="shrink-0 space-y-1">
            <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#C9A96B]">
              {t('payment_methods_title')}
            </p>
            <p className="text-xs font-sans text-ivory/40 max-w-[180px] leading-relaxed">
              {t('payment_methods_desc')}
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-12 bg-white/10 shrink-0" />

          {/* Icons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {methods.map(({ label, icon }) => (
              <div
                key={label}
                title={label}
                className="group flex items-center justify-center w-[58px] h-10 bg-white/[0.02] border border-[#C9A96B]/25 hover:border-[#C9A96B]/70 hover:bg-[#C9A96B]/[0.08] hover:shadow-[0_0_12px_rgba(201,169,107,0.15)] text-[#C9A96B] hover:text-[#E2CA92] transition-all duration-300 rounded-[3px] cursor-default"
              >
                {icon}
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="md:ml-auto shrink-0 flex items-center gap-2 text-ivory/30">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] font-sans leading-tight max-w-[160px]">
              {t('payment_methods_secure_note')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

