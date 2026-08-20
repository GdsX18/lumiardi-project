import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { cache } from '@/lib/cache';

export async function GET() {
  try {
    const creators = await cache.getOrSet(
      'api:creators:all',
      async () => {
        return await StorageService.listCreators();
      },
      60, // 60 segundos de TTL
      ['creators']
    );

    return NextResponse.json({ success: true, creators });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar criadores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
