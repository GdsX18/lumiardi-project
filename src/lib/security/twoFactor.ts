/**
 * LUMIARDI — Persistência segura do 2FA (TOTP)
 * - O segredo TOTP é guardado cifrado (AES-256-GCM) em users.two_factor_secret.
 * - No cadastro (sem sessão), /api/auth/2fa/verify devolve um token de inscrição cifrado pelo servidor:
 *   ele prova que aquele segredo foi validado com um código real e é consumido em /register.
 */

import crypto from 'crypto';

const ENROLLMENT_TTL_MS = 2 * 60 * 60 * 1000; // cobre as etapas 2 e 3 do cadastro

function getKey(): Buffer {
  const base = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!base || base.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[2FA] TOTP_ENCRYPTION_KEY/JWT_SECRET ausente ou fraco (mínimo 32 caracteres) em produção.');
    }
    return crypto.createHash('sha256').update('lumiardi_dev_only_totp_key').digest();
  }
  // Separação de domínio: a chave de cifra nunca é igual ao segredo de assinatura de sessão
  return crypto.createHash('sha256').update(`lumiardi-totp-v1:${base}`).digest();
}

function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ct.toString('base64url')].join('.');
}

function decrypt(payload: string): string | null {
  try {
    const [version, iv, tag, ct] = payload.split('.');
    if (version !== 'v1' || !iv || !tag || !ct) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function encryptTOTPSecret(secret: string): string {
  return encrypt(secret);
}

export function decryptTOTPSecret(stored: string | null | undefined): string | null {
  return stored ? decrypt(stored) : null;
}

export function createEnrollmentToken(secret: string): string {
  return encrypt(JSON.stringify({ p: '2fa-enroll', s: secret, exp: Date.now() + ENROLLMENT_TTL_MS }));
}

/** Retorna o segredo TOTP validado ou null se o token for inválido/expirado. */
export function readEnrollmentToken(token: unknown): string | null {
  if (typeof token !== 'string' || !token) return null;
  const raw = decrypt(token);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { p?: string; s?: string; exp?: number };
    if (data.p !== '2fa-enroll' || typeof data.s !== 'string' || !data.exp || data.exp < Date.now()) return null;
    return data.s;
  } catch {
    return null;
  }
}
