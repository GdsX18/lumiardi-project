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
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'lumiardi_lang_v2';
const CURRENCY_STORAGE_KEY = 'lumiardi_currency';

const localeMap: Record<LanguageCode, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ru: 'ru-RU',
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [currency, setCurrencyState] = useState<CurrencyCode>('BRL');

  useEffect(() => {
    try {
      // Only restore if the user explicitly chose a language in this version (v2 key)
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as LanguageCode;
      if (savedLang && translations[savedLang]) {
        queueMicrotask(() => setLanguageState(savedLang));
      }
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
      if (savedCurrency === 'BRL' || savedCurrency === 'USD' || savedCurrency === 'EUR') {
        queueMicrotask(() => setCurrencyState(savedCurrency));
      } else if (savedLang) {
        queueMicrotask(() =>
          setCurrencyState(
            savedLang === 'pt'
              ? 'BRL'
              : savedLang === 'fr' || savedLang === 'it' || savedLang === 'es'
              ? 'EUR'
              : 'USD'
          )
        );
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

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
    const locale = localeMap[language] || 'pt-BR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const t = (key: string, fallback?: string): string => {
    // Camada 0: Traduções de checkout customizadas (prioridade máxima)
    const custom =
      CHECKOUT_TRANSLATIONS[language]?.[key] ||
      CHECKOUT_TRANSLATIONS['en']?.[key] ||
      CHECKOUT_TRANSLATIONS['pt']?.[key];
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
    const TECHNICAL_PREFIX = /^(dash_|nav_|btn_|page_|modal_|kyc_|drive_|chat_|meet_|kanban_|agency_|doc_|err_|pending_|billing_|book_|header_|plan_|plans_|pillar_|eco_|ds_|mo_|lim_|cs_|pos_|hero_|pinned_|drawer_|footer_|portal_|login_|avail_|day_|month_|eye_|hair_|gender_|loc_|banner_|kyc_)/;
    return key
      .replace(TECHNICAL_PREFIX, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, setCurrency, formatPrice, t }}>
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