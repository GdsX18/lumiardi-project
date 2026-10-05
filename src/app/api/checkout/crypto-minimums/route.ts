import { NextResponse } from 'next/server';
import { NOWPaymentsAdapter } from '@/lib/payments/nowpaymentsAdapter';
import { CRYPTO_CURRENCIES, CryptoCurrency } from '@/lib/payments/types';

/** O mínimo oscila com a taxa de rede: 10 minutos de cache poupam a API do NOWPayments sem ficar defasado. */
const TTL_MS = 10 * 60 * 1000;
let cached: { at: number; minimums: Partial<Record<CryptoCurrency, number>> } | null = null;

/**
 * Valor mínimo (USD) aceito pelo NOWPayments por moeda. O checkout usa para desativar as moedas
 * (ou a aba de cripto inteira) cujo mínimo o plano não alcança. Moeda sem mínimo conhecido é omitida.
 */
export async function GET() {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    const adapter = new NOWPaymentsAdapter();
    const values = await Promise.all(CRYPTO_CURRENCIES.map((c) => adapter.getMinimumUsd(c.toLowerCase())));
    const minimums: Partial<Record<CryptoCurrency, number>> = {};
    CRYPTO_CURRENCIES.forEach((c, i) => {
      if (values[i] !== undefined) minimums[c] = values[i];
    });
    // Falha total (API fora / sem chave) não é cacheada: a próxima requisição tenta de novo
    if (Object.keys(minimums).length === 0) {
      return NextResponse.json({ minimums }, { headers: { 'Cache-Control': 'no-store' } });
    }
    cached = { at: Date.now(), minimums };
  }

  return NextResponse.json(
    { minimums: cached.minimums },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=600' } }
  );
}
