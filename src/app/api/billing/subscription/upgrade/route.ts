import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan, LUMIARDI_PLANS } from '@/lib/payments/plansConfig';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { PlanId, BillingInterval, PaymentGatewayType } from '@/lib/payments/types';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || 'user-model-1';
    const userRole = session?.role || 'criadora';

    const body = await request.json();
    const planId = sanitizeInput(body.planId) as PlanId;
    const interval = (body.interval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const paymentMethod = body.paymentMethod || 'pix';

    if (!planId || !LUMIARDI_PLANS[planId]) {
      return NextResponse.json({ error: 'Plano inválido especificado.' }, { status: 400 });
    }

    const plan = getPlan(planId);
    const isYearly = interval === 'yearly';
    const amount = isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;

    const gateway: PaymentGatewayType = paymentMethod === 'crypto' ? 'nowpayments' : 'ccbill';

    // Cria/Atualiza a assinatura para o novo plano imediatamente
    const updatedSub = await BillingService.createOrRenewSubscription({
      userId,
      gateway,
      planId: plan.id,
      planCategory: plan.category,
      billingInterval: interval,
      amount,
      currency: 'BRL',
      metadata: {
        upgradeReason: `Upgrade para Plano ${plan.name} (${interval === 'yearly' ? 'Anual' : 'Mensal'})`,
        paymentMethod,
        upgradedAt: new Date().toISOString(),
      },
    });

    // Registra transação auditável do upgrade
    const tx = await BillingService.recordTransaction({
      userId,
      subscriptionId: updatedSub.id,
      gateway,
      gatewayTransactionId: `upg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount,
      currency: 'BRL',
      status: 'success',
      paymentMethod: paymentMethod === 'crypto' ? 'crypto' : 'credit_card',
      rawPayload: {
        planId: plan.id,
        planName: plan.name,
        interval,
        paymentMethod,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Upgrade para o plano ${plan.name} realizado com sucesso! Todos os novos limites e recursos foram ativados imediatamente.`,
      subscription: updatedSub,
      plan,
      transactionId: tx.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar upgrade de plano';
    console.error('[API Subscription Upgrade] Erro:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
