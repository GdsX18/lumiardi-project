import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { getSessionFromCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || (session.role !== 'agencia' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Acesso restrito a agências verificadas.' }, { status: 401 });
    }

    const body = await req.json();
    const { modelId, message, proposedCommission } = body;

    if (!modelId || !message) {
      return NextResponse.json({ error: 'ModelId e mensagem são obrigatórios.' }, { status: 400 });
    }

    // Buscar dados do modelo para validação de aceitação de ofertas
    const targetUser = await StorageService.getUserById(modelId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Modelo não encontrada.' }, { status: 404 });
    }

    const profile = targetUser.profile as any;
    if (profile && profile.accepts_offers === false) {
      return NextResponse.json(
        {
          error: 'Esta modelo já possui contrato e não está recebendo novas ofertas no momento.',
          code: 'OFFERS_DISABLED',
        },
        { status: 403 }
      );
    }

    const modelName = profile?.artistic_name || (targetUser as any)?.fullName || (targetUser as any)?.user?.name || (targetUser as any)?.basicInfo?.fullName || 'Modelo Lumiardi';
    const agencyName = session.name || 'Agência Lumiardi';

    const result = await StorageService.createScoutProposal({
      agencyId: session.id,
      modelId,
      agencyName,
      modelName,
      message,
      proposedCommission: proposedCommission || '20%',
    });

    if (result.blocked) {
      return NextResponse.json(
        {
          error: 'Esta modelo já possui contrato e não está recebendo novas ofertas no momento.',
          code: 'OFFERS_DISABLED',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      message: 'Proposta enviada com sucesso! Uma conversa foi iniciada.',
    });
  } catch (error) {
    console.error('Erro ao enviar proposta de scout:', error);
    return NextResponse.json({ error: 'Erro interno ao processar proposta.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get('agencyId') || (session.role === 'agencia' ? session.id : undefined);
    const modelId = searchParams.get('modelId') || (session.role === 'criadora' ? session.id : undefined);

    const proposals = await StorageService.listScoutProposals({ agencyId, modelId });
    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    return NextResponse.json({ error: 'Erro ao buscar propostas.' }, { status: 500 });
  }
}
