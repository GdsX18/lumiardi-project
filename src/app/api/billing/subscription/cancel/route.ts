import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || 'user-model-1';
    await BillingService.cancelSubscription(userId);

    return NextResponse.json({
      success: true,
      message: 'Sua assinatura foi programada para cancelamento ao fim do ciclo atual. Seu acesso VIP continua ativo até a data de expiração.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao cancelar assinatura';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
