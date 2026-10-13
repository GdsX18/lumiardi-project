import { NextRequest } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import crypto from 'crypto';
import { SESSION_COOKIE_NAME, type SessionUser } from '@/lib/auth';

/**
 * LUMIARDI — Identidade no Lumiardi Meet
 *
 * O participante é sempre derivado da sessão assinada: `<userId>.<aba>`. O cliente só escolhe o
 * sufixo da aba (para duas abas da mesma conta não colidirem), nunca o usuário — assim ninguém
 * consegue ler os sinais WebRTC, sair ou ser expulso no lugar de outra pessoa.
 */

const TAB_RE = /^[a-zA-Z0-9-]{1,24}$/;

export async function getMeetSession(request: NextRequest): Promise<SessionUser | null> {
  return await getActiveSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function resolveMeetParticipantId(session: SessionUser, rawId: unknown): string {
  const prefix = `${session.id}.`;
  let tab = typeof rawId === 'string' ? rawId : '';
  // Aceita de volta o id já resolvido que o servidor devolveu ao cliente
  if (tab.startsWith(prefix)) tab = tab.slice(prefix.length);
  if (!TAB_RE.test(tab)) tab = crypto.randomBytes(4).toString('hex');
  return `${prefix}${tab}`;
}

export function meetUserRole(session: SessionUser): 'agency' | 'model' | 'admin' {
  return session.role === 'agencia' ? 'agency' : session.role === 'admin' ? 'admin' : 'model';
}

/** Ids de sala com 64 bits aleatórios: o código da sala funciona como convite. */
export function newMeetRoomId(): string {
  return `LM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}
