/**
 * LUMIARDI — Controle de acesso a objetos de mídia (R2 / public)
 *
 * Layout de chaves no bucket:
 *   vault/<ownerId>/<category>/<arquivo>                 → espaço privado do usuário
 *   vault/shared/<agencyId>/<modelId>/<category>/<arq>   → espaço compartilhado agência ↔ modelo
 *   qualquer outra chave (ex.: assets/...)               → conteúdo público do site
 */

import type { SessionUser } from '@/lib/auth';

/** Categorias exibidas publicamente (avatar de perfil). */
const PUBLIC_CATEGORIES = new Set(['avatars']);

/** Categorias de portfólio visíveis a qualquer usuário autenticado (agências avaliando talentos). */
const PORTFOLIO_CATEGORIES = new Set(['raw-photos', 'photos', 'videos', 'compostos', 'book']);

/**
 * Anexos de chat: o destinatário precisa abrir o arquivo do remetente.
 * As chaves levam hash aleatório, então exigem sessão + conhecimento da URL.
 */
const AUTHENTICATED_CATEGORIES = new Set(['chat']);

export type MediaAccessLevel = 'public' | 'authenticated' | 'restricted';

export interface ParsedMediaKey {
  key: string;
  isVault: boolean;
  isShared: boolean;
  ownerId?: string;
  agencyId?: string;
  modelId?: string;
  category?: string;
}

/**
 * Normaliza e valida uma chave de mídia. Retorna null para chaves inseguras
 * (travessia de diretório, bytes nulos, barras invertidas, arquivos ocultos).
 */
export function normalizeMediaKey(rawKey: string): string | null {
  if (typeof rawKey !== 'string') return null;
  const key = rawKey.replace(/^\/+/, '');
  if (!key || key.length > 1024) return null;
  if (key.includes('\0') || key.includes('\\')) return null;
  const segments = key.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..' || s.startsWith('.'))) return null;
  return key;
}

export function parseMediaKey(key: string): ParsedMediaKey {
  const segments = key.split('/');
  if (segments[0] !== 'vault') return { key, isVault: false, isShared: false };
  if (segments[1] === 'shared') {
    return {
      key,
      isVault: true,
      isShared: true,
      agencyId: segments[2],
      modelId: segments[3],
      category: segments[4],
    };
  }
  return { key, isVault: true, isShared: false, ownerId: segments[1], category: segments[2] };
}

export function getMediaAccessLevel(parsed: ParsedMediaKey): MediaAccessLevel {
  if (!parsed.isVault) return 'public';
  if (parsed.isShared) return 'restricted';
  const category = parsed.category || '';
  if (PUBLIC_CATEGORIES.has(category)) return 'public';
  if (PORTFOLIO_CATEGORIES.has(category) || AUTHENTICATED_CATEGORIES.has(category)) return 'authenticated';
  return 'restricted';
}

function isStaff(session: SessionUser): boolean {
  return session.role === 'admin' || Boolean(session.curationRole);
}

/** O usuário pode LER o objeto? */
export function canReadMedia(key: string, session: SessionUser | null): boolean {
  const parsed = parseMediaKey(key);
  const level = getMediaAccessLevel(parsed);
  if (level === 'public') return true;
  if (!session) return false;
  if (level === 'authenticated') return true;
  if (isStaff(session)) return true;
  if (parsed.isShared) return session.id === parsed.agencyId || session.id === parsed.modelId;
  return session.id === parsed.ownerId;
}

/** O usuário pode GRAVAR/SOBRESCREVER o objeto? (staff não grava em espaço alheio) */
export function canWriteMedia(key: string, session: SessionUser | null): boolean {
  if (!session) return false;
  const parsed = parseMediaKey(key);
  if (!parsed.isVault) return false;
  if (parsed.isShared) return session.id === parsed.agencyId || session.id === parsed.modelId;
  return session.id === parsed.ownerId;
}
