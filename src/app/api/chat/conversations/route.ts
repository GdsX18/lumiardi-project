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

    const curationMsgs = await StorageService.listMessages('curation');
    const lastCurationMsg = curationMsgs[curationMsgs.length - 1];

    // Apenas canais reais e oficiais
    const conversations = [
      {
        id: 'curation',
        name: 'Mesa de Curadoria Lumiardi',
        avatarText: 'LM',
        subtitle: 'Suporte Oficial & Atendimento VIP',
        lastMessage: lastCurationMsg?.text || 'Canal direto com a equipe de Curadoria e Compliance.',
        lastTime: 'Hoje',
        unreadCount: 0,
        verified: true,
      },
    ];

    return NextResponse.json({ success: true, conversations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar conversas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
