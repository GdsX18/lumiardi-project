/**
 * LUMIARDI — BILLING & SUBSCRIPTION SERVICE
 * Gestão de ciclo de vida de assinaturas, conciliação atômica de banco de dados,
 * cálculo de limites de tiers e emissão de faturas.
 */

import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { pool, initDatabase } from '@/lib/db';
import {
  SubscriptionRecord,
  TransactionRecord,
  TransactionStatus,
  InvoiceRecord,
  PayoutRecord,
  PlanId,
  PlanCategory,
  PaymentGatewayType,
  BillingInterval,
} from './types';
import { getPlan } from './plansConfig';
import { cache } from '@/lib/cache';

/**
 * Executor de queries: o pool (operação isolada) ou o client de uma transação aberta
 * com withTransaction (escritas atômicas). Falhas de banco SEMPRE são propagadas — sem
 * fallback em memória — para que webhooks respondam 500 e o gateway reenvie o evento.
 */
export type DbExecutor = typeof pool | PoolClient;

function randomSuffix(bytes = 4): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function mapInvoiceRow(r: Record<string, any>): InvoiceRecord {
  return {
    id: r.id,
    userId: r.user_id,
    subscriptionId: r.subscription_id,
    invoiceNumber: r.invoice_number,
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    billingReason: r.billing_reason,
    dueDate: r.due_date,
    paidAt: r.paid_at,
    receiptNumber: r.receipt_number,
    pdfUrl: r.pdf_url,
    createdAt: r.created_at,
  };
}

