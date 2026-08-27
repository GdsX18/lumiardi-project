import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, all } = body;

    if (all || !id) {
      await StorageService.markAllNotificationsAsRead(session.id);
    } else {
      await StorageService.markNotificationAsRead(id, session.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar notificações' }, { status: 500 });
  }
}
