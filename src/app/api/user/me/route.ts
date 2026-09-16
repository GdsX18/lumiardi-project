import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
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
    const currentStatus = (userRecord?.user?.curationStatus as SessionUser['curationStatus']) || session.curationStatus;
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

    const hasStatusChanged = currentStatus !== session.curationStatus;
    const hasNameChanged = Boolean(userRecord?.user?.name && userRecord.user.name !== session.name);

    const updatedSession: SessionUser = {
      ...session,
      curationStatus: currentStatus,
      rejectionReason: rejectionReason,
      name: userRecord?.user?.name || session.name,
    };

    const response = NextResponse.json({
      authenticated: true,
      user: updatedSession,
      profile: fullProfile,
      invoices,
      latestInvoice: invoices[0] || null,
      subscription,
    });

    // Se o status ou nome mudou no banco (ex: curadoria aprovou), atualiza o cookie assinado
    if (hasStatusChanged || hasNameChanged) {
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: encodeSession(updatedSession),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao recuperar usuário';
    return NextResponse.json(
      { error: 'Falha ao recuperar sessão.', details: message },
      { status: 500 }
    );
  }
}
