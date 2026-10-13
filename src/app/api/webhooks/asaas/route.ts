import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan, isPlanId } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PlanDefinition } from '@/lib/payments/types';
import { initDatabase, withTransaction } from '@/lib/db';
import { cache } from '@/lib/cache';
import { StorageService } from '@/services/storageService';
import { CouponService } from '@/services/couponService';

type NotificationInput = Parameters<typeof StorageService.createNotification>[0];

/** Resultado do processamento transacional; efeitos colaterais rodam só após o COMMIT */
interface EventOutcome {
  body: Record<string, unknown>;
  userId?: string;
  notification?: NotificationInput;
}

/**
 * Contrato de consistência:
 * - O claim de idempotência (webhook_events) e TODAS as escritas do evento rodam numa única
 *   transação. Reenvios concorrentes bloqueiam no INSERT do claim até a primeira entrega
 *   terminar: se ela fez COMMIT, o reenvio vira `already_processed`; se fez ROLLBACK, o
 *   reenvio processa normalmente.
 * - Qualquer falha de banco faz ROLLBACK (inclusive do claim) e responde 500, para que o
 *   Asaas reenvie o evento. Nunca respondemos 200 com escrita parcial ou silenciosa.
 * - Notificações e invalidação de cache acontecem após o COMMIT e são best-effort.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key.toLowerCase()] = value;
    });

    const asaas = paymentFactory.getAsaasAdapter();

    // 1. Verificação de autenticação do Webhook Asaas (asaas-access-token)
    const isValid = await asaas.verifyWebhookSignature(rawBody, headersList);
    if (!isValid) {
      console.warn('[Asaas Webhook] Token de autenticação inválido ou ausente.');
      return NextResponse.json({ error: 'Invalid Webhook Token' }, { status: 401 });
    }

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const event = String(payload.event || '');
    const payment = payload.payment || {};
    const paymentId = payment.id as string | undefined;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment object or ID missing' }, { status: 400 });
    }

    // IDEMPOTÊNCIA: chave única por evento + paymentId
    const idempotencyKey = `asaas_${paymentId}_${event.toLowerCase()}`;
    await initDatabase();

    const outcome = await withTransaction<EventOutcome>(async (client) => {
      const claim = await client.query(
        'INSERT INTO webhook_events (id, provider) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
        [idempotencyKey, 'asaas']
      );
      if (claim.rowCount === 0) {
        return { body: { received: true, action: 'already_processed' } };
      }
      return handleEvent(client, event, payment, payload, paymentId, idempotencyKey);
    });

    // Pós-COMMIT: o pagamento já está persistido; falhas aqui não devem gerar reenvio
    if (outcome.userId) {
      await cache.delete(`sub:${outcome.userId}`).catch(() => {});
    }
    if (outcome.notification) {
      try {
        await StorageService.createNotification(outcome.notification);
      } catch (notifyErr) {
        console.warn('[Asaas Webhook] Falha ao criar notificação (pagamento já persistido):', notifyErr);
      }
    }

    return NextResponse.json(outcome.body);
  } catch (err: unknown) {
    console.error('[Asaas Webhook CRITICAL ERROR]:', err);
    return NextResponse.json({ error: 'Erro interno no webhook Asaas' }, { status: 500 });
  }
}

/**
 * Remove o acesso ao dashboard quando não resta nenhuma assinatura ativa
 * (reembolso, chargeback, cancelamento). A usuária volta ao estado "aprovada para pagamento".
 */
async function revokeAccessIfNoActiveSubscription(client: PoolClient, userId: string) {
  await client.query(
    `UPDATE users SET curation_status = 'APROVADA_PAGAMENTO', updated_at = NOW()
     WHERE id = $1 AND curation_status = 'APROVADO'
       AND NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = $1 AND status = 'active')`,
    [userId]
  );
}

function couponReleaseMarker(paymentId: string) {
  return `asaas:coupon-released:${paymentId}`;
}

async function couponReservationReleased(client: PoolClient, paymentId: string): Promise<boolean> {
  const res = await client.query('SELECT 1 FROM webhook_events WHERE id = $1', [couponReleaseMarker(paymentId)]);
  return res.rows.length > 0;
}

