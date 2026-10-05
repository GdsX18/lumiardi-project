import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval } from '@/lib/payments/types';
import { initDatabase, withTransaction } from '@/lib/db';
import { cache } from '@/lib/cache';
import { StorageService } from '@/services/storageService';

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

      // Contabiliza o uso do cupom nesta liquidação
      if (couponCode) {
        await client.query('UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = $1', [
          couponCode.trim().toUpperCase(),
        ]);
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
