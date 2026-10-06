/**
 * LUMIARDI — Papéis de remetente no chat
 *
 * Valores canônicos gravados em `messages.sender_role`: 'admin' (Mesa de Curadoria), 'creator' (modelo)
 * e 'agencia'. Linhas antigas guardam 'curadoria' / 'modelo'; todos os leitores devem aceitar os dois
 * conjuntos, então use estes helpers (e `ADMIN_ROLE_VALUES` no SQL) em vez de comparar strings.
 */

export type ChatSenderRole = 'admin' | 'creator' | 'agencia';

/** Valores de `sender_role` que representam a Mesa de Curadoria (canônico + legado). */
export const ADMIN_ROLE_VALUES = ['admin', 'curadoria'] as const;

export function isAdminRole(raw?: string | null): boolean {
  const role = String(raw || '').toLowerCase();
  return (ADMIN_ROLE_VALUES as readonly string[]).includes(role);
}

/** Heurística para linhas antigas sem `sender_role`: ids da curadoria (admin-…, cur-…, …curadoria…). */
export function isStaffSenderId(senderId?: string | null): boolean {
  const id = String(senderId || '').toLowerCase();
  return id.startsWith('admin') || id.startsWith('cur-') || id.includes('curadoria');
}

/** Normaliza qualquer valor (novo ou legado) para o papel canônico. */
export function normalizeSenderRole(raw?: string | null, senderId?: string | null): ChatSenderRole {
  const role = String(raw || '').toLowerCase();
  if (isAdminRole(role) || (!role && isStaffSenderId(senderId))) return 'admin';
  if (role === 'agencia') return 'agencia';
  if (role === 'creator' || role === 'modelo' || role === 'criadora') return 'creator';
  return isStaffSenderId(senderId) ? 'admin' : 'creator';
}

/** Papel canônico a gravar a partir do papel da sessão autenticada. */
export function senderRoleFromSession(sessionRole: string): ChatSenderRole {
  if (sessionRole === 'criadora') return 'creator';
  if (sessionRole === 'agencia') return 'agencia';
  return 'admin';
}

/** Papel canônico do usuário que está vendo o chat (aceita papéis de sessão e de mensagem). */
function viewerSenderRole(raw?: string | null): ChatSenderRole | null {
  const role = String(raw || '').toLowerCase();
  if (!role) return null;
  if (isAdminRole(role)) return 'admin';
  if (role === 'agencia') return 'agencia';
  if (role === 'criadora' || role === 'creator' || role === 'modelo') return 'creator';
  return null;
}

/**
 * A mensagem é do usuário autenticado ("minha", alinhada à direita)? Mesma regra nos dois lados:
 * mesmo `sender_id` da sessão, ou mesmo papel (a modelo vê as mensagens 'creator' da thread dela como suas;
 * o admin vê todas as mensagens da Mesa de Curadoria como suas).
 */
export function isOwnChatMessage(
  msg: { senderId?: string | null; senderRole?: string | null },
  currentUserId?: string | null,
  currentUserRole?: string | null
): boolean {
  if (currentUserId && msg.senderId && String(msg.senderId) === String(currentUserId)) return true;
  const viewer = viewerSenderRole(currentUserRole);
  if (!viewer) return false;
  return normalizeSenderRole(msg.senderRole, msg.senderId) === viewer;
}

/** Id canônico do canal direto entre dois usuários: `conv_<menor>_<maior>` (independe da ordem). */
export function getDirectConversationId(id1: string, id2: string): string {
  return ['conv', ...[id1, id2].sort()].join('_');
}

/** Participantes de um canal direto canônico `conv_<a>_<b>` (exatamente dois ids); null se não for um. */
export function parseDirectConversationId(conversationId: string): [string, string] | null {
  if (!conversationId.startsWith('conv_')) return null;
  const parts = conversationId.slice(5).split('_');
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[0] === parts[1]) return null;
  return [parts[0], parts[1]];
}

/**
 * A conversa pertence a `userId`? Aceita `conv_<a>_<b>` (exato) e o formato legado `conv-<a>-<b>`,
 * comparado por prefixo/sufixo exatos (nunca por substring: um id não pode "caber" dentro de outro).
 */
export function conversationIncludesUser(conversationId: string, userId: string): boolean {
  if (!userId) return false;
  const pair = parseDirectConversationId(conversationId);
  if (pair) return pair.includes(userId);
  if (conversationId.startsWith('conv-')) {
    return conversationId.startsWith(`conv-${userId}-`) || conversationId.endsWith(`-${userId}`);
  }
  return false;
}
