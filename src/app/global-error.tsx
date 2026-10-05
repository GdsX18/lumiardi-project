'use client';

import React, { useSyncExternalStore } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { translations, type LanguageCode } from '@/locales';

// global-error renderiza fora dos Providers: lê o idioma direto do localStorage
const LANG_STORAGE_KEY = 'lumiardi_lang_v2';
const SUPPORTED: LanguageCode[] = ['pt', 'en', 'es', 'fr', 'it', 'ru'];
const HTML_LANG: Record<LanguageCode, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ru: 'ru-RU',
};

function readStoredLanguage(): LanguageCode {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && (SUPPORTED as string[]).includes(stored)) return stored as LanguageCode;
  } catch {
    // localStorage indisponível (modo privado, bloqueio de cookies...)
  }
  return 'en';
}

const subscribe = () => () => {};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const language = useSyncExternalStore(subscribe, readStoredLanguage, () => 'en' as LanguageCode);
  const t = (key: string): string => translations[language]?.[key] || translations.en?.[key] || key;

  return (
    <html lang={HTML_LANG[language]} className="h-full bg-[#0B0B0B]">
      <body className="h-full flex items-center justify-center p-6 bg-[#0B0B0B] text-[#F5F5F0] font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-mono uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('lgm_gerr_tag')}</span>
          </div>

          <h1 className="text-3xl font-light text-[#F5F5F0]">
            LUMIARDI <span className="text-[#C9A96B] italic">{t('lgm_gerr_title_highlight')}</span>
          </h1>

          <p className="text-sm text-[#F5F5F0]/60 leading-relaxed">
            {t('lgm_gerr_desc')}
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A96B] text-[#0B0B0B] font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('lgm_gerr_reload')}</span>
          </button>
        </div>
      </body>
    </html>
  );
}
