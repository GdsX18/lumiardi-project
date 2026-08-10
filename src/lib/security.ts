/**
 * Módulo de Cibersegurança Lumiardi
 * Integração de regras de segurança baseadas no Helmet.js, cabeçalhos HTTP seguros e sanitização de inputs.
 */

export interface SecurityHeadersConfig {
  csp: string;
  xFrameOptions: string;
  strictTransportSecurity: string;
  xContentTypeOptions: string;
  xXssProtection: string;
  referrerPolicy: string;
  permissionsPolicy: string;
}

export const SECURITY_HEADERS: SecurityHeadersConfig = {
  // 1. Content Security Policy (CSP) otimizada para Next.js, Google Fonts, Drei Assets e CDNs de mídia
  csp: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://assets.mixkit.co https://raw.githubusercontent.com https://cdn.jsdelivr.net https://*.githubusercontent.com",
    "media-src 'self' data: blob: https://assets.mixkit.co",
    "connect-src 'self' blob: data: https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com https://raw.githubusercontent.com https://*.githubusercontent.com https://cdn.jsdelivr.net https://dl.polyhaven.org https://market-assets.fra1.cdn.digitaloceanspaces.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // 2. Proteção de Frames (Clickjacking)
  xFrameOptions: 'SAMEORIGIN',

  // 4. HSTS (1 ano com subdomínios)
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',

  // 5. No Sniff
  xContentTypeOptions: 'nosniff',

  // 6. XSS Filter
  xXssProtection: '1; mode=block',

  // 7. Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions Policy
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

/**
 * Sanitiza strings para prevenção de injeção de scripts (XSS).
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove tags html diretas
    .replace(/javascript:/gi, '') // Remove pseudo-protocolos js
    .replace(/on\w+=/gi, '') // Remove handlers de eventos inline
    .trim();
}

/**
 * Sanitiza objetos recursivamente.
 */
export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeInput(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeObject(value);
  }
  return result as T;
}
