import { NextRequest } from 'next/server';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key.toLowerCase()] = value;
    });

    const ccbill = paymentFactory.getCCBillAdapter();

    // 1. Verificação de integridade e assinatura
    const isValid = await ccbill.verifyWebhookSignature(rawBody, headersList);
    if (!isValid) {
      console.warn('[CCBill Webhook] Assinatura inválida detectada.');
      return new Response('Invalid Signature', { status: 401 });
    }

    // 2. Tratamento do evento
    const result = await ccbill.handleWebhook(rawBody, headersList);

    if (result.status === 'success' && result.userId) {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = Object.fromEntries(new URLSearchParams(rawBody));
      }

      const planId = (payload['custom:planId'] as PlanId) || 'radiance';
      const interval = (payload['custom:interval'] as BillingInterval) || 'monthly';
      const plan = getPlan(planId);

      if (result.eventType === 'NewSaleSuccess' || result.eventType === 'RenewalSuccess') {
        const amount = interval === 'yearly' ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;

        // Atualiza/Cria assinatura ativa
        const sub = await BillingService.createOrRenewSubscription({
          userId: result.userId,
          gateway: 'ccbill',
          gatewaySubscriptionId: result.subscriptionId,
          planId: plan.id,
          planCategory: plan.category,
          billingInterval: interval,
          amount,
          currency: 'BRL',
          metadata: {
            eventType: result.eventType,
            ccbillTransactionId: result.transactionId,
            billingDescriptor: 'LMI*BILLING SERVICES',
          },
        });

        // Registra transação auditável
        await BillingService.recordTransaction({
          userId: result.userId,
          subscriptionId: sub.id,
          gateway: 'ccbill',
          gatewayTransactionId: result.transactionId || `tx_${Date.now()}`,
          amount,
          currency: 'BRL',
          status: 'success',
          paymentMethod: 'credit_card',
          rawPayload: payload,
          idempotencyKey: `ccbill_${result.transactionId || result.subscriptionId}`,
        });
      } else if (result.eventType === 'Cancel' || result.eventType === 'Cancellation') {
        await BillingService.cancelSubscription(result.userId);
      }
    }

    // Resposta padrão CCBill DataLink (HTTP 200 com "SUCCESS")
    return new Response('SUCCESS', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err) {
    console.error('[CCBill Webhook] Erro crítico:', err);
    return new Response('Internal Webhook Error', { status: 500 });
  }
}
