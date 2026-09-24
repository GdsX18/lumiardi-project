import { pt } from './pt';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { ru } from './ru';
import { CHECKOUT_TRANSLATIONS } from './checkout';

export { pt, en, es, fr, it, ru, CHECKOUT_TRANSLATIONS };

export type LanguageCode = 'pt' | 'es' | 'en' | 'fr' | 'it' | 'ru';

export const translations: Record<LanguageCode, Record<string, string>> = {
  pt,
  en,
  es,
  fr,
  it,
  ru,
};
