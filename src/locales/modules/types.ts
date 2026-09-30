/**
 * Dicionários modulares de tradução.
 * Cada módulo agrupa as chaves de uma área (legal, funil público, dashboard...)
 * e usa um prefixo próprio para não colidir com as chaves base de `src/locales/*.ts`.
 */
export type ModuleLanguage = 'pt' | 'en' | 'es' | 'fr' | 'it' | 'ru';

export type ModuleTranslations = Record<ModuleLanguage, Record<string, string>>;

export const emptyModule = (): ModuleTranslations => ({ pt: {}, en: {}, es: {}, fr: {}, it: {}, ru: {} });
