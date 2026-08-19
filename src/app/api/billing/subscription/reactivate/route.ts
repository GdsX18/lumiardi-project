import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || 'user-model-1';
    await BillingService.reactivateSubscription(userId);

    return NextResponse.json({
      success: true,
      message: 'Sua assinatura foi reativada com sucesso! A renovação automática continuará garantindo seu acesso VIP.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao reativar assinatura';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
