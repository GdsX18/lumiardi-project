import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { CreatorFilterQuery } from '@/types';
import { cache } from '@/lib/cache';
import { getCatalogViewerSession } from '@/lib/apiAuth';
import { toPublicCreator } from '@/lib/creatorDto';

const MAX_FILTER_VALUES = 20;

function listParam(searchParams: URLSearchParams, name: string): string[] {
  return searchParams
    .getAll(name)
    .map((v) => v.trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, MAX_FILTER_VALUES);
}

function numberParam(searchParams: URLSearchParams, name: string): number | undefined {
  const raw = searchParams.get(name);
  if (raw === null || raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(request: NextRequest) {
  try {
    // Catálogo restrito a agências aprovadas (validado no banco) e à curadoria
    const session = await getCatalogViewerSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito a agências aprovadas.', code: 'forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query: CreatorFilterQuery = {
      category: listParam(searchParams, 'category') as CreatorFilterQuery['category'],
      gender: listParam(searchParams, 'gender') as CreatorFilterQuery['gender'],
      hairColor: listParam(searchParams, 'hairColor'),
      eyeColor: listParam(searchParams, 'eyeColor'),
      skinTone: listParam(searchParams, 'skinTone'),
      minHeight: numberParam(searchParams, 'minHeight'),
      maxHeight: numberParam(searchParams, 'maxHeight'),
      country: searchParams.get('country')?.trim().slice(0, 100) || undefined,
      state: searchParams.get('state')?.trim().slice(0, 100) || undefined,
      searchTerm: searchParams.get('q')?.trim().slice(0, 100) || undefined,
    };

    // Chave de cache a partir dos filtros normalizados (não da query string crua)
    const cacheKey = `api:creators:filter:${JSON.stringify(query)}`;
    const results = await cache.getOrSet(
      cacheKey,
      () => StorageService.filterCreators(query),
      30, // 30s TTL
      ['creators']
    );

    // DTO público sem PII (sem e-mail e sem nome civil)
    const creators = results.map(toPublicCreator);

    return NextResponse.json({
      success: true,
      total: creators.length,
      creators,
    });
  } catch (err: unknown) {
    console.error('[creators/filters GET] Erro:', err);
    return NextResponse.json(
      { error: 'Falha ao buscar criadoras.', code: 'service_unavailable' },
      { status: 500 }
    );
  }
}
