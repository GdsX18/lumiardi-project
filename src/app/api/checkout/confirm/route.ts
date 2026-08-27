import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { StorageService } from '@/services/storageService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PaymentGatewayType } from '@/lib/payments/types';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const planId = (sanitizeInput(rawBody.planId) || 'glow') as PlanId;
    const billingInterval = (rawBody.billingInterval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const gateway = (rawBody.gateway || 'pix') as PaymentGatewayType;
    const paymentMethod = rawBody.paymentMethod || (gateway === 'pix' ? 'pix' : gateway === 'ccbill' ? 'credit_card' : 'crypto');

    const plan = getPlan(planId);
    const isYearly = billingInterval === 'yearly';
    const priceBRL = isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;

    const userId = session?.id || rawBody.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não identificado. Por favor, complete o cadastro antes do pagamento.' },
        { status: 401 }
      );
    }

    const txId = `${gateway}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Cria a assinatura no BillingService
    const subscription = await BillingService.createOrRenewSubscription({
      userId,
      gateway,
      gatewaySubscriptionId: `sub_${txId}`,
      planId: plan.id,
      planCategory: plan.category,
      billingInterval,
      amount: priceBRL,
      currency: 'BRL',
      metadata: {
        paymentMethod,
        cardLast4: rawBody.cardLast4 || undefined,
        paidAt: new Date().toISOString(),
        userEmail: session?.email || rawBody.userEmail,
        userName: session?.name || rawBody.userName,
      },
    });

    // 2. Registra a transação de pagamento
    await BillingService.recordTransaction({
      userId,
      subscriptionId: subscription.id,
      gateway,
      gatewayTransactionId: txId,
      amount: priceBRL,
      currency: 'BRL',
      status: 'success',
      paymentMethod: paymentMethod === 'crypto' ? 'crypto' : 'credit_card',
      rawPayload: {
        planId: plan.id,
        planName: plan.name,
        billingInterval,
        gateway,
        paidAt: new Date().toISOString(),
      },
      idempotencyKey: `confirm_${txId}`,
    });

    // 3. Cria notificação para o usuário
    try {
      await StorageService.createNotification({
        userId,
        title: 'Pagamento Confirmado',
        desc: `O pagamento do Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) de R$ ${priceBRL.toFixed(2).replace('.', ',')} foi confirmado. Sua candidatura foi enviada com prioridade para a Mesa de Curadoria.`,
        category: 'Pagamentos',
        type: 'success',
        link: '/dashboard/pendente',
        linkText: 'Ver Status da Curadoria',
      });
    } catch (e) {
      console.warn('[Checkout Confirm] Erro ao criar notificação:', e);
    }

    return NextResponse.json({
      success: true,
      subscription,
      amountPaid: priceBRL,
      planName: plan.name,
      message: 'Pagamento confirmado com sucesso. Candidatura em análise pela Curadoria VIP.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar confirmação de pagamento';
    console.error('[Checkout Confirm] Erro:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
