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
  curationStatus: 'EM_CURATORIA' | 'APROVADO' | 'REJEITADO';
  curationRole?: 'curador_junior' | 'curador_senior' | 'supervisor' | 'admin';
  documentName?: string;
  category?: string;
  country?: string;
  city?: string;
  createdAt: string;
}

export const SESSION_COOKIE_NAME = 'lumiardi_session';

/** Recupera o segredo de sessão. Lança erro em produção se não estiver configurado. */
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Auth] JWT_SECRET não está definido em produção.');
    }
    return 'lumiardi_dev_only_fallback_secret_not_for_production';
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
  const json = JSON.stringify(user);
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
    if (parsed && parsed.id && parsed.email && parsed.role) {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function getSessionFromCookie(cookieValue?: string | null): SessionUser | null {
  return decodeSession(cookieValue);
}

