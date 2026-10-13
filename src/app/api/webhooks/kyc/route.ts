import { NextRequest, NextResponse } from 'next/server';
import { KYCService } from '@/lib/kyc/kycService';
import crypto from 'crypto';
import { safeEqual } from '@/lib/security/secureCompare';
import { initDatabase, pool } from '@/lib/db';

const DIGEST_ALGORITHMS: Record<string, string> = {
  HMAC_SHA1_HEX: 'sha1',
  HMAC_SHA256_HEX: 'sha256',
  HMAC_SHA512_HEX: 'sha512',
};

/** Eventos mais velhos que isso são recusados (reenvio de um corpo capturado). */
const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Webhook de KYC (Sumsub). Autenticação pela assinatura HMAC do corpo bruto
 * (X-Payload-Digest / X-Payload-Digest-Alg) com o segredo próprio do webhook — nunca a chave de
 * API — e cada corpo só é processado uma vez.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.KYC_WEBHOOK_SECRET;

    // Fail-closed: sem segredo configurado o webhook fica desativado
    if (!secret) {
      return NextResponse.json({ error: 'Webhook KYC não configurado.' }, { status: 503 });
    }

    const rawBody = await request.text();
    const algHeader = (request.headers.get('x-payload-digest-alg') || 'HMAC_SHA256_HEX').toUpperCase();
    const algorithm = DIGEST_ALGORITHMS[algHeader];
    const provided = (request.headers.get('x-payload-digest') || '').toLowerCase();
    const expected = algorithm ? crypto.createHmac(algorithm, secret).update(rawBody).digest('hex') : '';
    if (!algorithm || !safeEqual(provided, expected)) {
      return NextResponse.json({ error: 'Assinatura de webhook inválida' }, { status: 401 });
    }
    let payload: Record<string, unknown> = {};

    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = Object.fromEntries(new URLSearchParams(rawBody));
    }

    const createdAtMs = Number(payload.createdAtMs);
    if (Number.isFinite(createdAtMs) && Date.now() - createdAtMs > MAX_EVENT_AGE_MS) {
      return NextResponse.json({ received: true, note: 'stale_event' });
    }

    await initDatabase();
    const claim = await pool.query(
      'INSERT INTO webhook_events (id, provider) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
      [`kyc:${crypto.createHash('sha256').update(rawBody).digest('hex')}`, 'kyc']
    );
    if (claim.rowCount === 0) {
      return NextResponse.json({ received: true, note: 'already_processed' });
    }

    const result = await KYCService.processKYCWebhook(payload);

    return NextResponse.json({
      success: true,
      handled: result.handled,
      kycResult: result.kycResult,
    });
  } catch (err) {
    console.error('[KYC Webhook] Erro:', err);
    return NextResponse.json({ error: 'Erro ao processar webhook KYC' }, { status: 500 });
  }
}
