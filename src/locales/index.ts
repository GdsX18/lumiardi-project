import { pt } from './pt';
import { en } from './en';
import { CHECKOUT_TRANSLATIONS } from './checkout';
import { MODULE_TRANSLATIONS } from './modules';

export { pt, en, CHECKOUT_TRANSLATIONS };

export type LanguageCode = 'pt' | 'es' | 'en' | 'fr' | 'it' | 'ru';

type Dictionary = Record<string, string>;

/** Dicionário base de um idioma mesclado com os módulos de `./modules`. */
const merge = (lang: LanguageCode, base: Dictionary): Dictionary =>
  Object.assign({}, base, ...MODULE_TRANSLATIONS.map((m) => m[lang]));

/**
 * Dicionários carregados. pt (idioma base) e en (SSR + fallback) vêm no bundle;
 * es/fr/it/ru (~350 KB) são baixados sob demanda por `loadLanguage`.
 */
export const translations: Partial<Record<LanguageCode, Dictionary>> = {
  pt: merge('pt', pt),
  en: merge('en', en),
};

const loaders: Record<Exclude<LanguageCode, 'pt' | 'en'>, () => Promise<Dictionary>> = {
  es: () => import('./es').then((m) => m.es),
  fr: () => import('./fr').then((m) => m.fr),
  it: () => import('./it').then((m) => m.it),
  ru: () => import('./ru').then((m) => m.ru),
};

const pending: Partial<Record<LanguageCode, Promise<Dictionary>>> = {};

export const isLanguageLoaded = (lang: LanguageCode): boolean => !!translations[lang];

/** Garante o dicionário do idioma em `translations` (idempotente; erros de rede propagam). */
export function loadLanguage(lang: LanguageCode): Promise<Dictionary> {
  const loaded = translations[lang];
  if (loaded) return Promise.resolve(loaded);

  if (!pending[lang]) {
    const loader = loaders[lang as keyof typeof loaders];
    pending[lang] = loader()
      .then((base) => (translations[lang] = merge(lang, base)))
      .finally(() => {
        delete pending[lang];
      });
  }
  return pending[lang]!;
}
