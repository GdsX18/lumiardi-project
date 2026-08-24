import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { AuditLogService } from '@/lib/audit/auditService';
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

    const curationRole = session.curationRole || 'curador_junior';

    // Regra RBAC: Curador Júnior não pode aprovar ou recusar aplicações
    if (curationRole === 'curador_junior') {
      return NextResponse.json(
        {
          error: 'Curador Júnior possui permissão somente de leitura e inserção de notas. Aprovação e recusa exigem Curador Sênior, Supervisor ou Administrador.',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
        { status: 403 }
      );
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

    const targetUserRecord = (await StorageService.getUserById(id)) as any;
    const targetName = targetUserRecord?.fullName || targetUserRecord?.user?.name || targetUserRecord?.basicInfo?.fullName || id;

    const success = await StorageService.updateApplicationStatus(id, status, rejectionReason);

    // Registro no Histórico de Auditoria Imutável
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: curationRole,
      actionType: status === 'APROVADO' ? 'APROVOU_MODELO' : 'RECUSOU_MODELO',
      targetId: id,
      targetName,
      targetType: 'MODELO',
      details: {
        status,
        rejectionReason: rejectionReason || null,
        decidedAt: new Date().toISOString(),
      },
      ipAddress: ip,
    });

    // Dispara e-mail de notificação de decisão da curadoria em segundo plano
    try {
      if (targetUserRecord && targetUserRecord.user?.email) {
        const email = targetUserRecord.user.email;
        const name = targetUserRecord.user.name || 'Candidata';
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

