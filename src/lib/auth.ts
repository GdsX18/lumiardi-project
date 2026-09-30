/**
 * LUMIARDI — Autenticação e Sessão Segura
 *
 * Sessões assinadas com HMAC-SHA256 usando JWT_SECRET.
 * Formato do cookie: base64url(payload).HMAC_HEX
 * Qualquer adulteração no payload invalida a assinatura e rejeita a sessão.
 */

import crypto from 'crypto';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'criadora' | 'agencia' | 'admin';
  curationStatus: 'EM_CURATORIA' | 'AGUARDANDO_REUNIAO' | 'APROVADA_PAGAMENTO' | 'APROVADO' | 'REJEITADO';
  curationRole?: 'curador_junior' | 'curador_senior' | 'supervisor' | 'admin';
  documentName?: string;
  category?: string;
  country?: string;
  city?: string;
  whatsapp?: string;
  interviewDate?: string;
  interviewTime?: string;
  planId?: string;
  planBillingInterval?: string;
  rejectionReason?: string;
  createdAt: string;
  /** Emitido em (epoch segundos) — preenchido por encodeSession */
  iat?: number;
  /** Expira em (epoch segundos) — preenchido por encodeSession */
  exp?: number;
}

export const SESSION_COOKIE_NAME = 'lumiardi_session';

/** Duração da sessão: 7 dias. O `exp` assinado impede o reuso de cookies copiados após o prazo. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Recupera o segredo de sessão. Lança erro em produção se não estiver configurado. */
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Auth] JWT_SECRET ausente ou fraco (mínimo 32 caracteres) em produção.');
    }
    return secret || 'lumiardi_dev_only_fallback_secret_not_for_production';
  }
  return secret;
}

/** Gera a assinatura HMAC-SHA256 de um payload. */
function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/**
 * Codifica e ASSINA o payload de sessão.
 * Formato: {base64url_json}.{hmac_hex}
 */
export function encodeSession(user: SessionUser): string {
  const now = Math.floor(Date.now() / 1000);
  const json = JSON.stringify({ ...user, iat: now, exp: now + SESSION_MAX_AGE_SECONDS });
  const b64 = Buffer.from(json).toString('base64url');
  const hmac = sign(b64);
  return `${b64}.${hmac}`;
}

/**
 * Decodifica e VERIFICA a assinatura do cookie de sessão.
 * Retorna null se o cookie foi adulterado, expirado ou inválido.
 */
export function decodeSession(cookieValue?: string | null): SessionUser | null {
  if (!cookieValue) return null;
  try {
    const dotIndex = cookieValue.lastIndexOf('.');
    if (dotIndex === -1) return null; // Formato sem assinatura (sessão legada ou inválida)

    const b64 = cookieValue.slice(0, dotIndex);
    const providedHmac = cookieValue.slice(dotIndex + 1);

    // Verificação em tempo constante (previne timing attacks)
    const expectedHmac = sign(b64);
    const providedBuf = Buffer.from(providedHmac, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return null; // Assinatura inválida — cookie adulterado
    }

    const json = Buffer.from(b64, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json);
    if (!parsed || !parsed.id || !parsed.email || !parsed.role) return null;
    // Sessões sem expiração (formato antigo) ou expiradas são rejeitadas
    if (typeof parsed.exp !== 'number' || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

/**
 * Grava o cookie de sessão assinado com as flags de segurança padrão.
 * Único ponto de escrita do cookie — use em todas as rotas que autenticam/atualizam a sessão.
 */
export function setSessionCookie(response: NextResponse, user: SessionUser): void {
  // Remove iat/exp antigos: encodeSession emite novos
  const { iat: _iat, exp: _exp, ...fresh } = user;
  void _iat;
  void _exp;
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: encodeSession(fresh),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Remove o cookie de sessão. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}

export async function getSessionFromCookie(cookieValue?: string | null): Promise<SessionUser | null> {
  if (cookieValue !== undefined) {
    return decodeSession(cookieValue);
  }
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return decodeSession(value);
  } catch (e) {
    return null;
  }
}

