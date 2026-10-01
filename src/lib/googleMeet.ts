/**
 * Normaliza o link do Google Meet informado pelo admin.
 * Aceita a URL completa (https://meet.google.com/abc-defg-hij) ou apenas o código (abc-defg-hij).
 * Retorna null para qualquer coisa que não seja uma sala do Google Meet (ex: sala interna do sistema).
 */
const MEET_CODE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

export function normalizeGoogleMeetUrl(input?: string | null): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  if (MEET_CODE.test(raw.toLowerCase())) {
    return `https://meet.google.com/${raw.toLowerCase()}`;
  }

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (url.hostname !== 'meet.google.com') return null;
    const code = url.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    // Também aceita links de "lookup"/apelidos, desde que tenham caminho
    if (!code) return null;
    return `https://meet.google.com/${code}`;
  } catch {
    return null;
  }
}
