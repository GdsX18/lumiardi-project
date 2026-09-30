import { pt } from './pt';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { ru } from './ru';
import { CHECKOUT_TRANSLATIONS } from './checkout';
import { MODULE_TRANSLATIONS } from './modules';

export { pt, en, es, fr, it, ru, CHECKOUT_TRANSLATIONS };

export type LanguageCode = 'pt' | 'es' | 'en' | 'fr' | 'it' | 'ru';

const base: Record<LanguageCode, Record<string, string>> = { pt, en, es, fr, it, ru };

/** Dicionário base de cada idioma mesclado com os módulos de `./modules`. */
export const translations: Record<LanguageCode, Record<string, string>> = Object.fromEntries(
  (Object.keys(base) as LanguageCode[]).map((lang) => [
    lang,
    Object.assign({}, base[lang], ...MODULE_TRANSLATIONS.map((m) => m[lang])),
  ])
) as Record<LanguageCode, Record<string, string>>;
