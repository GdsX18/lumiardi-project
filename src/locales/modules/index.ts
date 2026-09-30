import type { ModuleTranslations } from './types';
import { legalDocs } from './legalDocs';
import { legalMisc } from './legalMisc';
import { publicFunnel } from './publicFunnel';
import { dashboardPages } from './dashboardPages';
import { dashboardWidgets } from './dashboardWidgets';
import { apiErrors } from './apiErrors';

export const MODULE_TRANSLATIONS: ModuleTranslations[] = [
  legalDocs,
  legalMisc,
  publicFunnel,
  dashboardPages,
  dashboardWidgets,
  apiErrors,
];
