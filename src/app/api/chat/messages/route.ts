import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import {
  conversationIncludesUser,
  getDirectConversationId,
  isOwnChatMessage,
  parseDirectConversationId,
  senderRoleFromSession,
} from '@/lib/chatRoles';

// Cache em memória de nomes de exibição por usuário (TTL: 5 minutos) para eliminar queries redundantes no polling
const displayNameCache = new Map<string, { name: string; expiresAt: number }>();
const DISPLAY_NAME_TTL_MS = 5 * 60 * 1000;

const CURATION_DESK_NAME = 'Mesa de Curadoria Lumiardi';
const MAX_MESSAGE_LENGTH = 5000;

function fail(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

/** Nome de exibição da própria usuária (modelo/agência), com cache. Admin usa o nome do auditor. */
async function resolveDisplayName(session: SessionUser): Promise<string> {
  if (session.role === 'admin') {
    const auditorFirstName = session.name?.split(' ')[0] || 'Curadoria';
    return `Mesa de Curadoria — Auditor ${auditorFirstName}`;
  }

  const cached = displayNameCache.get(session.id);
  if (cached && cached.expiresAt > Date.now()) return cached.name;

  let name = session.name;
  try {
    const userRecord = await StorageService.getUserById(session.id);
    const profile = userRecord?.profile as any;
    if (session.role === 'criadora') {
      name =
        profile?.qualitative?.artisticName ||
        profile?.artistic_name ||
        profile?.artisticName ||
        userRecord?.user?.name ||
        session.name;
    } else if (session.role === 'agencia') {
      name = profile?.basicInfo?.corporateName || profile?.corporate_name || userRecord?.user?.name || session.name;
    }
    displayNameCache.set(session.id, { name, expiresAt: Date.now() + DISPLAY_NAME_TTL_MS });
  } catch {
    name = session.name || 'Você';
  }
  return name;
}

// Relações confirmadas (proposta/candidatura/contrato) por par, para não consultar o banco a cada poll.
// Só resultados positivos entram no cache: uma relação recém-criada libera o canal na hora.
const relationshipCache = new Map<string, number>();
const RELATIONSHIP_TTL_MS = 60 * 1000;

async function hasRelationship(userId: string, partnerId: string): Promise<boolean> {
  const key = [userId, partnerId].sort().join('|');
  const expiresAt = relationshipCache.get(key);
  if (expiresAt && expiresAt > Date.now()) return true;
  const ok = await StorageService.hasDirectRelationship(userId, partnerId);
  if (ok) relationshipCache.set(key, Date.now() + RELATIONSHIP_TTL_MS);
  return ok;
}

/**
 * Autoriza o acesso à conversa:
 * - 'curation': qualquer usuária autenticada vê/escreve apenas a própria conversa com a mesa;
 *   o admin acessa a de qualquer candidata.
 * - conversa direta canônica (conv_A_B): somente os participantes, e só se houver relação real entre
 *   eles (proposta, candidatura ou contrato). O admin acessa qualquer uma.
 * - formato legado (conv-A-B): somente leitura do histórico pelos próprios participantes.
 */
async function canAccessConversation(
  session: SessionUser,
  conversationId: string,
  mode: 'read' | 'write'
): Promise<boolean> {
  if (session.role === 'admin') return true;
  if (conversationId === 'curation') return true;

  const pair = parseDirectConversationId(conversationId);
  if (pair) {
    if (!pair.includes(session.id)) return false;
    // Só o id canônico (ids em ordem): impede canais paralelos para o mesmo par
    if (getDirectConversationId(pair[0], pair[1]) !== conversationId) return false;
    const partnerId = pair[0] === session.id ? pair[1] : pair[0];
    return hasRelationship(session.id, partnerId);
  }

  if (mode === 'read' && conversationId.startsWith('conv-')) {
    return conversationIncludesUser(conversationId, session.id);
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const session = decodeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!session) return fail(401, 'unauthorized', 'Não autenticado.');

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId') || 'curation';
    const since = searchParams.get('since') || undefined;
    const targetUserId = searchParams.get('targetUserId') || searchParams.get('userId') || undefined;

    if (!(await canAccessConversation(session, conversationId, 'read'))) {
      return fail(403, 'forbidden', 'Você não tem acesso a esta conversa.');
    }

    // Mesma consulta para os dois lados: a thread da candidata no canal 'curation' reúne TODAS as
    // mensagens dela (enviadas pela modelo ou pela curadoria), ordenadas por created_at ASC.
    const rawMessages = await StorageService.listMessages(
      conversationId,
      since,
      session.id,
      session.role,
      targetUserId
    );

    // Polling incremental: sem novidades, responde 304 sem corpo
    if (since && rawMessages.length === 0) {
      return new NextResponse(null, {
        status: 304,
        headers: { 'Cache-Control': 'private, no-cache, no-transform' },
      });
    }

    // Marca como lidas as mensagens recebidas (contador de não lidas do admin). Não bloqueia a resposta.
    if (rawMessages.length > 0) {
      StorageService.markMessagesRead({
        conversationId,
        viewerId: session.id,
        viewerRole: session.role,
        targetUserId,
      }).catch((err) => console.warn('[chat] Falha ao marcar mensagens como lidas:', err));
    }

    const myName = await resolveDisplayName(session);

    const messages = rawMessages.map((m) => {
      const senderRole = m.senderRole; // 'admin' | 'creator' | 'agencia' (normalizado no serviço)
      const isMe = isOwnChatMessage({ senderId: m.senderId, senderRole }, session.id, session.role);
      // Nome gravado na própria mensagem (preserva o auditor que a enviou); só as do próprio id usam myName
      const sender = m.senderId === session.id
        ? myName
        : m.senderName || (senderRole === 'admin' ? CURATION_DESK_NAME : 'Usuário Lumiardi');

      return {
        ...m,
        senderRole,
        senderType: senderRole,
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
        currentUserName: myName,
        currentUserRole: session.role,
        messages,
      },
      { headers: { 'Cache-Control': 'private, no-cache, no-transform' } }
    );
  } catch (err: unknown) {
    console.error('[chat/messages GET] Erro:', err);
    return fail(500, 'service_unavailable', 'Erro ao listar mensagens.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = decodeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!session) return fail(401, 'unauthorized', 'Não autenticado.');

    const body = await request.json().catch(() => ({}));
    const text = sanitizeInput(body.text || '');
    const conversationId: string = typeof body.conversationId === 'string' && body.conversationId ? body.conversationId : 'curation';
    const attachmentUrl = typeof body.attachmentUrl === 'string' ? body.attachmentUrl : undefined;
    const attachmentName = body.attachmentName ? sanitizeInput(body.attachmentName) : undefined;
    const attachmentType = typeof body.attachmentType === 'string' ? body.attachmentType : undefined;

    if (!text && !attachmentUrl) {
      return fail(400, 'invalid_input', 'Mensagem ou anexo é obrigatório.');
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      return fail(413, 'invalid_input', 'Mensagem muito longa.');
    }
    // Anexos só podem apontar para a mídia autenticada da plataforma (ou à sala do Lumiardi Meet)
    const isMeetInvite = attachmentType === 'meet' && /^\/dashboard\/meet(\?|$)/.test(attachmentUrl || '');
    if (attachmentUrl && !attachmentUrl.startsWith('/api/media/') && !isMeetInvite) {
      return fail(400, 'invalid_input', 'Anexo inválido.');
    }

    if (!(await canAccessConversation(session, conversationId, 'write'))) {
      return fail(403, 'forbidden', 'Você não tem acesso a esta conversa.');
    }

    // Destinatário definido pelo servidor a partir do papel da remetente:
    // - modelo/agência → mesa de curadoria: sem receiver_id (a conversa é identificada pelo sender_id dela);
    // - admin → candidata: receiverId obrigatório (a thread dela na aba ATENDIMENTO & CHAT);
    // - conversa direta → o outro participante.
    let receiverId: string | undefined;
    if (conversationId === 'curation') {
      if (session.role === 'admin') {
        receiverId = typeof body.receiverId === 'string' ? body.receiverId : undefined;
        if (!receiverId) return fail(400, 'invalid_input', 'Selecione a candidata que receberá a mensagem.');
      }
    } else if (session.role === 'admin') {
      receiverId = typeof body.receiverId === 'string' ? body.receiverId : undefined;
    } else {
      // Canal direto canônico (já validado acima): o destinatário é sempre o outro participante
      const pair = parseDirectConversationId(conversationId);
      if (pair) receiverId = pair[0] === session.id ? pair[1] : pair[0];
    }

    const senderName = await resolveDisplayName(session);

    // Papel canônico definido pelo servidor a partir da sessão — nunca do corpo da requisição
    const senderRole = senderRoleFromSession(session.role);

    // Registra presença no envio (não deve impedir a mensagem)
    StorageService.updateUserLastSeen(session.id).catch(() => {});

    const message = await StorageService.sendMessage({
      senderId: session.id,
      senderName,
      senderRole,
      receiverId,
      conversationId,
      text,
      attachmentUrl,
      attachmentName,
      attachmentType,
    });

    // Notifica o destinatário
    if (receiverId && receiverId !== session.id) {
      try {
        await StorageService.createNotification({
          userId: receiverId,
          title: 'Nova Mensagem Recebida',
          desc: `Mensagem de ${senderName}: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
          category: 'Chat',
          type: 'info',
          link: `/dashboard/chat?conversationId=${encodeURIComponent(conversationId)}`,
          linkText: 'Abrir Conversa',
        });
      } catch (e) {
        console.warn('Erro ao criar notificação de chat:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: { ...message, senderType: message.senderRole, isMe: true, sender: senderName },
    });
  } catch (err: unknown) {
    console.error('[chat/messages POST] Erro:', err);
    return fail(500, 'service_unavailable', 'Não foi possível enviar a mensagem. Tente novamente.');
  }
}