export const BillingService = {
  /**
   * Obtém a assinatura mais recente do usuário (com cache integrado)
   */
  async getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
    const cacheKey = `sub:${userId}`;
    return cache.getOrSet(
      cacheKey,
      async () => {
        await initDatabase();

        const res = await pool.query(
          'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [userId]
        );
        if (res.rows.length === 0) return null;

        const r = res.rows[0];
        return {
          id: r.id,
          userId: r.user_id,
          gateway: r.gateway,
          gatewaySubscriptionId: r.gateway_subscription_id,
          gatewayCustomerId: r.gateway_customer_id,
          planId: r.plan_id,
          planCategory: r.plan_category,
          status: r.status,
          billingInterval: r.billing_interval,
          amount: Number(r.amount),
          currency: r.currency,
          currentPeriodStart: r.current_period_start,
          currentPeriodEnd: r.current_period_end,
          cancelAtPeriodEnd: r.cancel_at_period_end,
          metadata: r.metadata,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      },
      60,
      ['billing', `user:${userId}`]
    );
  },

  /**
   * Criação de assinatura + fatura. Passe o client de withTransaction para que ambas
   * sejam gravadas atomicamente junto com as demais escritas do pagamento.
   */
  async createOrRenewSubscription(
    params: {
      userId: string;
      gateway: PaymentGatewayType;
      gatewaySubscriptionId?: string;
      gatewayCustomerId?: string;
      planId: PlanId;
      planCategory: PlanCategory;
      billingInterval: BillingInterval;
      amount: number;
      currency: 'BRL' | 'USD';
      metadata?: Record<string, unknown>;
    },
    db: DbExecutor = pool
  ): Promise<SubscriptionRecord> {
    await initDatabase();

    const id = `sub_${Date.now()}_${randomSuffix()}`;
    const now = new Date();
    const periodDays = params.billingInterval === 'yearly' ? 365 : 30;
    const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

    const record: SubscriptionRecord = {
      id,
      userId: params.userId,
      gateway: params.gateway,
      gatewaySubscriptionId: params.gatewaySubscriptionId,
      gatewayCustomerId: params.gatewayCustomerId,
      planId: params.planId,
      planCategory: params.planCategory,
      status: 'active',
      billingInterval: params.billingInterval,
      amount: params.amount,
      currency: params.currency,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      metadata: params.metadata || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await db.query(
      `INSERT INTO subscriptions (
        id, user_id, gateway, gateway_subscription_id, gateway_customer_id,
        plan_id, plan_category, status, billing_interval, amount, currency,
        current_period_start, current_period_end, cancel_at_period_end, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        record.id,
        record.userId,
        record.gateway,
        record.gatewaySubscriptionId,
        record.gatewayCustomerId,
        record.planId,
        record.planCategory,
        record.status,
        record.billingInterval,
        record.amount,
        record.currency,
        record.currentPeriodStart,
        record.currentPeriodEnd,
        record.cancelAtPeriodEnd,
        JSON.stringify(record.metadata),
        record.createdAt,
        record.updatedAt,
      ]
    );

    await this.generateInvoice(
      {
        userId: params.userId,
        subscriptionId: record.id,
        amount: params.amount,
        currency: params.currency,
        billingReason: `Assinatura Plano ${getPlan(params.planId).name} (${params.billingInterval === 'yearly' ? 'Anual' : 'Mensal'})`,
      },
      db
    );

    // Dentro de transação, quem chama também deve invalidar o cache após o COMMIT
    await cache.delete(`sub:${params.userId}`);

    return record;
  },

  /**
   * Registra transação de pagamento com garantia de idempotência (UNIQUE idempotency_key)
   */
  async recordTransaction(
    params: {
      userId: string;
      subscriptionId?: string;
      gateway: PaymentGatewayType;
      gatewayTransactionId: string;
      amount: number;
      currency: string;
      status: TransactionStatus;
      paymentMethod: 'credit_card' | 'crypto' | 'pix';
      cryptoAddress?: string;
      cryptoAmount?: number;
      cryptoCurrency?: string;
      rawPayload?: Record<string, unknown>;
      idempotencyKey?: string;
    },
    db: DbExecutor = pool
  ): Promise<TransactionRecord> {
    await initDatabase();

    const record: TransactionRecord = {
      id: `tx_${Date.now()}_${randomSuffix()}`,
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      gateway: params.gateway,
      gatewayTransactionId: params.gatewayTransactionId,
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      paymentMethod: params.paymentMethod,
      cryptoAddress: params.cryptoAddress,
      cryptoAmount: params.cryptoAmount,
      cryptoCurrency: params.cryptoCurrency,
      rawPayload: params.rawPayload,
      idempotencyKey: params.idempotencyKey || `${params.gateway}_${params.gatewayTransactionId}`,
      createdAt: new Date().toISOString(),
    };

    await db.query(
      `INSERT INTO payment_transactions (
        id, user_id, subscription_id, gateway, gateway_transaction_id,
        amount, currency, status, payment_method, crypto_address, crypto_amount,
        crypto_currency, raw_payload, idempotency_key, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        record.id,
        record.userId,
        record.subscriptionId,
        record.gateway,
        record.gatewayTransactionId,
        record.amount,
        record.currency,
        record.status,
        record.paymentMethod,
        record.cryptoAddress,
        record.cryptoAmount,
        record.cryptoCurrency,
        JSON.stringify(record.rawPayload),
        record.idempotencyKey,
        record.createdAt,
      ]
    );

    return record;
  },

  /**
   * Emite fatura e gera número de recibo
   */
  async generateInvoice(
    params: {
      userId: string;
      subscriptionId?: string;
      amount: number;
      currency: string;
      billingReason: string;
    },
    db: DbExecutor = pool
  ): Promise<InvoiceRecord> {
    await initDatabase();

    const id = `inv_${Date.now()}_${randomSuffix()}`;
    // invoice_number é UNIQUE: sufixo criptográfico de 32 bits (o antigo de 4 dígitos colidia
    // e, agora que erros de banco são propagados, derrubaria o pagamento inteiro)
    const invoiceNumber = `LUM-INV-${new Date().getFullYear()}-${randomSuffix().toUpperCase()}`;
    const receiptNumber = `LMI-REC-${randomSuffix(5).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: InvoiceRecord = {
      id,
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      invoiceNumber,
      amount: params.amount,
      currency: params.currency,
      status: 'paid',
      billingReason: params.billingReason,
      dueDate: now,
      paidAt: now,
      receiptNumber,
      pdfUrl: `/api/billing/invoices/${id}/download`,
      createdAt: now,
    };

    await db.query(
      `INSERT INTO invoices (
        id, user_id, subscription_id, invoice_number, amount, currency,
        status, billing_reason, due_date, paid_at, receipt_number, pdf_url, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        record.id,
        record.userId,
        record.subscriptionId,
        record.invoiceNumber,
        record.amount,
        record.currency,
        record.status,
        record.billingReason,
        record.dueDate,
        record.paidAt,
        record.receiptNumber,
        record.pdfUrl,
        record.createdAt,
      ]
    );

    return record;
  },

  /**
   * Obtém histórico de faturas do usuário
   */
  async getUserInvoices(userId: string): Promise<InvoiceRecord[]> {
    await initDatabase();
    const res = await pool.query('SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map(mapInvoiceRow);
  },

  /**
   * Obtém uma fatura específica pelo ID
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceRecord | null> {
    await initDatabase();
    const res = await pool.query('SELECT * FROM invoices WHERE id = $1 LIMIT 1', [invoiceId]);
    return res.rows.length > 0 ? mapInvoiceRow(res.rows[0]) : null;
  },

  /**
   * Obtém histórico de repasses/payouts
   */
  async getUserPayouts(userId: string): Promise<PayoutRecord[]> {
    await initDatabase();
    const res = await pool.query(
      'SELECT * FROM payouts WHERE creator_id = $1 OR agency_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      creatorId: r.creator_id,
      agencyId: r.agency_id,
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status,
      payoutMethod: r.payout_method,
      gatewayReference: r.gateway_reference,
      description: r.description,
      createdAt: r.created_at,
      paidAt: r.paid_at,
    }));
  },

  /**
   * Cancela assinatura ao final do ciclo corrente
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    await initDatabase();
    await pool.query(
      'UPDATE subscriptions SET cancel_at_period_end = TRUE, updated_at = NOW() WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );
    await cache.delete(`sub:${userId}`);
    return true;
  },

  /**
   * Reativa assinatura que estava programada para cancelamento
   */
  async reactivateSubscription(userId: string): Promise<boolean> {
    await initDatabase();
    await pool.query(
      'UPDATE subscriptions SET cancel_at_period_end = FALSE, updated_at = NOW() WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );
    await cache.delete(`sub:${userId}`);
    return true;
  },

  /**
   * Estorna no gateway as cobranças pagas da usuária quando a curadoria recusa a credencial.
   * Só reporta `refunded: true` para valores efetivamente estornados pelo Asaas; cobranças que não
   * puderam ser estornadas automaticamente (ex.: cripto) ficam registradas para tratamento manual.
   */
  async processAutomatedRefund(params: {
    userId: string;
    reason: string;
    curatorId?: string;
  }): Promise<{
    refunded: boolean;
    refundCode?: string;
    amount?: number;
    currency?: string;
    refundedAt?: string;
    manualReviewRequired?: boolean;
    message: string;
  }> {
    await initDatabase();
    const now = new Date().toISOString();
    const refundCode = `REFUND-LUM-${Date.now().toString(36).toUpperCase()}-${randomSuffix(2).toUpperCase()}`;

    const paidRes = await pool.query(
      `SELECT DISTINCT ON (gateway_transaction_id) gateway_transaction_id, gateway, amount, currency
       FROM payment_transactions
       WHERE user_id = $1 AND status = 'success'
       ORDER BY gateway_transaction_id, created_at DESC`,
      [params.userId]
    );

    const { asaasClient } = await import('@/lib/payments/asaasClient');
    let totalRefundAmount = 0;
    let refundCurrency = 'BRL';
    let manualReviewRequired = false;

    for (const tx of paidRes.rows) {
      const paymentId = String(tx.gateway_transaction_id);
      if (tx.gateway === 'asaas' && paymentId.startsWith('pay_')) {
        try {
          await asaasClient.refundPayment(paymentId, `Lumiardi — ${params.reason}`);
          totalRefundAmount += Number(tx.amount) || 0;
          refundCurrency = tx.currency || 'BRL';
          await pool.query(
            "UPDATE payment_transactions SET status = 'refund_requested' WHERE gateway_transaction_id = $1 AND status = 'success'",
            [paymentId]
          );
        } catch (err) {
          console.error('[BillingService] Falha ao estornar no Asaas:', paymentId, err);
          manualReviewRequired = true;
        }
      } else {
        // Cripto e outros meios exigem estorno manual pela equipe financeira
        manualReviewRequired = true;
      }
    }

    // Cancela a assinatura ativa (o acesso é removido pela mudança de status da curadoria)
    await pool.query(
      `UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE user_id = $1 AND status = 'active'`,
      [params.userId]
    );

    if (totalRefundAmount > 0) {
      await pool.query(
        `UPDATE invoices SET status = 'refunded' WHERE user_id = $1 AND status = 'paid'`,
        [params.userId]
      ).catch((err) => console.error('[BillingService] Falha ao atualizar faturas estornadas:', err));

      await this.recordTransaction({
        userId: params.userId,
        gateway: 'asaas',
        gatewayTransactionId: refundCode,
        amount: totalRefundAmount,
        currency: refundCurrency,
        status: 'refunded',
        paymentMethod: 'credit_card',
        rawPayload: {
          refundCode,
          reason: params.reason,
          curatorId: params.curatorId || 'curadoria',
          refundedAt: now,
          manualReviewRequired,
          type: 'AUTOMATIC_CURATION_REJECTION_REFUND',
        },
        idempotencyKey: `refund_${refundCode}`,
      });
    }

    await cache.delete(`sub:${params.userId}`);

    if (totalRefundAmount > 0) {
      return {
        refunded: true,
        refundCode,
        amount: totalRefundAmount,
        currency: refundCurrency,
        refundedAt: now,
        manualReviewRequired,
        message: `Estorno de ${refundCurrency === 'BRL' ? 'R$ ' : '$'}${totalRefundAmount.toFixed(2)} solicitado ao gateway. Código: ${refundCode}`,
      };
    }

    return {
      refunded: false,
      manualReviewRequired,
      message: manualReviewRequired
        ? 'Há pagamentos que exigem estorno manual pela equipe financeira.'
        : 'Nenhum pagamento liquidado pendente de estorno.',
    };
  },
};
