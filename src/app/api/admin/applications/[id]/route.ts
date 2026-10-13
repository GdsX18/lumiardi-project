import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getVerifiedAdminSession } from '@/lib/apiAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getVerifiedAdminSession();

    if (!session) {
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
    console.error('[api/admin/applications/[id]] Erro:', err);
    const message = 'Erro ao recuperar solicitação';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
