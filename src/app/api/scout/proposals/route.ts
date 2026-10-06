import { NextRequest, NextResponse } from 'next/server';
import { StorageService, normalizeCommission } from '@/services/storageService';
import { getSessionFromCookie } from '@/lib/auth';
import { getApprovedMemberSession } from '@/lib/apiAuth';
import { sanitizeInput } from '@/lib/security';

const MAX_PROPOSAL_LENGTH = 2000;

function fail(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // Somente agências aprovadas (papel e status conferidos no banco, não no cookie)
    const session = await getApprovedMemberSession(['agencia']);
    if (!session) {
      return fail(401, 'unauthorized', 'Acesso restrito a agências verificadas.');
    }

    const body = await req.json().catch(() => ({}));
    const modelId = typeof body.modelId === 'string' ? body.modelId.trim() : '';
    const message = sanitizeInput(typeof body.message === 'string' ? body.message : '').trim();

    if (!modelId || !message) {
      return fail(400, 'invalid_input', 'ModelId e mensagem são obrigatórios.');
    }
    if (message.length > MAX_PROPOSAL_LENGTH) {
      return fail(413, 'invalid_input', 'Mensagem muito longa.');
    }

    // Alvo precisa ser uma MODELO APROVADA (conferido no banco)
    const [target, agency] = await Promise.all([
      StorageService.getUserById(modelId),
      StorageService.getUserById(session.id),
    ]);
    if (!target || target.user.role !== 'criadora' || target.user.curationStatus !== 'APROVADO') {
      return fail(404, 'not_found', 'Modelo não encontrada.');
    }

    if (target.profile.qualitative?.acceptsOffers === false) {
      return fail(403, 'OFFERS_DISABLED', 'Esta modelo já possui contrato e não está recebendo novas ofertas no momento.');
    }

    if (await StorageService.getAgencyModelContract(session.id, modelId)) {
      return fail(409, 'already_represented', 'Esta modelo já faz parte do seu elenco.');
    }
    if (await StorageService.findOpenScoutRequest(session.id, modelId, 'agency')) {
      return fail(409, 'duplicate_proposal', 'Você já enviou uma proposta para esta modelo e ela ainda não respondeu.');
    }

    // Razão social da agência (não o nome do responsável) e nome artístico da modelo (não o nome civil)
    const agencyName = agency?.profile.basicInfo?.corporateName || session.name || 'Agência Lumiardi';
    const modelName = target.profile.qualitative?.artisticName || 'Modelo Lumiardi';

    const result = await StorageService.createScoutProposal({
      agencyId: session.id,
      modelId,
      agencyName,
      modelName,
      message,
      proposedCommission: normalizeCommission(body.proposedCommission),
      initiatedBy: 'agency',
    });

    try {
      await StorageService.createNotification({
        userId: modelId,
        title: 'Nova Proposta de Agenciamento',
        desc: `A agência "${agencyName}" enviou uma proposta formal de casting com comissão de ${result.proposal.proposedCommission}.`,
        category: 'Scout',
        type: 'invite',
        link: `/dashboard?proposal=${encodeURIComponent(result.proposal.id)}`,
        linkText: 'Responder Proposta',
      });
    } catch (e) {
      console.warn('Erro ao criar notificação de proposta:', e);
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      conversationId: result.conversationId,
      message: 'Proposta enviada com sucesso! Uma conversa foi iniciada.',
    });
  } catch (error) {
    console.error('Erro ao enviar proposta de scout:', error);
    return fail(500, 'service_unavailable', 'Erro interno ao processar proposta.');
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return fail(401, 'unauthorized', 'Não autorizado.');
    }

    const searchParams = req.nextUrl.searchParams;
    let agencyId = searchParams.get('agencyId') || undefined;
    let modelId = searchParams.get('modelId') || undefined;
    const rawInitiatedBy = searchParams.get('initiatedBy');
    const initiatedBy = rawInitiatedBy === 'agency' || rawInitiatedBy === 'model' ? rawInitiatedBy : undefined;

    if (session.role !== 'admin') {
      if (session.role === 'agencia') {
        agencyId = session.id;
        modelId = undefined; // Agência só vê suas próprias propostas
      } else if (session.role === 'criadora') {
        modelId = session.id;
        agencyId = undefined; // Modelo só vê propostas direcionadas a ela
      } else {
        return fail(403, 'forbidden', 'Acesso negado.');
      }
    }

    const proposals = await StorageService.listScoutProposals({ agencyId, modelId, initiatedBy });
    const pendingCount = proposals.filter(
      (p) => p.status === 'sent' && p.initiatedBy === (session.role === 'agencia' ? 'model' : 'agency')
    ).length;

    return NextResponse.json({ success: true, proposals, pendingCount });
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    return fail(500, 'service_unavailable', 'Erro ao buscar propostas.');
  }
}
