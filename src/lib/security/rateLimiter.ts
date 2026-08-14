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
