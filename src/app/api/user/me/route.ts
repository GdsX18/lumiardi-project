import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Busca o usuário e perfil mais recente no Storage
    const userRecord = await StorageService.getUserById(session.id);
    const fullProfile = userRecord?.profile || null;
    const currentStatus = userRecord?.user?.curationStatus || session.curationStatus;
    const rejectionReason = userRecord?.user?.rejectionReason;

    // Busca faturas e assinaturas para exibição de status financeiro / comprovante de estorno
    let invoices: any[] = [];
    let subscription: any = null;
    try {
      const { BillingService } = await import('@/lib/payments/billingService');
      invoices = await BillingService.getUserInvoices(session.id);
      subscription = await BillingService.getUserSubscription(session.id);
    } catch {
      // Silencioso se billing offline
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        curationStatus: currentStatus,
        rejectionReason: rejectionReason,
        name: userRecord?.user?.name || session.name,
      },
      profile: fullProfile,
      invoices,
      latestInvoice: invoices[0] || null,
      subscription,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao recuperar usuário';
    return NextResponse.json(
      { error: 'Falha ao recuperar sessão.', details: message },
      { status: 500 }
    );
  }
}
