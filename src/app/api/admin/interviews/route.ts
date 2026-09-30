import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getVerifiedAdminSession } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Mesa de Curadoria.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const date = searchParams.get('date') || undefined;

    const interviews = await StorageService.getInterviews({ status, date });

    return NextResponse.json({
      success: true,
      interviews,
      count: interviews.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao listar entrevistas';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
