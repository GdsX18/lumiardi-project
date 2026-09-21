import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não autenticada.' },
        { status: 401 }
      );
    }

    const userRecord = await StorageService.getUserById(session.id);
    if (!userRecord || !userRecord.profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado.' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: userRecord.user,
      profile: userRecord.profile,
    });

    response.headers.set(
      'Cache-Control',
      'private, max-age=15, stale-while-revalidate=60'
    );

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao recuperar book da criadora';
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar dados do book.', details: message },
      { status: 500 }
    );
  }
}

