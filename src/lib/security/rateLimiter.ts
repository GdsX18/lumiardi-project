/**
 * LUMIARDI — SLIDING WINDOW RATE LIMITER
 * Proteção contra ataques de força bruta, DoS e requisições repetitivas com precisão de milissegundos.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const memoryRateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs: number; // Janela de tempo em ms (ex: 60.000ms = 1 min)
  maxRequests: number; // Máximo de requisições permitidas na janela
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
}

/**
 * Verifica e atualiza o limite de requisições por identificador (IP ou UserID)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 10 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = memoryRateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryRateLimitStore.set(identifier, record);
  }

  // Remove timestamps fora da janela deslizante atual
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetTimeMs = oldestTimestamp + options.windowMs - now;

    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetTimeMs: Math.max(0, resetTimeMs),
    };
  }

  // Registra a nova requisição
  record.timestamps.push(now);

  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - record.timestamps.length,
    resetTimeMs: options.windowMs,
  };
}

/**
 * IP do cliente para rate limiting e auditoria. Só lê headers que a borda sobrescreve — um header
 * que passa direto do cliente (ex.: cf-connecting-ip sem Cloudflare na frente) permitiria trocar
 * de "IP" a cada requisição e furar todos os limites.
 *  - TRUSTED_CLIENT_IP_HEADER: header da borda confiável (ex.: "cf-connecting-ip" com Cloudflare
 *    na frente e a origem fechada para acesso direto).
 *  - Na Vercel: x-vercel-forwarded-for / x-real-ip, que a plataforma reescreve.
 *  - Fora disso: a entrada mais à direita do X-Forwarded-For (a do proxy reverso).
 */
export function getClientIp(headers: Headers): string {
  const firstValue = (v: string | null) => (v ? v.split(',')[0].trim() : '');

  const trustedHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (trustedHeader) {
    const ip = firstValue(headers.get(trustedHeader));
    if (ip) return ip;
  }
  if (process.env.VERCEL) {
    const ip = firstValue(headers.get('x-vercel-forwarded-for')) || firstValue(headers.get('x-real-ip'));
    if (ip) return ip;
  }
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}

/**
 * Rate limit persistente (PostgreSQL, janela fixa) — compartilhado entre instâncias.
 * Em caso de falha do banco, recorre ao limitador em memória da instância.
 */
export async function checkRateLimitPersistent(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 10 }
): Promise<RateLimitResult> {
  try {
    const { pool, initDatabase } = await import('@/lib/db');
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO rate_limits (key, hits, window_start)
       VALUES ($1, 1, NOW())
       ON CONFLICT (key) DO UPDATE SET
         hits = CASE WHEN rate_limits.window_start < NOW() - ($2::int * INTERVAL '1 millisecond') THEN 1 ELSE rate_limits.hits + 1 END,
         window_start = CASE WHEN rate_limits.window_start < NOW() - ($2::int * INTERVAL '1 millisecond') THEN NOW() ELSE rate_limits.window_start END
       RETURNING hits, EXTRACT(EPOCH FROM (window_start + ($2::int * INTERVAL '1 millisecond') - NOW())) * 1000 AS reset_ms`,
      [identifier, options.windowMs]
    );
    const hits = Number(res.rows[0]?.hits || 1);
    const resetTimeMs = Math.max(0, Number(res.rows[0]?.reset_ms || options.windowMs));
    return {
      allowed: hits <= options.maxRequests,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - hits),
      resetTimeMs,
    };
  } catch {
    return checkRateLimit(identifier, options);
  }
}
