import { NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { cache } from '@/lib/cache';
import { getCatalogViewerSession } from '@/lib/apiAuth';
import { toPublicCreator } from '@/lib/creatorDto';

export async function GET() {
  try {
    // Catálogo restrito a agências aprovadas (validado no banco) e à curadoria
    const session = await getCatalogViewerSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito a agências aprovadas.', code: 'forbidden' }, { status: 403 });
    }

    const rawCreators = await cache.getOrSet(
      'api:creators:all',
      async () => {
        return await StorageService.listCreators();
      },
      60, // 60 segundos de TTL
      ['creators']
    );

    // DTO público sem PII (sem e-mail, sem nome legal completo, sem endereço residencial)
    const creators = rawCreators.map(toPublicCreator);

    return NextResponse.json({ success: true, creators });
  } catch (err: unknown) {
    console.error('[creators GET] Erro:', err);
    return NextResponse.json({ error: 'Erro ao listar criadoras.', code: 'service_unavailable' }, { status: 500 });
  }
}
