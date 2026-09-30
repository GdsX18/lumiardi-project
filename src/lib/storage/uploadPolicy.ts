/**
 * LUMIARDI — Política de upload
 * Tipos permitidos e tamanhos máximos. Tipos ativos (HTML, SVG, JS, XML) nunca são aceitos,
 * pois seriam executados na origem do site ao serem servidos.
 */

const MB = 1024 * 1024;

export const UPLOAD_LIMITS = {
  image: 25 * MB,
  video: 2048 * MB,
  document: 25 * MB,
  /** Uploads que passam pelo servidor (buffer em memória) — use URL pré-assinada para arquivos maiores */
  serverBuffered: 15 * MB,
};

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
]);

export const ALLOWED_CATEGORIES = new Set([
  'avatars',
  'raw-photos',
  'photos',
  'videos',
  'compostos',
  'book',
  'contracts',
  'briefings',
  'chat',
  'uploads',
  'documents',
]);

export type UploadKind = 'image' | 'video' | 'document';

export function classifyMime(mime: string | null | undefined): UploadKind | null {
  const type = String(mime || '').toLowerCase().split(';')[0].trim();
  if (IMAGE_TYPES.has(type)) return 'image';
  if (VIDEO_TYPES.has(type)) return 'video';
  if (DOCUMENT_TYPES.has(type)) return 'document';
  return null;
}

export type UploadCheck = { ok: true; kind: UploadKind; maxBytes: number } | { ok: false; code: 'upload_type' | 'upload_too_large'; error: string };

/** Valida tipo e tamanho declarados. `size` pode ser omitido quando ainda não é conhecido. */
export function checkUpload(mime: string | null | undefined, size?: number, maxOverride?: number): UploadCheck {
  const kind = classifyMime(mime);
  if (!kind) {
    return { ok: false, code: 'upload_type', error: 'Tipo de arquivo não permitido.' };
  }
  const maxBytes = Math.min(UPLOAD_LIMITS[kind], maxOverride ?? Infinity);
  if (size !== undefined && (!Number.isFinite(size) || size <= 0 || size > maxBytes)) {
    return { ok: false, code: 'upload_too_large', error: 'Arquivo muito grande.' };
  }
  return { ok: true, kind, maxBytes };
}

export function normalizeCategory(raw: unknown, fallback = 'uploads'): string {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return ALLOWED_CATEGORIES.has(value) ? value : fallback;
}
