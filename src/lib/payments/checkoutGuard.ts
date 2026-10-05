/**
 * LUMIARDI — Guard de checkout
 *
 * Toda cobrança exige sessão válida e usa EXCLUSIVAMENTE a identidade do cookie assinado
 * (nunca userId/e-mail vindos do body). O status de curadoria é lido do banco: só pode pagar
 * quem foi aprovada pela Mesa de Curadoria (APROVADA_PAGAMENTO) ou já é membro (APROVADO, renovação).
 */

import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { pool, initDatabase } from '@/lib/db';

export const PAYABLE_STATUSES = ['APROVADA_PAGAMENTO', 'APROVADO'] as const;

export interface PayableUser {
  id: string;
  email: string;
  name: string;
  role: SessionUser['role'];
  curationStatus: string;
  /** CPF/CNPJ do cadastro (perfil), só dígitos — usado no cliente Asaas da conta. */
  documentNumber?: string;
  phone?: string;
  session: SessionUser;
}

export type CheckoutGuardResult = { ok: true; user: PayableUser } | { ok: false; response: NextResponse };

export async function requirePayableUser(request: NextRequest): Promise<CheckoutGuardResult> {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Faça login para concluir o pagamento.', code: 'unauthorized' }, { status: 401 }),
    };
  }

  try {
    await initDatabase();
    const res = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.curation_status, u.phone, p.document_number, p.cnpj
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [session.id]
    );
    const row = res.rows[0];
    if (!row) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Conta não encontrada.', code: 'unauthorized' }, { status: 401 }),
      };
    }
    const status = String(row.curation_status || '').toUpperCase();
    if (!(PAYABLE_STATUSES as readonly string[]).includes(status)) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Seu cadastro ainda não foi aprovado pela curadoria para pagamento.',
            code: 'not_approved_for_payment',
          },
          { status: 403 }
        ),
      };
    }
    return {
      ok: true,
      user: {
        id: String(row.id),
        email: String(row.email),
        name: String(row.full_name || session.name || ''),
        role: session.role,
        curationStatus: status,
        documentNumber: String(row.document_number || row.cnpj || '').replace(/\D/g, '') || undefined,
        phone: row.phone ? String(row.phone) : undefined,
        session,
      },
    };
  } catch (err) {
    console.error('[checkoutGuard] Falha ao validar usuária:', err);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Serviço temporariamente indisponível.', code: 'service_unavailable' },
        { status: 503 }
      ),
    };
  }
}

/** Status do Asaas que representam pagamento efetivamente aprovado/recebido. */
export const ASAAS_PAID_STATUSES = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);

/** Status do Asaas de cobrança ainda em análise (não libera acesso; o webhook conclui). */
export const ASAAS_PROCESSING_STATUSES = new Set(['PENDING', 'AWAITING_RISK_ANALYSIS', 'AUTHORIZED']);
