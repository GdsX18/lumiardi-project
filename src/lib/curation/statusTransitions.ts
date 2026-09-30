/**
 * LUMIARDI — Máquina de estados da curadoria
 *
 * Fluxo normal: EM_CURATORIA → AGUARDANDO_REUNIAO → APROVADA_PAGAMENTO → (pagamento) → APROVADO
 * Qualquer etapa pode ir para REJEITADO; REJEITADO só pode ser reaberto (EM_CURATORIA).
 * Aprovação direta para APROVADO (sem pagamento) é exceção restrita a Supervisor/Administrador.
 */

import type { SessionUser } from '@/lib/auth';

export const CURATION_STATUSES = [
  'EM_CURATORIA',
  'AGUARDANDO_REUNIAO',
  'APROVADA_PAGAMENTO',
  'APROVADO',
  'REJEITADO',
] as const;

export type CurationStatus = (typeof CURATION_STATUSES)[number];

export function isCurationStatus(value: unknown): value is CurationStatus {
  return typeof value === 'string' && (CURATION_STATUSES as readonly string[]).includes(value);
}

const ALLOWED: Record<CurationStatus, CurationStatus[]> = {
  EM_CURATORIA: ['AGUARDANDO_REUNIAO', 'APROVADA_PAGAMENTO', 'REJEITADO'],
  AGUARDANDO_REUNIAO: ['EM_CURATORIA', 'APROVADA_PAGAMENTO', 'REJEITADO'],
  APROVADA_PAGAMENTO: ['EM_CURATORIA', 'AGUARDANDO_REUNIAO', 'REJEITADO'],
  APROVADO: ['APROVADA_PAGAMENTO', 'REJEITADO'],
  REJEITADO: ['EM_CURATORIA'],
};

const CAN_GRANT_WITHOUT_PAYMENT: NonNullable<SessionUser['curationRole']>[] = ['supervisor', 'admin'];

export type TransitionCheck = { ok: true } | { ok: false; status: number; error: string; code: string };

export function checkTransition(
  from: string,
  to: CurationStatus,
  curatorRole: SessionUser['curationRole']
): TransitionCheck {
  const current = (isCurationStatus(from) ? from : 'EM_CURATORIA') as CurationStatus;

  if (current === to) {
    return { ok: false, status: 409, error: 'A candidatura já está neste status.', code: 'forbidden' };
  }

  if (to === 'APROVADO') {
    if (!curatorRole || !CAN_GRANT_WITHOUT_PAYMENT.includes(curatorRole)) {
      return {
        ok: false,
        status: 403,
        error: 'A liberação de acesso sem pagamento é restrita a Supervisor ou Administrador. Use "Aprovar para Pagamento".',
        code: 'forbidden',
      };
    }
    if (current === 'REJEITADO') {
      return { ok: false, status: 409, error: 'Reabra a candidatura antes de aprová-la.', code: 'forbidden' };
    }
    return { ok: true };
  }

  if (!ALLOWED[current].includes(to)) {
    return {
      ok: false,
      status: 409,
      error: `Transição de status não permitida (${current} → ${to}).`,
      code: 'forbidden',
    };
  }
  return { ok: true };
}
