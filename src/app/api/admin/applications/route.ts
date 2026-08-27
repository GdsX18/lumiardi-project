import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || searchParams.get('role') || 'all') as 'all' | 'criadora' | 'agencia';
    const status = searchParams.get('status') || undefined;

    const applications = await StorageService.listApplications(type, status);

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar solicitações';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
