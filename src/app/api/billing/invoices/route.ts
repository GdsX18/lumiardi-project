import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const requestedUserId = request.nextUrl.searchParams.get('userId');
    const userId = (session?.role === 'admin' && requestedUserId) ? requestedUserId : session?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const invoices = await BillingService.getUserInvoices(userId);

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (err: unknown) {
    // Detalhes (ex.: erros do PostgreSQL) ficam só no log do servidor
    console.error('[API billing/invoices] Erro:', err);
    return NextResponse.json({ error: 'Erro ao listar faturas' }, { status: 500 });
  }
}
