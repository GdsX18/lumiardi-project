import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || (request.nextUrl.searchParams.get('userId') || 'user-model-1');
    const invoices = await BillingService.getUserInvoices(userId);

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar faturas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
