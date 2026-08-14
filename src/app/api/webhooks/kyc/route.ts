import { NextRequest, NextResponse } from 'next/server';
import { KYCService } from '@/lib/kyc/kycService';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: Record<string, any> = {};

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
