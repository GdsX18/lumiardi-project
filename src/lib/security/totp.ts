/**
 * LUMIARDI — TOTP 2FA ENGINE (RFC 6238)
 * Implementação nativa em Node.js Crypto (Compatível com Google Authenticator, Authy e 1Password)
 */

import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Codifica um buffer em string Base32 RFC 4648
 */
export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodifica uma string Base32 em Buffer
 */
export function decodeBase32(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Gera um segredo aleatório Base32 de 20 bytes (160 bits)
 */
export function generateTOTPSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return encodeBase32(randomBytes);
}

/**
 * Gera o código TOTP de 6 dígitos para o timestamp atual (janela de 30 segundos)
 */
export function generateTOTP(secretBase32: string, time = Date.now(), timeStep = 30): string {
  const key = decodeBase32(secretBase32);
  const counter = Math.floor(time / 1000 / timeStep);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Valida o código TOTP fornecido pelo usuário com tolerância de janela (skew de ±2 períodos = 60s)
 */
export function verifyTOTP(
  token: string,
  secretBase32: string,
  time = Date.now(),
  window = 2,
  timeStep = 30
): boolean {
  if (!token) return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6) return false;

  const currentCounter = Math.floor(time / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const stepTime = (currentCounter + i) * timeStep * 1000;
    const generated = generateTOTP(secretBase32, stepTime, timeStep);
    if (cleanToken === generated) {
      return true;
    }
  }

  return false;
}

/**
 * Gera URL para QR Code (otpauth:// URI)
 */
export function getTOTPAuthUri(accountEmail: string, secretBase32: string, issuer = 'Lumiardi Luxury'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountEmail);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Gera URL de imagem de QR Code pronta para exibição no frontend
 */
export function getQRCodeImageUrl(otpauthUri: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otpauthUri)}`;
}
