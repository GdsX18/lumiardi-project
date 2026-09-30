'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LanguageCode,
  translations,
  CHECKOUT_TRANSLATIONS,
} from '@/locales';

export type { LanguageCode };

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  shortLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', shortLabel: 'EN' },
  { code: 'pt', name: 'Português', shortLabel: 'PT' },
  { code: 'es', name: 'Español', shortLabel: 'ES' },
  { code: 'fr', name: 'Français', shortLabel: 'FR' },
  { code: 'it', name: 'Italiano', shortLabel: 'IT' },
  { code: 'ru', name: 'Русский', shortLabel: 'RU' },
];

export { translations };

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currency: CurrencyCode;
  setCurrency: (curr: CurrencyCode) => void;
  formatPrice: (brl: number, usd: number, eur?: number) => string;
  /** Locale BCP 47 do idioma atual (ex.: 'pt-BR'), para Intl/toLocale*. */
  locale: string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: string | number | Date) => string;
  t: (key: string, fallback?: string) => string;
  /**
   * Traduz o erro retornado por uma rota de API.
   * Usa `data.code` (chave `api_err_<code>`) quando existir; em português exibe `data.error`;
   * nos demais idiomas cai para a chave genérica informada.
   */
  tApiError: (data: unknown, fallbackKey?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'lumiardi_lang_v2';
const LANG_COOKIE = 'lumiardi_lang';
const CURRENCY_STORAGE_KEY = 'lumiardi_currency';

const localeMap: Record<LanguageCode, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ru: 'ru-RU',
};

const SUPPORTED: LanguageCode[] = ['pt', 'en', 'es', 'fr', 'it', 'ru'];

/** Detecta o idioma preferido do navegador entre os suportados. */
function detectBrowserLanguage(): LanguageCode | null {
  try {
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const pref of prefs) {
      const code = pref?.slice(0, 2).toLowerCase() as LanguageCode;
      if (SUPPORTED.includes(code)) return code;
    }
  } catch {
    // navigator indisponível
  }
  return null;
}

const toDate = (value: string | number | Date) => (value instanceof Date ? value : new Date(value));

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [currency, setCurrencyState] = useState<CurrencyCode>('BRL');

  useEffect(() => {
    try {
      // Only restore if the user explicitly chose a language in this version (v2 key)
      const storedLang = localStorage.getItem(LANG_STORAGE_KEY) as LanguageCode;
      const savedLang = storedLang && translations[storedLang] ? storedLang : null;
      const initialLang = savedLang || detectBrowserLanguage();
      if (initialLang && initialLang !== 'en') {
        queueMicrotask(() => setLanguageState(initialLang));
      }
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
      if (savedCurrency === 'BRL' || savedCurrency === 'USD' || savedCurrency === 'EUR') {
        queueMicrotask(() => setCurrencyState(savedCurrency));
      } else if (initialLang) {
        queueMicrotask(() =>
          setCurrencyState(
            initialLang === 'pt'
              ? 'BRL'
              : initialLang === 'fr' || initialLang === 'it' || initialLang === 'es'
              ? 'EUR'
              : 'USD'
          )
        );
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // Mantém <html lang> e o cookie de idioma (lido pelo servidor em e-mails/cadastro) sincronizados
  useEffect(() => {
    try {
      document.documentElement.lang = localeMap[language] || 'en-US';
      document.cookie = `${LANG_COOKIE}=${language}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignora ambientes sem DOM
    }
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (!savedCurrency) {
        setCurrencyState(
          lang === 'pt'
            ? 'BRL'
            : lang === 'fr' || lang === 'it' || lang === 'es'
            ? 'EUR'
            : 'USD'
        );
      }
    } catch {
      // Ignore storage access errors
    }
  };

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, curr);
    } catch {
      // Ignore storage access errors
    }
  };

  const formatPrice = (brl: number, usd: number, eur?: number): string => {
    let amount = brl;
    if (currency === 'USD') {
      amount = usd;
    } else if (currency === 'EUR') {
      amount = eur ?? Math.round(usd * 0.92 * 100) / 100;
    }
    return new Intl.NumberFormat(localeMap[language] || 'pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const locale = localeMap[language] || 'pt-BR';

  const formatDate = (value: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    const d = toDate(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, options);
  };

  const formatDateTime = (value: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    const d = toDate(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(locale, options ?? { dateStyle: 'short', timeStyle: 'short' });
  };

  const formatTime = (value: string | number | Date): string => {
    const d = toDate(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const t = (key: string, fallback?: string): string => {
    // Camada 0: Traduções de checkout customizadas (prioridade máxima)
    const custom =
      CHECKOUT_TRANSLATIONS[language]?.[key] ||
      CHECKOUT_TRANSLATIONS['pt']?.[key] ||
      CHECKOUT_TRANSLATIONS['en']?.[key];
    if (custom) return custom;

    // Camada 1: Idioma selecionado pelo usuário
    const currentDict = translations[language];
    if (currentDict?.[key]) return currentDict[key];

    // Camada 2: Fallback para Português (idioma base da plataforma)
    if (translations['pt']?.[key]) return translations['pt'][key];

    // Camada 3: Fallback para Inglês (segunda língua de cobertura)
    if (translations['en']?.[key]) return translations['en'][key];

    // Camada 4: Parâmetro de fallback explícito fornecido na chamada
    if (fallback) return fallback;

    // Camada 5: Humanização da chave técnica + aviso em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Chave ausente: "${key}" (idioma: ${language})`);
    }
    const TECHNICAL_PREFIX = /^(dash_|nav_|btn_|page_|modal_|kyc_|drive_|chat_|meet_|kanban_|agency_|doc_|err_|pending_|billing_|book_|header_|plan_|plans_|pillar_|eco_|ds_|mo_|lim_|cs_|pos_|hero_|pinned_|drawer_|footer_|portal_|login_|avail_|day_|month_|eye_|hair_|gender_|loc_|banner_)/;
    return key
      .replace(TECHNICAL_PREFIX, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const tApiError = (data: unknown, fallbackKey = 'api_err_generic'): string => {
    const payload = (data && typeof data === 'object' ? data : {}) as { code?: unknown; error?: unknown };
    if (typeof payload.code === 'string') {
      const codeKey = `api_err_${payload.code}`;
      if (translations[language]?.[codeKey] || translations['pt']?.[codeKey]) return t(codeKey);
    }
    if (language === 'pt' && typeof payload.error === 'string' && payload.error) return payload.error;
    return t(fallbackKey);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, setCurrency, formatPrice, locale, formatDate, formatDateTime, formatTime, t, tApiError }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = useLanguage;