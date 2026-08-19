import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { EmailService } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const status = body.status === 'APROVADO' ? 'APROVADO' : 'REJEITADO';
    const rejectionReason = body.rejectionReason ? sanitizeInput(body.rejectionReason) : undefined;

    if (status === 'REJEITADO' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Por favor, forneça uma justificativa formal para a recusa da credencial.' },
        { status: 400 }
      );
    }

    const success = await StorageService.updateApplicationStatus(id, status, rejectionReason);

    // Dispara e-mail de notificação de decisão da curadoria em segundo plano
    try {
      const userRecord = await StorageService.getUserById(id);
      if (userRecord && userRecord.user?.email) {
        const email = userRecord.user.email;
        const name = userRecord.user.name || 'Candidata';
        const referenceCode = `LUM-${id.substring(0, 8).toUpperCase()}`;
        EmailService.sendKYCStatusEmail(
          email,
          name,
          status === 'APROVADO',
          referenceCode,
          rejectionReason ? [rejectionReason] : undefined
        ).catch((err) => {
          console.warn('[Curation Email] Falha no envio de e-mail de curadoria:', err);
        });
      }
    } catch (e) {
      console.warn('[Curation Email] Erro ao buscar usuário para e-mail:', e);
    }

    return NextResponse.json({
      success,
      status,
      message: status === 'APROVADO' ? 'Credencial aprovada com sucesso.' : 'Credencial recusada com justificativa registrada.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