/** Devolve (uma única vez por cobrança) o uso de cupom reservado na emissão de um Pix não pago. */
async function releasePixCouponReservation(client: PoolClient, paymentId: string, couponCode: string | undefined) {
  if (!couponCode) return;
  const marker = await client.query(
    'INSERT INTO webhook_events (id, provider) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
    [couponReleaseMarker(paymentId), 'asaas']
  );
  if (marker.rowCount === 0) return;
  await client.query('UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE UPPER(code) = $1', [
    couponCode.trim().toUpperCase(),
  ]);
}

/**
 * Menor valor aceitável para ativar o plano: preço de tabela menos o desconto nominal do cupom.
 * Estado do cupom (ativo/expirado/limite) não entra: ele foi validado quando a cobrança foi gerada.
 */
async function expectedChargeTotal(
  client: PoolClient,
  plan: PlanDefinition,
  interval: BillingInterval,
  couponCode: string | undefined
): Promise<number> {
  const listAmount = interval === 'yearly' ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;
  if (!couponCode) return listAmount;

  const res = await client.query('SELECT discount_type, discount_value FROM coupons WHERE UPPER(code) = $1 LIMIT 1', [
    couponCode.trim().toUpperCase(),
  ]);
  const coupon = res.rows[0];
  const value = Number(coupon?.discount_value);
  if (!coupon || !Number.isFinite(value) || value <= 0) return listAmount;

  let discount = 0;
  if (coupon.discount_type === 'percentage') discount = (listAmount * Math.min(value, 100)) / 100;
  else if (coupon.discount_type === 'fixed') discount = Math.min(value, listAmount);
  discount = Math.round(discount * 100) / 100;
  return Math.max(0, Math.round((listAmount - discount) * 100) / 100);
}

