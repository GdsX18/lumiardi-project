import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const agencies = await cache.getOrSet(
      'api:agencies:all',
      async () => {
        return await StorageService.listAgencies();
      },
      60, // 60s TTL
      ['agencies']
    );

    return NextResponse.json({ success: true, agencies });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar agências';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
