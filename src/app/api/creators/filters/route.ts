import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { CreatorFilterQuery } from '@/types';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString() || 'default';
    const cacheKey = `api:creators:filter:${queryString}`;

    const cachedResults = await cache.getOrSet(
      cacheKey,
      async () => {
        const category = searchParams.getAll('category') as CreatorFilterQuery['category'];
        const gender = searchParams.getAll('gender') as CreatorFilterQuery['gender'];
        const hairColor = searchParams.getAll('hairColor');
        const eyeColor = searchParams.getAll('eyeColor');
        const skinTone = searchParams.getAll('skinTone');
        const minHeight = searchParams.get('minHeight') ? Number(searchParams.get('minHeight')) : undefined;
        const maxHeight = searchParams.get('maxHeight') ? Number(searchParams.get('maxHeight')) : undefined;
        const country = searchParams.get('country') || undefined;

        return await StorageService.filterCreators({
          category: category && category.length > 0 ? category : undefined,
          gender: gender && gender.length > 0 ? gender : undefined,
          hairColor: hairColor.length > 0 ? hairColor : undefined,
          eyeColor: eyeColor.length > 0 ? eyeColor : undefined,
          skinTone: skinTone.length > 0 ? skinTone : undefined,
          minHeight,
          maxHeight,
          country,
        });
      },
      30, // 30s TTL
      ['creators']
    );

    return NextResponse.json({
      success: true,
      total: cachedResults.length,
      creators: cachedResults,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao filtrar criadoras';
    return NextResponse.json(
      { error: 'Falha ao buscar criadoras.', details: message },
      { status: 500 }
    );
  }
}
