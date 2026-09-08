'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Lock } from 'lucide-react';

// Inline SVG icons for payment brands (no external dependencies)
const PixIcon = () => (
  <svg viewBox="0 0 512 512" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#32BCAD"/>
    <path d="M198.3 313.7L143.7 369c-10.2 10.1-26.7 10.1-36.9 0L56 317.6c-10.2-10.1-10.2-26.5 0-36.6L198.3 138c10.2-10.1 26.7-10.1 36.9 0l51.5 51.5c10.2 10.1 10.2 26.5 0 36.6L198.3 313.7zm115.4 0l92.7 92.7c10.2 10.1 10.2 26.5 0 36.6l-51.5 51.5c-10.2 10.1-26.7 10.1-36.9 0L225.7 401.2c-10.2-10.1-10.2-26.5 0-36.6l88-88zM313.7 198.3l-92.7-92.7c-10.2-10.1-10.2-26.5 0-36.6l51.5-51.5c10.2-10.1 26.7-10.1 36.9 0L402 110.8c10.2 10.1 10.2 26.5 0 36.6l-88 88z" fill="white"/>
  </svg>
);

const VisaIcon = () => (
  <svg viewBox="0 0 750 471" className="h-7 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="750" height="471" rx="40" fill="#1A1F71"/>
    <path d="M278.2 334.7L305.6 136H349.5L322 334.7H278.2Z" fill="white"/>
    <path d="M481.5 140.1C472.7 136.9 458.8 133.5 441.6 133.5C399.1 133.5 369 154.8 368.8 185.4C368.5 208 390.4 220.6 407 228.2C424.1 235.9 430.1 240.8 430.1 247.6C430 258 416.8 262.7 404.4 262.7C386.9 262.7 377.6 260.2 363.3 254.2L357.5 251.6L351.2 289.2C361.6 293.8 380.8 297.8 400.6 298C445.7 298 475.3 276.9 475.5 244.2C475.7 226.1 464.3 212.2 440 200.7C424.6 193.5 415.2 188.7 415.2 181.4C415.3 175 423.1 168.4 440 168.4C454.2 168.2 464.8 171.2 473 174.4L477 176.2L483.2 139.7L481.5 140.1Z" fill="white"/>
    <path d="M566.6 136H532.1C521.4 136 513.3 139 508.7 150.2L444.2 334.7H489.3L499.2 307.4H553.2L558.9 334.7H598.7L566.6 136ZM511.6 274.8C514.8 266.2 530.4 223.8 530.4 223.8C530.2 224.2 533.6 215.2 535.6 209.7L538.3 222.3C538.3 222.3 546.5 261.9 548.3 274.9L511.6 274.8Z" fill="white"/>
    <path d="M241.8 136L199.6 265.3L195.2 243.4C187.4 218.4 163.5 191.2 136.8 177.6L175.3 334.5H220.7L287.2 136H241.8Z" fill="white"/>
    <path d="M160.7 136H89.2L88.5 139.5C143.3 153.3 179.4 184.2 195.2 243.4L179.1 150.6C176.3 139.6 168.4 136.4 160.7 136Z" fill="#FAA61A"/>
  </svg>
);

const MastercardIcon = () => (
  <svg viewBox="0 0 750 471" className="h-7 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="750" height="471" rx="40" fill="#252525"/>
    <circle cx="284" cy="235.5" r="133" fill="#EB001B"/>
    <circle cx="466" cy="235.5" r="133" fill="#F79E1B"/>
    <path d="M375 143.5C404.2 163.8 424 196.5 424 234C424 271.5 404.2 304.2 375 324.5C345.8 304.2 326 271.5 326 234C326 196.5 345.8 163.8 375 143.5Z" fill="#FF5F00"/>
  </svg>
);

const AmexIcon = () => (
  <svg viewBox="0 0 750 471" className="h-7 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="750" height="471" rx="40" fill="#2E77BC"/>
    <path d="M138 188H208.5L220 214.5L231.5 188H375V198.5L365.5 188H470L481.5 188H612V283H478L467 272L456 283H350V257.5C350 257.5 339.5 265.5 320 265.5H307.5V283H218L206.5 257H193.5L182 283H138V188Z" fill="white"/>
    <path d="M182 200.5L155 265H172L177 252H206L211 265H228L201 200.5H182ZM181.5 240L192 213L202.5 240H181.5Z" fill="#2E77BC"/>
    <path d="M230 265V200.5H254L272 244L290 200.5H314V265H298V218.5L278 265H265.5L246 218.5V265H230Z" fill="#2E77BC"/>
  </svg>
);

const UsdtIcon = () => (
  <svg viewBox="0 0 2000 2000" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="1000" cy="1000" r="1000" fill="#26A17B"/>
    <path d="M1123.4 905.5v-140H1470V581H530v184.5h346.6v139.9C618.5 912.6 483 950.8 483 996s135.5 83.4 393.6 90.5V1481H1122v-394.5C1381.5 1079.4 1517 1041.2 1517 996c0-45.2-135.5-83.4-393.6-90.5z" fill="white"/>
  </svg>
);

const BtcIcon = () => (
  <svg viewBox="0 0 2000 2000" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="1000" cy="1000" r="1000" fill="#F7931A"/>
    <path d="M1383 903c52-97 39-223-70-269 77-41 121-115 109-205-19-138-163-175-304-189V500H987v231h-95V500H760v231H500v132h107c48 0 61 23 65 55v541c0 45-15 70-65 70H500v139h260v232h132V1701h95v232h132V1701c163-10 293-75 316-230 18-124-24-209-121-252zm-398-316c86 0 214 14 214 115 0 92-123 111-214 111V587zm0 561c97 0 241 14 241 128 0 107-130 128-241 128V1148z" fill="white"/>
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
    <section className="py-12 bg-[#0B0B0B] border-t border-[#C9A96B]/15">
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
                className="flex items-center justify-center w-14 h-10 bg-white/[0.04] border border-white/8 hover:border-[#C9A96B]/30 transition-all rounded-sm"
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

