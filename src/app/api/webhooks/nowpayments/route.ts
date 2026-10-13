import { NextRequest, NextResponse } from 'next/server';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan, isPlanId } from '@/lib/payments/plansConfig';
import { withTransaction } from '@/lib/db';
import { cache } from '@/lib/cache';

/**
 * IPN da NOWPayments.
 * - Quem pagou, qual plano e quanto vêm da transação pendente gravada pelo servidor em
 *   /api/checkout/create-session (chave: payment_id) — nunca de texto livre do payload.
 * - Um claim em webhook_events por payment_id, na mesma transação das escritas: "confirmed",
 *   "finished" e reenvios ativam o plano uma única vez.
 * - Só ativa com valor em USD e valor pago em cripto cobrindo o que foi cobrado.
 */
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
    if (result.status !== 'success') {
      return NextResponse.json({ success: true, handled: result.handled, status: result.status, message: result.message });
    }

    const payload = JSON.parse(rawBody);
    const paymentId = String(payload.payment_id || payload.id || '');
    if (!paymentId) {
      console.error('[NOWPayments IPN] Evento de sucesso sem payment_id.');
      return NextResponse.json({ received: true, note: 'payment_id_missing' });
    }

    const outcome = await withTransaction(async (client) => {
      const claim = await client.query(
        'INSERT INTO webhook_events (id, provider) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
        [`nowpayments:activate:${paymentId}`, 'nowpayments']
      );
      if (claim.rowCount === 0) return { note: 'already_processed' as const };

      const txRes = await client.query(
        `SELECT user_id, amount, raw_payload FROM payment_transactions
         WHERE gateway = 'nowpayments' AND gateway_transaction_id = $1
         ORDER BY created_at ASC LIMIT 1`,
        [paymentId]
      );
      const pending = txRes.rows[0];
      const rawPending = (pending?.raw_payload || {}) as Record<string, unknown>;
      const planId = rawPending.planId;
      const interval = rawPending.interval === 'yearly' ? 'yearly' : 'monthly';
      if (!pending?.user_id || !isPlanId(planId)) {
        // Não há como saber de quem é o pagamento: fica para conciliação manual (sem reenvio infinito)
        console.error('[NOWPayments IPN] Pagamento sem cobrança registrada (conciliação manual):', paymentId);
        return { note: 'unmapped_payment' as const };
      }

      const expectedUsd = Number(pending.amount);
      const priceAmount = Number(payload.price_amount);
      const priceCurrency = String(payload.price_currency || '').toLowerCase();
      const payAmount = Number(payload.pay_amount);
      const actuallyPaid = Number(payload.actually_paid);
      const amountOk =
        priceCurrency === 'usd' &&
        Number.isFinite(priceAmount) &&
        priceAmount + 0.01 >= expectedUsd &&
        // Pagamento parcial chega como "partially_paid"; ainda assim confere o valor recebido
        (!Number.isFinite(actuallyPaid) || !Number.isFinite(payAmount) || actuallyPaid >= payAmount * 0.995);
      if (!amountOk) {
        console.error('[NOWPayments IPN] Valor divergente da cobrança (conciliação manual):', {
          paymentId,
          expectedUsd,
          priceAmount,
          priceCurrency,
          payAmount,
          actuallyPaid,
        });
        return { note: 'amount_mismatch' as const };
      }

      const userId = String(pending.user_id);
      const plan = getPlan(planId);
      const payCurrency = String(payload.pay_currency || '').toUpperCase();
      const cryptoAddress = payload.pay_address || '';

      const sub = await BillingService.createOrRenewSubscription(
        {
          userId,
          gateway: 'nowpayments',
          gatewaySubscriptionId: result.subscriptionId,
          planId: plan.id,
          planCategory: plan.category,
          billingInterval: interval,
          amount: expectedUsd,
          currency: 'USD',
          metadata: {
            paymentId,
            cryptoCurrency: payCurrency,
            cryptoAddress,
            orderId: payload.order_id || '',
          },
        },
        client
      );

      await BillingService.recordTransaction(
        {
          userId,
          subscriptionId: sub.id,
          gateway: 'nowpayments',
          gatewayTransactionId: paymentId,
          amount: expectedUsd,
          currency: 'USD',
          status: 'success',
          paymentMethod: 'crypto',
          cryptoAddress,
          cryptoAmount: Number.isFinite(actuallyPaid) ? actuallyPaid : payAmount,
          cryptoCurrency: payCurrency,
          rawPayload: payload,
          idempotencyKey: `nowpayments_${paymentId}`,
        },
        client
      );

      await client.query(
        "UPDATE payment_transactions SET status = 'success', subscription_id = $1 WHERE gateway = 'nowpayments' AND gateway_transaction_id = $2 AND status != 'success'",
        [sub.id, paymentId]
      );

      // Mesmo critério do Asaas: só promove quem já foi aprovada pela curadoria para pagamento
      await client.query(
        `UPDATE users SET curation_status = 'APROVADO', updated_at = NOW()
         WHERE id = $1 AND curation_status IN ('APROVADA_PAGAMENTO', 'APROVADO')`,
        [userId]
      );

      return { note: 'activated' as const, userId, subscriptionId: sub.id };
    });

    if ('userId' in outcome && outcome.userId) {
      await cache.delete(`sub:${outcome.userId}`).catch(() => {});
      await cache.delete(`user:${outcome.userId}`).catch(() => {});
    }

    return NextResponse.json({ success: true, handled: true, status: result.status, action: outcome.note });
  } catch (err) {
    console.error('[NOWPayments IPN] Erro crítico:', err);
    return NextResponse.json({ error: 'Erro interno ao processar IPN' }, { status: 500 });
  }
}
