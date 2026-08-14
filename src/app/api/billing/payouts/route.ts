import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || (request.nextUrl.searchParams.get('userId') || 'user-model-1');
    const payouts = await BillingService.getUserPayouts(userId);

    const totalPaid = payouts
      .filter((p) => p.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalPending = payouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      payouts,
      summary: {
        totalPaid,
        totalPending,
        currency: 'BRL',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar repasses e comissões';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
