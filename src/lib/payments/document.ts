/**
 * LUMIARDI — Sanitização e validação de documentos/contatos exigidos pelo Asaas.
 * O Asaas aceita apenas dígitos e rejeita CPF/CNPJ com dígito verificador inválido.
 */

export const onlyDigits = (value: unknown): string => String(value ?? '').replace(/\D/g, '');

export function isValidCpf(value: unknown): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function isValidCnpj(value: unknown): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digit = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(cnpj[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13]);
}

/** Retorna o CPF/CNPJ só com dígitos se for válido; caso contrário, undefined. */
export function cleanCpfCnpj(value: unknown): string | undefined {
  const digits = onlyDigits(value);
  if (digits.length === 11 && isValidCpf(digits)) return digits;
  if (digits.length === 14 && isValidCnpj(digits)) return digits;
  return undefined;
}

/** Telefone BR (DDD + número, 10 ou 11 dígitos), removendo o DDI 55 se presente. */
export function cleanPhoneBR(value: unknown): string | undefined {
  let digits = onlyDigits(value);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  return digits.length === 10 || digits.length === 11 ? digits : undefined;
}

/** CEP com 8 dígitos. */
export function cleanPostalCode(value: unknown): string | undefined {
  const digits = onlyDigits(value);
  return digits.length === 8 ? digits : undefined;
}

const pick = (obj: Record<string, unknown> | undefined, keys: string[]): string => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'string' || typeof v === 'number') {
      const str = String(v).trim();
      if (str) return str;
    }
  }
  return '';
};

export type HolderContactField = 'postalCode' | 'addressNumber' | 'phone';

/**
 * CEP, número e telefone do titular para o creditCardHolderInfo do Asaas.
 * Usa o cadastro da conta; o que faltar no perfil vem do formulário do checkout (`provided`).
 * Nunca inventa valores: o que não puder ser resolvido é devolvido em `missing` para o formulário pedir.
 */
export function resolveHolderContact(
  address: Record<string, unknown> | undefined,
  phone: unknown,
  provided: { postalCode?: unknown; addressNumber?: unknown; phone?: unknown } = {}
): { postalCode?: string; addressNumber?: string; phone?: string; missing: HolderContactField[] } {
  const profilePostal = cleanPostalCode(pick(address, ['postalCode', 'cep', 'zipCode', 'zip', 'zipcode']));
  const profileNumber = pick(address, ['addressNumber', 'number', 'numero', 'número']).slice(0, 20);
  const formPostal = cleanPostalCode(provided.postalCode);
  const formNumber = String(provided.addressNumber ?? '').trim().slice(0, 20);

  // CEP e número precisam ser do mesmo endereço: o par do perfil, ou o par informado no formulário
  const fromProfile = Boolean(profilePostal && profileNumber);
  const postalCode = fromProfile ? profilePostal : formPostal;
  const addressNumber = fromProfile ? profileNumber : formNumber || undefined;
  const resolvedPhone = cleanPhoneBR(phone) || cleanPhoneBR(provided.phone);

  const missing: HolderContactField[] = [];
  if (!postalCode) missing.push('postalCode');
  if (!addressNumber) missing.push('addressNumber');
  if (!resolvedPhone) missing.push('phone');

  return { postalCode, addressNumber, phone: resolvedPhone, missing };
}
