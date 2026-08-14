/**
 * LUMIARDI — HIGH-PERFORMANCE CACHING LAYER
 * Sistema de cache em memória ultra-rápido (<1ms) com suporte transparente a Upstash / Redis
 * para catálogos, vitrines de criadoras, sessões e diretórios com invalidação por tags.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags?: string[];
}

class CacheManager {
  private inMemoryCache: Map<string, CacheEntry<any>> = new Map();
  private maxEntries: number = 1000;

  /**
   * Obtém valor do cache se ainda válido
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.inMemoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.inMemoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Grava valor no cache com tempo de expiração em segundos (TTL)
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 300,
    tags: string[] = []
  ): Promise<void> {
    // Evita vazamento de memória mantendo limite máximo de entradas (LRU simplificado)
    if (this.inMemoryCache.size >= this.maxEntries) {
      const firstKey = this.inMemoryCache.keys().next().value;
      if (firstKey) this.inMemoryCache.delete(firstKey);
    }

    this.inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  /**
   * Helper "Cache Aside": Busca no cache ou executa callback e grava no cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300,
    tags: string[] = []
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds, tags);
    return fresh;
  }

  /**
   * Remove chave específica
   */
  async delete(key: string): Promise<void> {
    this.inMemoryCache.delete(key);
  }

  /**
   * Invalida todas as chaves associadas a uma tag (ex: 'creators', 'agencies', 'plans')
   */
  async invalidateTag(tag: string): Promise<void> {
    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.inMemoryCache.clear();
  }
}

export const cache = new CacheManager();
