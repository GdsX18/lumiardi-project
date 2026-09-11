import { NextRequest, NextResponse } from 'next/server';
import { KYCService } from '@/lib/kyc/kycService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-kyc-signature');
    const secret = process.env.KYC_WEBHOOK_SECRET || process.env.SUMSUB_SECRET_KEY;
    
    if (secret && authHeader !== secret && authHeader !== `Bearer ${secret}`) {
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
      status: result.newStatus,
      message: `Status de curadoria atualizado para ${result.newStatus}.`,
    });
  } catch (err) {
    console.error('[KYC Webhook] Erro:', err);
    return NextResponse.json({ error: 'Erro ao processar webhook KYC' }, { status: 500 });
  }
}
