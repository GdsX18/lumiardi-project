import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    await BillingService.reactivateSubscription(userId);

    return NextResponse.json({
      success: true,
      message: 'Sua assinatura foi reativada com sucesso! A renovação automática continuará garantindo seu acesso VIP.',
    });
  } catch (err: unknown) {
    // Detalhes (ex.: erros do PostgreSQL) ficam só no log do servidor
    console.error('[API billing/subscription/reactivate] Erro:', err);
    return NextResponse.json({ error: 'Erro ao reativar assinatura' }, { status: 500 });
  }
}
