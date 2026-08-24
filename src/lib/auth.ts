/**
 * Utilitários de Autenticação e Sessão Segura da LUMIARDI
 */

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

/**
 * Codifica o payload de sessão para armazenamento seguro em cookie.
 */
export function encodeSession(user: SessionUser): string {
  const json = JSON.stringify(user);
  return Buffer.from(json).toString('base64');
}

/**
 * Decodifica o payload de sessão a partir do valor do cookie.
 */
export function decodeSession(cookieValue?: string | null): SessionUser | null {
  if (!cookieValue) return null;
  try {
    const json = Buffer.from(cookieValue, 'base64').toString('utf-8');
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
