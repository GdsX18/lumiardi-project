import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId') || 'curation';

    const messages = await StorageService.listMessages(conversationId);
    return NextResponse.json({ success: true, messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar mensagens';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const text = sanitizeInput(body.text || '');
    const conversationId = body.conversationId || 'curation';
    const attachmentUrl = body.attachmentUrl;
    const attachmentName = body.attachmentName ? sanitizeInput(body.attachmentName) : undefined;
    const attachmentType = body.attachmentType;

    if (!text && !attachmentUrl) {
      return NextResponse.json({ error: 'Mensagem ou anexo é obrigatório.' }, { status: 400 });
    }

    const message = await StorageService.sendMessage({
      senderId: session.id,
      receiverId: body.receiverId,
      conversationId,
      text,
      attachmentUrl,
      attachmentName,
      attachmentType,
    });

    // Disparar notificação para o destinatário da mensagem
    if (body.receiverId && body.receiverId !== session.id) {
      try {
        await StorageService.createNotification({
          userId: body.receiverId,
          title: 'Nova Mensagem Recebida',
          desc: `Mensagem de ${session.name || 'Contato'}: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
          category: 'Chat',
          type: 'info',
          link: `/dashboard/chat?conversationId=${conversationId}`,
          linkText: 'Abrir Conversa',
        });
      } catch (e) {
        console.warn('Erro ao criar notificação de chat:', e);
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
