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

    const rawAgencies = await cache.getOrSet(
      'api:agencies:all',
      async () => {
        return await StorageService.listAgencies();
      },
      60, // 60s TTL
      ['agencies']
    );

    // DTO público sem PII (sem e-mail, sem CNPJ, sem endereço físico completo)
    const agencies = rawAgencies.map((agency: any) => {
      const corporateName = agency.basicInfo?.corporateName || 'Agência Lumiardi';
      const city = agency.basicInfo?.address?.city || '';
      const state = agency.basicInfo?.address?.state || '';
      const country = agency.basicInfo?.address?.country || 'Brasil';

      return {
        id: agency.id,
        name: corporateName,
        image: agency.image || '',
        basicInfo: {
          corporateName,
          address: { city, state, country },
        },
        qualitative: {
          category: agency.qualitative?.category || 'Agência de Casting',
          commissionRate: agency.qualitative?.commissionRate || '20%',
          specialties: agency.qualitative?.specialties || [],
          instagram: agency.qualitative?.instagram || '',
          bio: agency.qualitative?.bio || '',
        },
        curationStatus: agency.curationStatus,
        createdAt: agency.createdAt,
      };
    });

    return NextResponse.json({ success: true, agencies });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar agências';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
