import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';

// Cache em memória de nomes de exibição por usuário (TTL: 5 minutos) para eliminar queries redundantes no polling
const displayNameCache = new Map<string, { name: string; expiresAt: number }>();

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId') || 'curation';
    const since = searchParams.get('since') || undefined;

    const rawMessages = await StorageService.listMessages(conversationId, since, session.id, session.role);

    // Polling incremental ultra-rápido: se o cliente enviou `since` e não há novas mensagens, retorna 304 instantâneo
    if (since && rawMessages.length === 0) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'private, no-cache, no-transform',
        },
      });
    }

    // Identifica perfil e nome artístico com cache em memória (zero overhead no banco durante o polling)
    let myArtisticName = session.name;
    const cached = displayNameCache.get(session.id);
    if (cached && cached.expiresAt > Date.now()) {
      myArtisticName = cached.name;
    } else {
      try {
        const userRecord = await StorageService.getUserById(session.id);
        const profile = userRecord?.profile as any;
        if (session.role === 'criadora') {
          myArtisticName =
            profile?.qualitative?.artisticName ||
            profile?.artistic_name ||
            profile?.artisticName ||
            userRecord?.user?.name ||
            session.name;
        } else if (session.role === 'agencia') {
          myArtisticName =
            profile?.basicInfo?.corporateName ||
            profile?.corporate_name ||
            userRecord?.user?.name ||
            session.name;
        } else {
          myArtisticName = 'Mesa de Curadoria Lumiardi';
        }
        displayNameCache.set(session.id, { name: myArtisticName, expiresAt: Date.now() + 5 * 60 * 1000 });
      } catch {
        myArtisticName = session.name || 'Você';
      }
    }

    const messages = rawMessages.map((m) => {
      const isMe = m.senderId === session.id;
      let sender = m.senderName;

      if (isMe) {
        sender = myArtisticName;
      } else if (!sender) {
        if (m.senderId && (m.senderId.startsWith('admin') || m.senderId.includes('curadoria'))) {
          sender = 'Mesa de Curadoria Lumiardi';
        } else {
          sender = 'Mesa de Curadoria Lumiardi';
        }
      }

      return {
        ...m,
        isMe,
        sender,
        senderName: sender,
      };
    });

    return NextResponse.json(
      {
        success: true,
        conversationId,
        currentUserId: session.id,
        currentUserName: myArtisticName,
        currentUserRole: session.role,
        messages,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-transform',
        },
      }
    );
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

    // Registra batimento cardíaco da presença do usuário no envio
    await StorageService.updateUserLastSeen(session.id);

    const body = await request.json();
    const text = sanitizeInput(body.text || '');
    const conversationId = body.conversationId || 'curation';
    const attachmentUrl = body.attachmentUrl;
    const attachmentName = body.attachmentName ? sanitizeInput(body.attachmentName) : undefined;
    const attachmentType = body.attachmentType;

    if (!text && !attachmentUrl) {
      return NextResponse.json({ error: 'Mensagem ou anexo é obrigatório.' }, { status: 400 });
    }

    // Autoria real: extração direta da sessão ativa ou cache
    let senderName = session.name;
    let senderRole = session.role === 'criadora' ? 'modelo' : session.role === 'agencia' ? 'agencia' : 'curadoria';

    const cached = displayNameCache.get(session.id);
    if (cached && cached.expiresAt > Date.now()) {
      senderName = cached.name;
    } else {
      try {
        const userRecord = await StorageService.getUserById(session.id);
        const profile = userRecord?.profile as any;
        if (session.role === 'criadora') {
          senderName = profile?.qualitative?.artisticName || profile?.artistic_name || profile?.artisticName || userRecord?.user?.name || session.name;
        } else if (session.role === 'agencia') {
          senderName = profile?.basicInfo?.corporateName || profile?.corporate_name || userRecord?.user?.name || session.name;
        } else if (session.role === 'admin') {
          const auditorFirstName = session.name?.split(' ')[0] || session.name || 'Curadoria';
          senderName = `Mesa de Curadoria — Auditor ${auditorFirstName}`;
        }
        displayNameCache.set(session.id, { name: senderName, expiresAt: Date.now() + 5 * 60 * 1000 });
      } catch {}
    }

    // Rejeita nomes genéricos inválidos
    if (!senderName || senderName === 'Lumiardi Member' || senderName.trim() === '') {
      senderName = session.role === 'admin' ? 'Mesa de Curadoria Lumiardi' : (session.name || 'Usuário Lumiardi');
    }

    const message = await StorageService.sendMessage({
      senderId: session.id,
      senderName,
      senderRole,
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
          desc: `Mensagem de ${senderName}: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
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
