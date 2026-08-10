'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function LimitesRedirectPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    // Redireciona diretamente para o fluxo oficial de qualificação
    router.replace('/qualificacao');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ivory flex items-center justify-center font-sans">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#C9A96B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-[0.25em] text-[#C9A96B]">{t('redirecting_candidacy')}</p>
      </div>
    </div>
  );
}
