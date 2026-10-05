import { NextRequest, NextResponse } from 'next/server';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { withTransaction } from '@/lib/db';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key.toLowerCase()] = value;
    });

    const nowpayments = paymentFactory.getNOWPaymentsAdapter();

    // 1. Verificação de integridade e assinatura HMAC-SHA512
    const isValid = await nowpayments.verifyWebhookSignature(rawBody, headersList);
    if (!isValid) {
      console.warn('[NOWPayments IPN] Assinatura HMAC-SHA512 inválida.');
      return NextResponse.json({ error: 'Assinatura HMAC inválida' }, { status: 401 });
    }

    // 2. Tratamento do evento
    const result = await nowpayments.handleWebhook(rawBody, headersList);

    if (result.status === 'success') {
      const payload = JSON.parse(rawBody);
      const orderId = payload.order_id || '';
      const orderDesc = payload.order_description || '';
      const priceAmount = Number(payload.price_amount || payload.pay_amount || 69.90);
      const payCurrency = (payload.pay_currency || 'USDTTRC20').toUpperCase();
      const cryptoAddress = payload.pay_address || '';
      const txHash = payload.payment_id || `nowpay_${Date.now()}`;

      // Extração de metadados codificados na descrição da ordem
      const planMatch = orderDesc.match(/Plano\s+([a-zA-Z]+)/i);
      const planName = planMatch ? planMatch[1].toLowerCase() : 'radiance';
      const isYearly = orderDesc.toLowerCase().includes('anual');
      const plan = getPlan(planName);

      const userId = result.userId || payload.userId || payload.order_id || '';
      if (!userId) {
        return NextResponse.json({ error: 'User ID missing in payload' }, { status: 400 });
      }

      // Assinatura + fatura + transação numa única transação: falha => ROLLBACK e 500 (gateway reenvia)
      await withTransaction(async (client) => {
        const sub = await BillingService.createOrRenewSubscription({
          userId,
          gateway: 'nowpayments',
          gatewaySubscriptionId: result.subscriptionId,
          planId: plan.id,
          planCategory: plan.category,
          billingInterval: isYearly ? 'yearly' : 'monthly',
          amount: priceAmount,
          currency: 'USD',
          metadata: {
            paymentId: result.transactionId,
            cryptoCurrency: payCurrency,
            cryptoAddress,
            txHash,
            orderId,
          },
        }, client);

        await BillingService.recordTransaction({
          userId,
          subscriptionId: sub.id,
          gateway: 'nowpayments',
          gatewayTransactionId: String(result.transactionId || txHash),
          amount: priceAmount,
          currency: 'USD',
          status: 'success',
          paymentMethod: 'crypto',
          cryptoAddress,
          cryptoAmount: Number(payload.actually_paid || payload.pay_amount || priceAmount),
          cryptoCurrency: payCurrency,
          rawPayload: payload,
          idempotencyKey: `nowpayments_${result.transactionId || txHash}`,
        }, client);
      });
      await cache.delete(`sub:${userId}`).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      handled: result.handled,
      status: result.status,
      message: result.message,
    });
  } catch (err) {
    console.error('[NOWPayments IPN] Erro crítico:', err);
    return NextResponse.json({ error: 'Erro interno ao processar IPN' }, { status: 500 });
  }
}
