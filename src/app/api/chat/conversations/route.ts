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

    const defaultConversations = [
      {
        id: 'curation',
        name: 'Mesa de Curadoria Lumiardi',
        avatarText: 'LM',
        subtitle: 'Suporte Oficial & Compliance VIP',
        lastMessage: lastCurationMsg?.text || 'Bem-vinda à plataforma Lumiardi!',
        lastTime: 'Hoje',
        unreadCount: 0,
        verified: true,
      },
      {
        id: 'agency-aura',
        name: 'Aura Management (Casting)',
        avatarText: 'AM',
        subtitle: 'Diretoria de Casting Internacional',
        lastMessage: 'Proposta de ensaio editorial disponível para revisão.',
        lastTime: 'Ontem',
        unreadCount: 0,
        verified: true,
      },
      {
        id: 'agency-vanguard',
        name: 'Vanguard Talent Co.',
        avatarText: 'VT',
        subtitle: 'Monetização & Contratos',
        lastMessage: 'Alinhamento de cronograma de produção confirmado.',
        lastTime: '2 dias atrás',
        unreadCount: 0,
        verified: true,
      },
    ];

    return NextResponse.json({ success: true, conversations: defaultConversations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar conversas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
