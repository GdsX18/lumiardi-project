import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const application = await StorageService.getApplicationById(id);

    if (!application) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao recuperar solicitação';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
