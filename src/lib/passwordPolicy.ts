/**
 * LUMIARDI — Política de senha única (cliente e servidor)
 *
 * O mesmo módulo valida no formulário e na API: a regra exibida para o usuário
 * nunca diverge da regra que o servidor aplica. Espaços nas pontas são descartados
 * em todo lugar (cadastro, login e redefinição) para que um espaço acidental
 * colado junto com a senha não a invalide.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRequirement = 'min_length' | 'max_length' | 'letter' | 'number';

/** Requisitos exibidos no checklist do formulário (max_length só aparece quando violado). */
export const PASSWORD_CHECKLIST: Exclude<PasswordRequirement, 'max_length'>[] = ['min_length', 'letter', 'number'];

export function normalizePassword(password: unknown): string {
  return typeof password === 'string' ? password.trim() : '';
}

/** Requisitos ainda não atendidos (lista vazia = senha válida). Letras acentuadas contam como letra. */
export function getPasswordIssues(password: unknown): PasswordRequirement[] {
  const pwd = normalizePassword(password);
  const issues: PasswordRequirement[] = [];
  if (pwd.length < PASSWORD_MIN_LENGTH) issues.push('min_length');
  if (pwd.length > PASSWORD_MAX_LENGTH) issues.push('max_length');
  if (!/\p{L}/u.test(pwd)) issues.push('letter');
  if (!/\d/.test(pwd)) issues.push('number');
  return issues;
}

export function isStrongPassword(password: unknown): password is string {
  return typeof password === 'string' && getPasswordIssues(password).length === 0;
}

const ISSUE_TEXT_PT: Record<PasswordRequirement, string> = {
  min_length: `ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
  max_length: `ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`,
  letter: 'conter pelo menos uma letra',
  number: 'conter pelo menos um número',
};

/** Mensagem explícita (pt) usada pelas APIs: diz exatamente o que falta corrigir. */
export function describePasswordIssues(issues: PasswordRequirement[]): string {
  const base = `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres, incluindo pelo menos uma letra e um número.`;
  if (issues.length === 0) return base;
  const missing = issues.map((i) => ISSUE_TEXT_PT[i]);
  const list = missing.length > 1 ? `${missing.slice(0, -1).join(', ')} e ${missing[missing.length - 1]}` : missing[0];
  return `${base} Sua senha ainda precisa ${list}.`;
}
