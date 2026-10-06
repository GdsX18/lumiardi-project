import { NextRequest, NextResponse } from 'next/server';
import { StorageService, ScoutFlowError, getDirectConversationId } from '@/services/storageService';
import { getApprovedMemberSession } from '@/lib/apiAuth';
import { cache } from '@/lib/cache';

function fail(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

/**
 * Resposta da modelo destinatária a uma proposta de agência.
 * Body: { action: 'accept' | 'decline' }
 * - accept: cria o contrato ativo em agency_model_contracts, marca a modelo como representada
 *   e notifica a agência;
 * - decline: encerra a proposta e notifica a agência.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getApprovedMemberSession(['criadora']);
    if (!session) {
      return fail(401, 'unauthorized', 'Somente a modelo destinatária pode responder a esta proposta.');
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    if (!id || (action !== 'accept' && action !== 'decline')) {
      return fail(400, 'invalid_input', "Ação inválida. Use 'accept' ou 'decline'.");
    }

    const { proposal, contract } = await StorageService.respondToScoutProposal({
      proposalId: id,
      modelId: session.id,
      action,
    });

    // O catálogo exibe "representada"/"aberta a ofertas": invalida a vitrine em cache
    if (action === 'accept') await cache.invalidateTag('creators');

    const conversationId = getDirectConversationId(proposal.agencyId, proposal.modelId);
    const accepted = action === 'accept';

    // Registro na conversa e notificação para a agência (não desfazem a resposta se falharem)
    try {
      await StorageService.sendMessage({
        senderId: session.id,
        senderName: proposal.modelName,
        senderRole: 'creator',
        receiverId: proposal.agencyId,
        conversationId,
        text: accepted
          ? `✅ PROPOSTA ACEITA — contrato de agenciamento ativo com comissão de ${contract?.commissionRate || proposal.proposedCommission}.`
          : '❌ PROPOSTA RECUSADA — obrigado pelo interesse.',
      });
    } catch (err) {
      console.warn('[scout] Falha ao registrar a resposta na conversa:', err);
    }

    try {
      await StorageService.createNotification({
        userId: proposal.agencyId,
        title: accepted ? 'Proposta Aceita' : 'Proposta Recusada',
        desc: accepted
          ? `${proposal.modelName} aceitou sua proposta de agenciamento. O contrato já está ativo no seu elenco.`
          : `${proposal.modelName} recusou sua proposta de agenciamento.`,
        category: 'Scout',
        type: accepted ? 'success' : 'warn',
        link: accepted ? '/dashboard/book' : `/dashboard/chat?conversationId=${encodeURIComponent(conversationId)}`,
        linkText: accepted ? 'Ver Elenco' : 'Abrir Conversa',
      });
    } catch (err) {
      console.warn('[scout] Falha ao notificar a agência:', err);
    }

    return NextResponse.json({ success: true, proposal, contract, conversationId });
  } catch (error) {
    if (error instanceof ScoutFlowError) {
      return fail(error.status, error.code, error.message);
    }
    console.error('[scout/proposals PATCH] Erro:', error);
    return fail(500, 'service_unavailable', 'Não foi possível registrar a resposta. Tente novamente.');
  }
}
