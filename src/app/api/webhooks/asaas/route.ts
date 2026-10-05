import { NextRequest, NextResponse } from 'next/server';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval } from '@/lib/payments/types';
import { pool, initDatabase } from '@/lib/db';
import { StorageService } from '@/services/storageService';
import { CouponService } from '@/services/couponService';

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

    // ─────────────────────────────────────────────────────────────────────
    // IDEMPOTÊNCIA: chave única por evento + paymentId
    // Se já processamos este evento, retorna 200 sem reprocessar
    // ─────────────────────────────────────────────────────────────────────
    const idempotencyKey = `asaas_${paymentId}_${event.toLowerCase()}`;
    await initDatabase();

    // Claim atômico do evento ANTES de qualquer efeito: reenvios concorrentes do Asaas
    // não podem criar assinaturas, notificações ou usos de cupom duplicados.
    const claim = await pool.query(
      'INSERT INTO webhook_events (id, provider) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
      [idempotencyKey, 'asaas']
    );
    if (claim.rowCount === 0) {
      return NextResponse.json({ received: true, action: 'already_processed' });
    }

    try {
      return await handleEvent(event, payment, payload, paymentId, idempotencyKey);
    } catch (err) {
      // Libera o claim para que o Asaas possa reenviar o evento
      await pool.query('DELETE FROM webhook_events WHERE id = $1', [idempotencyKey]).catch(() => {});
      throw err;
    }
  } catch (err: unknown) {
    console.error('[Asaas Webhook CRITICAL ERROR]:', err);
    return NextResponse.json({ error: 'Erro interno no webhook Asaas' }, { status: 500 });
  }
}

/**
 * Remove o acesso ao dashboard quando não resta nenhuma assinatura ativa
 * (reembolso, chargeback, cancelamento). A usuária volta ao estado "aprovada para pagamento".
 */
async function revokeAccessIfNoActiveSubscription(userId: string) {
  await pool.query(
    `UPDATE users SET curation_status = 'APROVADA_PAGAMENTO', updated_at = NOW()
     WHERE id = $1 AND curation_status = 'APROVADO'
       AND NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = $1 AND status = 'active')`,
    [userId]
  );
}

