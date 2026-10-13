import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import { BillingService } from '@/lib/payments/billingService';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    const userId = session?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    await BillingService.cancelSubscription(userId);

    return NextResponse.json({
      success: true,
      message: 'Sua assinatura foi programada para cancelamento ao fim do ciclo atual. Seu acesso VIP continua ativo até a data de expiração.',
    });
  } catch (err: unknown) {
    // Detalhes (ex.: erros do PostgreSQL) ficam só no log do servidor
    console.error('[API billing/subscription/cancel] Erro:', err);
    return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
  }
}
