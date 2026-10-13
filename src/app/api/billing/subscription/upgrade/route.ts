import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan, isPlanId } from '@/lib/payments/plansConfig';

import { PlanId, BillingInterval, PaymentGatewayType } from '@/lib/payments/types';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const userId = session.id;

    const body = await request.json();
    const planId = sanitizeInput(body.planId) as PlanId;
    const interval = (body.interval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const paymentMethod: 'credit_card' | 'crypto' | 'pix' =
      body.paymentMethod === 'credit_card' || body.paymentMethod === 'crypto' ? body.paymentMethod : 'pix';

    if (!planId || !isPlanId(planId)) {
      return NextResponse.json({ error: 'Plano inválido especificado.' }, { status: 400 });
    }

    const plan = getPlan(planId);
    const isYearly = interval === 'yearly';
    const amount = isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;

    const gateway: PaymentGatewayType = paymentMethod === 'crypto' ? 'nowpayments' : 'asaas';

    // Registra transação auditável do upgrade PENDENTE
    const txId = `upg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tx = await BillingService.recordTransaction({
      userId,
      subscriptionId: undefined,
      gateway,
      gatewayTransactionId: txId,
      amount,
      currency: 'BRL',
      status: 'pending',
      paymentMethod,
      rawPayload: {
        planId: plan.id,
        planName: plan.name,
        interval,
        paymentMethod,
      },
      idempotencyKey: `upgrade_${txId}`,
    });

    return NextResponse.json({
      success: true,
      message: `Solicitação de upgrade para o plano ${plan.name} recebida. Conclua o pagamento no checkout para ativar os novos recursos.`,
      transactionId: tx.id,
      paymentUrl: `/checkout?plan=${plan.id}&interval=${interval}`,
      pending: true,
    });
  } catch (err: unknown) {
    // Detalhes (ex.: erros do PostgreSQL) ficam só no log do servidor
    console.error('[API billing/subscription/upgrade] Erro:', err);
    return NextResponse.json({ error: 'Erro ao processar upgrade de plano' }, { status: 500 });
  }
}
