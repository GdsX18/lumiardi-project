import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { cache } from '@/lib/cache';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
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
    const creators = rawCreators.map((creator: any) => {
      const artisticName = creator.qualitative?.artisticName || creator.basicInfo?.fullName || 'Criadora Lumiardi';
      const city = creator.basicInfo?.address?.city || '';
      const state = creator.basicInfo?.address?.state || '';
      const country = creator.basicInfo?.address?.country || 'Brasil';

      return {
        id: creator.id,
        basicInfo: {
          fullName: artisticName,
          address: { city, state, country },
        },
        qualitative: {
          ...creator.qualitative,
          artisticName,
        },
        acceptsOffers: creator.acceptsOffers !== false,
        isRepresented: Boolean(creator.isRepresented),
        representedAgencyName: creator.representedAgencyName,
        photos: creator.photos || [],
        videoUrl: creator.videoUrl || '',
        curationStatus: creator.curationStatus,
        createdAt: creator.createdAt,
      };
    });

    return NextResponse.json({ success: true, creators });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar criadores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
