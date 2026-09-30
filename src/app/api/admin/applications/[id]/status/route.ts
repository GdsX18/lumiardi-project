import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { AuditLogService } from '@/lib/audit/auditService';
import { getVerifiedAdminSession } from '@/lib/apiAuth';
import { checkTransition, isCurationStatus } from '@/lib/curation/statusTransitions';
import { getClientIp } from '@/lib/security/rateLimiter';
import { pool } from '@/lib/db';
import { sanitizeInput } from '@/lib/security';
import { EmailService } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getVerifiedAdminSession();

    if (!session) {
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

    // Status desconhecido é erro — nunca cai para REJEITADO (que dispara reembolso automático)
    if (!isCurationStatus(body.status)) {
      return NextResponse.json({ error: 'Status inválido.', code: 'invalid_input' }, { status: 400 });
    }
    const status = body.status;
    const rejectionReason = body.rejectionReason ? sanitizeInput(body.rejectionReason) : undefined;

    if (status === 'REJEITADO' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Por favor, forneça uma justificativa formal para a recusa da credencial.' },
        { status: 400 }
      );
    }

    const currentRes = await pool.query('SELECT curation_status FROM users WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Candidatura não encontrada.', code: 'not_found' }, { status: 404 });
    }
    const previousStatus = String(currentRes.rows[0].curation_status || '').toUpperCase();
    const transition = checkTransition(previousStatus, status, curationRole);
    if (!transition.ok) {
      return NextResponse.json({ error: transition.error, code: transition.code }, { status: transition.status });
    }

    const targetUserRecord = (await StorageService.getUserById(id)) as any;
    const targetName = targetUserRecord?.fullName || targetUserRecord?.user?.name || targetUserRecord?.basicInfo?.fullName || id;

    const success = await StorageService.updateApplicationStatus(id, status, rejectionReason);
    if (!success) {
      return NextResponse.json({ error: 'Candidatura não encontrada.', code: 'not_found' }, { status: 404 });
    }

    // Sincroniza tabela curation_interviews
    if (status === 'APROVADA_PAGAMENTO') {
      await StorageService.updateInterviewStatus(id, 'aprovada', undefined, session.id);
      try {
        await StorageService.createNotification({
          userId: id,
          title: 'Entrevista de Curadoria Aprovada',
          desc: 'Parabéns! Sua entrevista foi homologada pela Mesa de Curadoria. Seu pagamento foi liberado para ativação imediata do seu acesso.',
          category: 'Curadoria',
          type: 'success',
          link: '/dashboard/pendente',
          linkText: 'Efetuar Pagamento',
        });
      } catch (notifErr) {
        console.warn('Erro ao criar notificação:', notifErr);
      }
    } else if (status === 'REJEITADO') {
      await StorageService.updateInterviewStatus(id, 'recusada', rejectionReason, session.id);
    }

    let refundInfo: { refunded: boolean; refundCode?: string; amount?: number; currency?: string; manualReviewRequired?: boolean; message: string } | null = null;

    // Reembolso automático só faz sentido para quem pagou (estava APROVADO)
    if (status === 'REJEITADO' && previousStatus === 'APROVADO') {
      try {
        const { BillingService } = await import('@/lib/payments/billingService');
        refundInfo = await BillingService.processAutomatedRefund({
          userId: id,
          reason: rejectionReason || 'Candidatura não aprovada pela Curadoria',
          curatorId: session.id,
        });

        if (refundInfo.refunded) {
          // Cria notificação formal de estorno para o usuário
          await StorageService.createNotification({
            userId: id,
            title: 'Estorno Solicitado',
            desc: `Sua credencial não foi mantida pela Curadoria. O estorno de ${refundInfo.currency === 'BRL' ? 'R$ ' : '$'}${refundInfo.amount?.toFixed(2).replace('.', ',')} foi solicitado para a sua forma original de pagamento e pode levar alguns dias úteis para aparecer (Código: ${refundInfo.refundCode}).`,
            category: 'Financeiro',
            type: 'info',
            link: '/dashboard/pendente',
            linkText: 'Ver Comprovante de Estorno',
          });
        }
      } catch (refundErr) {
        console.error('[Curation Rejection] Erro ao processar reembolso automático:', refundErr);
      }
    }

    // Registro no Histórico de Auditoria Imutável
    const ip = getClientIp(request.headers);
    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: curationRole,
      actionType: status === 'APROVADO'
        ? 'APROVOU_MODELO'
        : status === 'APROVADA_PAGAMENTO'
        ? 'APROVOU_PARA_PAGAMENTO'
        : status === 'AGUARDANDO_REUNIAO' || status === 'EM_CURATORIA'
        ? 'REABRIU_CANDIDATURA'
        : 'RECUSOU_MODELO',
      targetId: id,
      targetName,
      targetType: 'MODELO',
      details: {
        status,
        previousStatus,
        rejectionReason: rejectionReason || null,
        refund: refundInfo || null,
        decidedAt: new Date().toISOString(),
      },
      ipAddress: ip,
    });

    // Dispara e-mail de notificação de decisão da curadoria em segundo plano
    try {
      if (targetUserRecord && (targetUserRecord.user?.email || targetUserRecord.email)) {
        const email = targetUserRecord.user?.email || targetUserRecord.email;
        const name = targetUserRecord.user?.name || targetUserRecord.fullName || 'Candidata';
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

    // ─── Mensagem de Boas-Vindas (Onboarding) ────────────────────────────────
    // Disparada uma única vez quando a conta é aprovada.
    // Verificação de idempotência: checa se já existe uma mensagem de boas-vindas
    // para este utilizador no canal 'curation', evitando duplicação em re-aprovações.
    if (status === 'APROVADO') {
      // Notificar a utilizadora da aprovação
      try {
        await StorageService.createNotification({
          userId: id,
          title: 'Credencial Lumiardi Aprovada',
          desc: 'A sua candidatura foi homologada pela Mesa de Curadoria. Bem-vinda ao ecossistema Lumiardi. Aceda ao seu painel para começar.',
          category: 'Curadoria',
          type: 'success',
          link: '/dashboard',
          linkText: 'Acessar Painel',
        });
      } catch (notifErr) {
        console.error('[status/APROVADO] Failed to create notification (non-fatal):', notifErr);
      }
      try {
        const welcomeRes = await pool.query(
          `SELECT 1 FROM messages
           WHERE conversation_id = 'curation' AND receiver_id = $1 AND sender_role = 'curadoria'
             AND text LIKE '%canal oficial da Curadoria Lumiardi%'
           LIMIT 1`,
          [id]
        );
        const alreadySentWelcome = welcomeRes.rows.length > 0;

        if (!alreadySentWelcome) {
          const auditorFirstName = session.name?.split(' ')[0] || 'Curadoria';
          await StorageService.sendMessage({
            senderId: session.id,
            senderName: `Mesa de Curadoria — Auditor ${auditorFirstName}`,
            senderRole: 'curadoria',
            receiverId: id,
            conversationId: 'curation',
            text: 'Bem-vinda ao canal oficial da Curadoria Lumiardi. Este é o seu espaço criptografado e prioritário para suporte, dúvidas contratuais e alinhamentos de casting.',
          });
        }
      } catch (msgErr) {
        console.warn('[Curation Welcome] Erro ao enviar mensagem de boas-vindas:', msgErr);
      }
    }

    return NextResponse.json({
      success,
      status,
      refund: refundInfo,
      message: status === 'APROVADO'
        ? 'Credencial aprovada com sucesso.'
        : status === 'EM_CURATORIA'
          ? 'Credencial reaberta e reencaminhada para a Mesa de Curadoria.'
          : refundInfo?.refunded
            ? `Credencial recusada. Estorno de ${refundInfo.currency === 'BRL' ? 'R$ ' : '$'}${refundInfo.amount?.toFixed(2).replace('.', ',')} solicitado ao gateway (Código: ${refundInfo.refundCode}).${refundInfo.manualReviewRequired ? ' Há pagamentos que exigem estorno manual.' : ''}`
            : 'Credencial recusada com justificativa formal registrada.',
    });
  } catch (err: unknown) {
    console.error('[admin/status] Erro ao atualizar status:', err);
    return NextResponse.json({ error: 'Erro ao atualizar status.', code: 'generic' }, { status: 500 });
  }
}

