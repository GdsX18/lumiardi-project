import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { getApprovedMemberSession } from '@/lib/apiAuth';
import { sanitizeInput } from '@/lib/security';

const MAX_PITCH_LENGTH = 2000;
const DEFAULT_PITCH = 'Gostaria de apresentar meu book para casting.';

function fail(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

/**
 * Candidatura direta da modelo a uma agência (modelo → agência).
 * Grava em scout_proposals (initiated_by = 'model'), abre o canal canônico conv_<a>_<b> com a
 * mensagem formal e notifica a agência.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getApprovedMemberSession(['criadora']);
    if (!session) {
      return fail(401, 'unauthorized', 'Acesso restrito a modelos aprovadas.');
    }

    const body = await req.json().catch(() => ({}));
    const agencyId = typeof body.agencyId === 'string' ? body.agencyId.trim() : '';
    const pitch = sanitizeInput(typeof body.message === 'string' ? body.message : '').trim() || DEFAULT_PITCH;

    if (!agencyId) return fail(400, 'invalid_input', 'Agência obrigatória.');
    if (pitch.length > MAX_PITCH_LENGTH) return fail(413, 'invalid_input', 'Mensagem muito longa.');

    const [agency, model] = await Promise.all([
      StorageService.getUserById(agencyId),
      StorageService.getUserById(session.id),
    ]);
    if (!agency || agency.user.role !== 'agencia' || agency.user.curationStatus !== 'APROVADO') {
      return fail(404, 'not_found', 'Agência não encontrada.');
    }

    if (await StorageService.getAgencyModelContract(agencyId, session.id)) {
      return fail(409, 'already_represented', 'Você já faz parte do elenco desta agência.');
    }
    if (await StorageService.findOpenScoutRequest(agencyId, session.id, 'model')) {
      return fail(409, 'duplicate_application', 'Você já enviou uma candidatura para esta agência.');
    }

    const agencyName = agency.profile.basicInfo?.corporateName || agency.user.name || 'Agência Lumiardi';
    const modelName = model?.profile.qualitative?.artisticName || 'Modelo Lumiardi';

    const { proposal, conversationId } = await StorageService.createScoutProposal({
      agencyId,
      modelId: session.id,
      agencyName,
      modelName,
      message: pitch,
      initiatedBy: 'model',
    });

    try {
      await StorageService.createNotification({
        userId: agencyId,
        title: 'Nova Candidatura de Casting',
        desc: `${modelName} enviou o book e uma candidatura para a sua agência.`,
        category: 'Scout',
        type: 'invite',
        link: `/dashboard/chat?conversationId=${encodeURIComponent(conversationId)}`,
        linkText: 'Abrir Conversa',
      });
    } catch (err) {
      console.warn('[scout/applications] Falha ao notificar a agência:', err);
    }

    return NextResponse.json({ success: true, application: proposal, conversationId });
  } catch (error) {
    console.error('[scout/applications POST] Erro:', error);
    return fail(500, 'service_unavailable', 'Não foi possível enviar a candidatura. Tente novamente.');
  }
}
