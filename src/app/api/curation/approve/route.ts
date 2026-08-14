import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    let targetId = session?.id;

    // Também aceita id no corpo se enviado por admin
    try {
      const body = await request.json();
      if (body?.id) {
        targetId = body.id;
      }
    } catch {
      // Corpo vazio, usa id da sessão
    }

    if (!targetId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou ID não fornecido.' },
        { status: 400 }
      );
    }

    // Atualiza status no banco
    await StorageService.updateCurationStatus(targetId, 'APROVADO');

    // Se o usuário aprovado for o da sessão atual, atualiza o cookie
    if (session && session.id === targetId) {
      const updatedSession: SessionUser = {
        ...session,
        curationStatus: 'APROVADO',
      };

      const response = NextResponse.json({
        success: true,
        message: 'Status atualizado com sucesso para APROVADO pela Mesa de Curadoria.',
        user: updatedSession,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: encodeSession(updatedSession),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      message: 'Status do usuário atualizado para APROVADO.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao aprovar curadoria';
    return NextResponse.json(
      { error: 'Falha ao processar aprovação de curadoria.', details: message },
      { status: 500 }
    );
  }
}
