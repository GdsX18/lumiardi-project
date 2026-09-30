import { NextRequest, NextResponse } from 'next/server';
import { KYCService } from '@/lib/kyc/kycService';
import { safeEqual } from '@/lib/security/secureCompare';

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.KYC_WEBHOOK_SECRET || process.env.SUMSUB_SECRET_KEY;

    // Fail-closed: sem segredo configurado o webhook fica desativado
    if (!secret) {
      return NextResponse.json({ error: 'Webhook KYC não configurado.' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('x-kyc-signature') || '';
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!safeEqual(provided, secret)) {
      return NextResponse.json({ error: 'Assinatura de webhook inválida' }, { status: 401 });
    }

    const rawBody = await request.text();
    let payload: Record<string, unknown> = {};

    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = Object.fromEntries(new URLSearchParams(rawBody));
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
