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

    const metrics = await StorageService.getAdminMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      currentCurator: {
        id: session.id,
        email: session.email,
        name: session.name,
        curationRole: session.curationRole || 'admin',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao obter métricas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
