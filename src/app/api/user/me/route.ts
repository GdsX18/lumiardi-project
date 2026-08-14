import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Busca o perfil mais recente no Storage
    let fullProfile = null;
    if (session.role === 'criadora') {
      fullProfile = await StorageService.getCreatorById(session.id);
    } else {
      fullProfile = await StorageService.getAgencyById(session.id);
    }

    const currentStatus = fullProfile?.curationStatus
      ? (fullProfile.curationStatus === 'APROVADO' || fullProfile.curationStatus === 'approved')
        ? 'APROVADO'
        : 'EM_CURATORIA'
      : session.curationStatus;

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        curationStatus: currentStatus,
      },
      profile: fullProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao recuperar usuário';
    return NextResponse.json(
      { error: 'Falha ao recuperar sessão.', details: message },
      { status: 500 }
    );
  }
}
