import { NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { getApprovedMemberSession } from '@/lib/apiAuth';

/** Elenco real da agência: somente contratos de agency_model_contracts (não encerrados). */
export async function GET() {
  try {
    const session = await getApprovedMemberSession(['agencia']);
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito a agências aprovadas.', code: 'unauthorized' }, { status: 401 });
    }

    const roster = await StorageService.listAgencyRoster(session.id);
    return NextResponse.json(
      { success: true, roster },
      { headers: { 'Cache-Control': 'private, no-cache' } }
    );
  } catch (error) {
    console.error('[agencies/roster GET] Erro:', error);
    return NextResponse.json({ error: 'Erro ao carregar o elenco.', code: 'service_unavailable' }, { status: 500 });
  }
}