async function handleEvent(
  client: PoolClient,
  event: string,
  payment: Record<string, any>,
  payload: Record<string, any>,
  paymentId: string,
  idempotencyKey: string
): Promise<EventOutcome> {
  // 2. Extração de metadados da transação (externalReference: userId:planId:interval[:cupom])
  let userId = '';
  let planId: PlanId = 'glow';
  let interval: BillingInterval = 'monthly';
  let couponCode: string | undefined = undefined;

  const extRef = (payment.externalReference as string) || '';
  if (extRef) {
    if (extRef.startsWith('{')) {
      try {
        const parsed = JSON.parse(extRef);
        userId = parsed.userId || '';
        planId = (parsed.planId as PlanId) || 'glow';
        interval = (parsed.interval as BillingInterval) || 'monthly';
        couponCode = parsed.couponCode || undefined;
      } catch {
        // externalReference malformada: segue para a busca por transação existente
      }
    } else if (extRef.includes(':')) {
      const parts = extRef.split(':');
      userId = parts[0] || '';
      planId = (parts[1] as PlanId) || 'glow';
      interval = (parts[2] as BillingInterval) || 'monthly';
      couponCode = parts[3] || undefined;
    } else {
      userId = extRef;
    }
  }

  // Se o userId não veio no externalReference, tenta localizar em payment_transactions existentes
  if (!userId) {
    const txRes = await client.query(
      'SELECT user_id FROM payment_transactions WHERE gateway_transaction_id = $1 LIMIT 1',
      [paymentId]
    );
    if (txRes.rows.length > 0) {
      userId = txRes.rows[0].user_id;
    }
  }

  // Referência com plano/intervalo fora do catálogo nunca ativa nada (antes caía em "radiance")
  const referenceValid = isPlanId(planId) && (interval === 'monthly' || interval === 'yearly');
  const plan = getPlan(planId);
  const amount = Number(payment.value || (interval === 'yearly' ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly));
  const billingType = String(payment.billingType || '').toUpperCase();
  const paymentMethod = billingType === 'PIX' ? 'pix' : 'credit_card';

  // 3. Processamento dos eventos oficiais do Asaas (API v3)
  switch (event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED': {
      if (!userId) {
        console.error('[Asaas Webhook] Pagamento confirmado sem userId mapeado (conciliação manual necessária):', paymentId);
        return { body: { received: true, note: 'User ID unmapped' } };
      }
      if (!referenceValid) {
        console.error('[Asaas Webhook] externalReference com plano/intervalo inválido (conciliação manual):', paymentId, extRef);
        return { body: { received: true, note: 'invalid_reference' }, userId };
      }
      // Cartão é cobrado pelo servidor com o preço do plano (e pode vir parcelado); as demais formas
      // (Pix/boleto) chegam numa parcela só, então o valor pago tem de cobrir o preço do plano.
      if (billingType !== 'CREDIT_CARD') {
        const expected = await expectedChargeTotal(client, plan, interval, couponCode);
        if (amount + 0.01 < expected) {
          console.error('[Asaas Webhook] Valor pago abaixo do preço do plano (conciliação manual):', {
            paymentId,
            planId: plan.id,
            interval,
            paid: amount,
            expected,
          });
          return { body: { received: true, note: 'amount_mismatch' }, userId };
        }
      }

      // Parcelamento no cartão: cada parcela chega como um pagamento próprio (id novo, mesma
      // externalReference). Só a 1ª ativa o plano; as demais apenas registram a transação.
      const installmentNumber = Number(payment.installmentNumber || 0);
      if (payment.installment && installmentNumber > 1) {
        const activeRes = await client.query(
          "SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
          [userId]
        );
        await BillingService.recordTransaction(
          {
            userId,
            subscriptionId: activeRes.rows[0]?.id,
            gateway: 'asaas',
            gatewayTransactionId: paymentId,
            amount,
            currency: 'BRL',
            status: 'success',
            paymentMethod,
            rawPayload: payload,
            idempotencyKey,
          },
          client
        );
        return { body: { received: true, action: 'installment_recorded', installmentNumber }, userId };
      }

      // Verifica se já existe assinatura ativa para este pagamento (ex.: CONFIRMED seguido de RECEIVED)
      const subRes = await client.query(
        "SELECT id FROM subscriptions WHERE user_id = $1 AND gateway_subscription_id = $2 AND status = 'active' LIMIT 1",
        [userId, paymentId]
      );
      const existingSubId: string | null = subRes.rows[0]?.id ?? null;

      if (existingSubId) {
        // Já ativa — só registra a transação idempotentemente
        await BillingService.recordTransaction(
          {
            userId,
            subscriptionId: existingSubId,
            gateway: 'asaas',
            gatewayTransactionId: paymentId,
            amount,
            currency: 'BRL',
            status: 'success',
            paymentMethod,
            rawPayload: payload,
            idempotencyKey,
          },
          client
        );
        return { body: { received: true, action: 'already_active', subscriptionId: existingSubId }, userId };
      }

      // Ativa a assinatura (assinatura + fatura + transação + cupom + curadoria: tudo ou nada)
      const subscription = await BillingService.createOrRenewSubscription(
        {
          userId,
          gateway: 'asaas',
          gatewaySubscriptionId: paymentId,
          gatewayCustomerId: payment.customer,
          planId: plan.id,
          planCategory: plan.category,
          billingInterval: interval,
          amount,
          currency: 'BRL',
          metadata: {
            asaasPaymentId: paymentId,
            billingType,
            event,
            paidAt: payment.clientPaymentDate || payment.paymentDate || new Date().toISOString(),
            // Só bandeira e final do cartão; o creditCardToken nunca é persistido
            cardBrand: payment.creditCard?.creditCardBrand,
            cardLast4: payment.creditCard?.creditCardNumber,
          },
        },
        client
      );

      await BillingService.recordTransaction(
        {
          userId,
          subscriptionId: subscription.id,
          gateway: 'asaas',
          gatewayTransactionId: paymentId,
          amount,
          currency: 'BRL',
          status: 'success',
          paymentMethod,
          rawPayload: payload,
          idempotencyKey,
        },
        client
      );

      // Concilia transações pendentes anteriores do mesmo paymentId (pré-registro do Pix/cartão em análise)
      await client.query(
        "UPDATE payment_transactions SET status = 'success', subscription_id = $1 WHERE gateway_transaction_id = $2 AND status != 'success'",
        [subscription.id, paymentId]
      );

      // Contabiliza o uso do cupom nesta liquidação. No Pix o uso já foi reservado na emissão;
      // só volta a contar se a reserva tiver sido devolvida (Pix pago depois de vencido).
      if (couponCode) {
        const reservedAtIssue = billingType === 'PIX' && !(await couponReservationReleased(client, paymentId));
        if (!reservedAtIssue) {
          await client.query('UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = $1', [
            couponCode.trim().toUpperCase(),
          ]);
        }
        const listAmount = interval === 'yearly' ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;
        await CouponService.recordRedemption(
          {
            couponCode,
            userId,
            planId: plan.id,
            billingInterval: interval,
            originalAmount: listAmount,
            discountAmount: Math.max(0, Math.round((listAmount - amount) * 100) / 100),
            finalAmount: amount,
            currency: 'BRL',
            subscriptionId: subscription.id,
            paymentReference: paymentId,
          },
          client
        );
      }

      // Promove para APROVADO só quem já foi aprovada pela curadoria para pagamento (nunca pula a curadoria)
      await client.query(
        `UPDATE users SET curation_status = 'APROVADO', updated_at = NOW()
         WHERE id = $1 AND curation_status IN ('APROVADA_PAGAMENTO', 'APROVADO')`,
        [userId]
      );

      return {
        body: { received: true, action: 'activated', subscriptionId: subscription.id },
        userId,
        notification: {
          userId,
          title: 'Acesso Oficial Liberado — Bem-vinda à Lumiardi!',
          desc: `Seu pagamento via ${billingType === 'PIX' ? 'Pix' : 'Cartão de Crédito'} para o Plano ${plan.name} foi confirmado com sucesso. Sua credencial foi ativada e o seu acesso ao ecossistema Lumiardi está 100% liberado!`,
          category: 'Pagamentos',
          type: 'success',
          link: '/dashboard',
          linkText: 'Acessar Meu Painel',
        },
      };
    }

    case 'PAYMENT_OVERDUE': {
      await client.query(
        "UPDATE payment_transactions SET status = 'failed' WHERE gateway_transaction_id = $1 AND status != 'failed'",
        [paymentId]
      );
      if (billingType === 'PIX') await releasePixCouponReservation(client, paymentId, couponCode);

      if (!userId) {
        return { body: { received: true, action: 'marked_overdue' } };
      }

      await client.query(
        "UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE user_id = $1 AND gateway_subscription_id = $2 AND status = 'active'",
        [userId, paymentId]
      );
      await revokeAccessIfNoActiveSubscription(client, userId);

      return {
        body: { received: true, action: 'marked_overdue' },
        userId,
        notification: {
          userId,
          title: 'Cobrança Vencida (Asaas)',
          desc: `A cobrança da sua assinatura ${plan.name} venceu. Por favor, regularize para manter seus benefícios ativos.`,
          category: 'Pagamentos',
          type: 'warning',
          link: '/checkout',
          linkText: 'Renovar Assinatura',
        },
      };
    }

    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_PARTIALLY_REFUNDED':
    case 'PAYMENT_CHARGEBACK_REQUESTED':
    case 'PAYMENT_CHARGEBACK_DISPUTE':
    case 'PAYMENT_DELETED': {
      const action = event === 'PAYMENT_DELETED' ? 'marked_deleted' : 'marked_refunded';
      if (event === 'PAYMENT_DELETED' && billingType === 'PIX') {
        await releasePixCouponReservation(client, paymentId, couponCode);
      }

      await client.query(
        "UPDATE payment_transactions SET status = 'refunded' WHERE gateway_transaction_id = $1 AND status != 'refunded'",
        [paymentId]
      );

      if (!userId) {
        return { body: { received: true, action } };
      }

      await client.query(
        "UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE user_id = $1 AND gateway_subscription_id = $2 AND status != 'canceled'",
        [userId, paymentId]
      );
      await revokeAccessIfNoActiveSubscription(client, userId);

      return {
        body: { received: true, action },
        userId,
        notification: {
          userId,
          title: 'Pagamento Estornado (Asaas)',
          desc: `O reembolso de R$ ${amount.toFixed(2)} referente à sua assinatura foi processado. Seu plano foi desativado.`,
          category: 'Pagamentos',
          type: 'info',
          link: '/dashboard/billing',
          linkText: 'Acessar Faturamento',
        },
      };
    }

    default:
      return { body: { received: true, action: 'ignored', event } };
  }
}
