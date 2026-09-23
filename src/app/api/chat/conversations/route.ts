import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // Atualiza batimento cardíaco da sessão do usuário
    await StorageService.updateUserLastSeen(session.id);

    // Canais dinâmicos: Curadoria sempre presente + canais diretos condicionados a contratos ativos
    const conversations = await StorageService.listActiveConversations(session.id, session.role);

    return NextResponse.json({ success: true, conversations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar conversas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