async function handleEvent(
  event: string,
  payment: Record<string, any>,
  payload: Record<string, any>,
  paymentId: string,
  idempotencyKey: string
): Promise<NextResponse> {
  {

    // 2. Extração de metadados da transação (externalReference: userId:planId:interval)
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
          // ignora
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
      try {
        const txRes = await pool.query(
          'SELECT user_id, subscription_id FROM payment_transactions WHERE gateway_transaction_id = $1 LIMIT 1',
          [paymentId]
        );
        if (txRes.rows.length > 0) {
          userId = txRes.rows[0].user_id;
        }
      } catch (err) {
        console.error('[Asaas Webhook] Falha ao localizar transação:', err);
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
          console.warn('[Asaas Webhook] Pagamento confirmado sem userId mapeado:', paymentId);
          return NextResponse.json({ received: true, note: 'User ID unmapped' });
        }

        // Verifica se já existe assinatura ativa para não reativar indevidamente
        let existingSubId: string | null = null;
        try {
          const subRes = await pool.query(
            "SELECT id FROM subscriptions WHERE user_id = $1 AND gateway_subscription_id = $2 AND status = 'active' LIMIT 1",
            [userId, paymentId]
          );
          if (subRes.rows.length > 0) {
            existingSubId = subRes.rows[0].id;
          }
        } catch {
          // prossegue sem verificação
        }

        if (existingSubId) {
          // Já ativa — só registra a transação idempotentemente e retorna
          await BillingService.recordTransaction({
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
          });
          return NextResponse.json({ received: true, action: 'already_active', subscriptionId: existingSubId });
        }

        // Ativa ou renova a assinatura do usuário (primeira vez)
        const subscription = await BillingService.createOrRenewSubscription({
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
        });

        // Registra a transação com chave idempotente
        await BillingService.recordTransaction({
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
        });

        // Atualiza transações pendentes anteriores para o mesmo paymentId
        try {
          await pool.query(
            "UPDATE payment_transactions SET status = 'success', subscription_id = $1 WHERE gateway_transaction_id = $2 AND status != 'success'",
            [subscription.id, paymentId]
          );
        } catch {
          // Ignora
        }

        // Incrementa contagem de usos do cupom se foi utilizado nesta liquidação
        if (couponCode) {
          try {
            await CouponService.incrementCouponUses(couponCode);
          } catch (couponErr) {
            console.warn('[Asaas Webhook] Erro ao incrementar uso do cupom:', couponErr);
          }
        }

        // Promove o status de curadoria para APROVADO (Acesso Oficial Liberado)
        // Só promove quem já foi aprovada pela curadoria para pagamento (nunca pula a curadoria)
        try {
          await pool.query(
            `UPDATE users SET curation_status = 'APROVADO', updated_at = NOW()
             WHERE id = $1 AND curation_status IN ('APROVADA_PAGAMENTO', 'APROVADO')`,
            [userId]
          );
        } catch (curationErr) {
          console.error('[Asaas Webhook] Erro ao promover status para APROVADO:', curationErr);
          throw curationErr;
        }

        // Notifica o usuário na plataforma com celebração de boas-vindas
        try {
          await StorageService.createNotification({
            userId,
            title: 'Acesso Oficial Liberado — Bem-vinda à Lumiardi!',
            desc: `Seu pagamento via ${billingType === 'PIX' ? 'Pix' : 'Cartão de Crédito'} para o Plano ${plan.name} foi confirmado com sucesso. Sua credencial foi ativada e o seu acesso ao ecossistema Lumiardi está 100% liberado!`,
            category: 'Pagamentos',
            type: 'success',
            link: '/dashboard',
            linkText: 'Acessar Meu Painel',
          });
        } catch {
          // Ignora erro de notificação
        }

        return NextResponse.json({ received: true, action: 'activated', subscriptionId: subscription.id });
      }

      case 'PAYMENT_OVERDUE': {
        // Só atualiza status — sem criar registros novos
        try {
          await pool.query(
            "UPDATE payment_transactions SET status = 'failed' WHERE gateway_transaction_id = $1 AND status != 'failed'",
            [paymentId]
          );
        } catch {
          // Fallback
        }

        if (userId) {
          try {
            await pool.query(
              "UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE user_id = $1 AND gateway_subscription_id = $2 AND status = 'active'",
              [userId, paymentId]
            );
          } catch {
            // Fallback
          }

          await revokeAccessIfNoActiveSubscription(userId);

          try {
            await StorageService.createNotification({
              userId,
              title: 'Cobrança Vencida (Asaas)',
              desc: `A cobrança da sua assinatura ${plan.name} venceu. Por favor, regularize para manter seus benefícios ativos.`,
              category: 'Pagamentos',
              type: 'warning',
              link: '/checkout',
              linkText: 'Renovar Assinatura',
            });
          } catch {
            // Ignora
          }
        }

        return NextResponse.json({ received: true, action: 'marked_overdue' });
      }

      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_PARTIALLY_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
      case 'PAYMENT_CHARGEBACK_DISPUTE':
      case 'PAYMENT_DELETED': {
        // Só atualiza status — sem criar registros novos
        try {
          await pool.query(
            "UPDATE payment_transactions SET status = 'refunded' WHERE gateway_transaction_id = $1 AND status != 'refunded'",
            [paymentId]
          );
        } catch {
          // Fallback
        }

        if (userId) {
          try {
            await pool.query(
              "UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE user_id = $1 AND gateway_subscription_id = $2 AND status != 'canceled'",
              [userId, paymentId]
            );
          } catch {
            // Fallback
          }

          await revokeAccessIfNoActiveSubscription(userId);

          try {
            await StorageService.createNotification({
              userId,
              title: 'Pagamento Estornado (Asaas)',
              desc: `O reembolso de R$ ${amount.toFixed(2)} referente à sua assinatura foi processado. Seu plano foi desativado.`,
              category: 'Pagamentos',
              type: 'info',
              link: '/dashboard/billing',
              linkText: 'Acessar Faturamento',
            });
          } catch {
            // Ignora
          }
        }

        return NextResponse.json({ received: true, action: event === 'PAYMENT_DELETED' ? 'marked_deleted' : 'marked_refunded' });
      }

      default: {
        return NextResponse.json({ received: true, action: 'ignored', event });
      }
    }
  }
}
