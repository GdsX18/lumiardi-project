import { NextRequest, NextResponse } from 'next/server';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval } from '@/lib/payments/types';
import { pool, initDatabase, fallbackStore } from '@/lib/db';
import { StorageService } from '@/services/storageService';

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

    // 2. Extração de metadados da transação (externalReference: userId:planId:interval)
    let userId = '';
    let planId: PlanId = 'glow';
    let interval: BillingInterval = 'monthly';

    const extRef = (payment.externalReference as string) || '';
    if (extRef) {
      if (extRef.startsWith('{')) {
        try {
          const parsed = JSON.parse(extRef);
          userId = parsed.userId || '';
          planId = (parsed.planId as PlanId) || 'glow';
          interval = (parsed.interval as BillingInterval) || 'monthly';
        } catch {
          // ignora
        }
      } else if (extRef.includes(':')) {
        const parts = extRef.split(':');
        userId = parts[0] || '';
        planId = (parts[1] as PlanId) || 'glow';
        interval = (parts[2] as BillingInterval) || 'monthly';
      } else {
        userId = extRef;
      }
    }

    // Se o userId não veio no externalReference, tenta localizar em payment_transactions existentes
    await initDatabase();
    if (!userId) {
      try {
        const txRes = await pool.query(
          'SELECT user_id, subscription_id FROM payment_transactions WHERE gateway_transaction_id = $1 LIMIT 1',
          [paymentId]
        );
        if (txRes.rows.length > 0) {
          userId = txRes.rows[0].user_id;
        }
      } catch {
        // Fallback
        for (const tx of fallbackStore.payment_transactions.values()) {
          const t = tx as Record<string, any>;
          if (t.gateway_transaction_id === paymentId && t.user_id) {
            userId = t.user_id;
            break;
          }
        }
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

        // Ativa ou renova a assinatura do usuário
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
            creditCard: payment.creditCard,
          },
        });

        // Atualiza/Registra a transação com status 'success'
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
          idempotencyKey: `asaas_${paymentId}_confirmed`,
        });

        // Atualiza status se transação pendente já existia
        try {
          await pool.query(
            "UPDATE payment_transactions SET status = 'success', subscription_id = $1 WHERE gateway_transaction_id = $2",
            [subscription.id, paymentId]
          );
        } catch {
          // Ignora
        }

        // Notifica o usuário na plataforma
        try {
          await StorageService.createNotification({
            userId,
            title: 'Pagamento Asaas Aprovado',
            desc: `Seu pagamento via ${billingType === 'PIX' ? 'Pix' : 'Cartão de Crédito'} para o Plano ${plan.name} foi confirmado com sucesso.`,
            category: 'Pagamentos',
            type: 'success',
            link: '/dashboard/billing',
            linkText: 'Ver Detalhes do Plano',
          });
        } catch {
          // Ignora erro de notificação
        }

        return NextResponse.json({ received: true, action: 'activated', subscriptionId: subscription.id });
      }

      case 'PAYMENT_OVERDUE': {
        // Atualiza a transação como falha/vencida
        try {
          await pool.query(
            "UPDATE payment_transactions SET status = 'failed' WHERE gateway_transaction_id = $1",
            [paymentId]
          );
        } catch {
          // Fallback
        }

        // Se houver assinatura vinculada, altera para past_due
        if (userId) {
          try {
            await pool.query(
              "UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE user_id = $1 AND (gateway_subscription_id = $2 OR gateway = 'asaas')",
              [userId, paymentId]
            );
          } catch {
            // Fallback
          }

          const fallbackSub = fallbackStore.subscriptions.get(userId) as Record<string, any> | undefined;
          if (fallbackSub) {
            fallbackSub.status = 'past_due';
            fallbackSub.updated_at = new Date().toISOString();
            fallbackStore.subscriptions.set(userId, fallbackSub);
          }

          // Notificação de cobrança vencida
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

      case 'PAYMENT_REFUNDED': {
        // Atualiza status da transação para estornada
        try {
          await pool.query(
            "UPDATE payment_transactions SET status = 'refunded' WHERE gateway_transaction_id = $1",
            [paymentId]
          );
        } catch {
          // Fallback
        }

        // Suspende a assinatura do usuário
        if (userId) {
          try {
            await pool.query(
              "UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE user_id = $1 AND (gateway_subscription_id = $2 OR gateway = 'asaas')",
              [userId, paymentId]
            );
          } catch {
            // Fallback
          }

          const fallbackSub = fallbackStore.subscriptions.get(userId) as Record<string, any> | undefined;
          if (fallbackSub) {
            fallbackSub.status = 'canceled';
            fallbackSub.updated_at = new Date().toISOString();
            fallbackStore.subscriptions.set(userId, fallbackSub);
          }

          // Notificação de estorno
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

        return NextResponse.json({ received: true, action: 'marked_refunded' });
      }

      default: {
        return NextResponse.json({ received: true, action: 'ignored', event });
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno no webhook Asaas';
    console.error('[Asaas Webhook CRITICAL ERROR]:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

