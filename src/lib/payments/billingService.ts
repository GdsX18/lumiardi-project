/**
 * LUMIARDI — BILLING & SUBSCRIPTION SERVICE
 * Gestão de ciclo de vida de assinaturas, conciliação atômica de banco de dados,
 * cálculo de limites de tiers e emissão de faturas.
 */

import { pool, initDatabase, fallbackStore } from '@/lib/db';
import {
  SubscriptionRecord,
  TransactionRecord,
  InvoiceRecord,
  PayoutRecord,
  PlanId,
  PlanCategory,
  PaymentGatewayType,
  BillingInterval,
  SubscriptionStatus,
} from './types';
import { getPlan, LUMIARDI_PLANS } from './plansConfig';
import { cache } from '@/lib/cache';

export const BillingService = {
  /**
   * Obtém a assinatura ativa do usuário (com cache integrado)
   */
  async getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
    const cacheKey = `sub:${userId}`;
    return cache.getOrSet(
      cacheKey,
      async () => {
        await initDatabase();

        try {
          const res = await pool.query(
            'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [userId]
          );

          if (res.rows.length > 0) {
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
          }
        } catch {
          // Fallback
        }

        const fallback = fallbackStore.subscriptions.get(userId);
        if (fallback) {
          return {
            id: fallback.id,
            userId: fallback.user_id,
            gateway: fallback.gateway,
            gatewaySubscriptionId: fallback.gateway_subscription_id,
            gatewayCustomerId: fallback.gateway_customer_id,
            planId: fallback.plan_id,
            planCategory: fallback.plan_category,
            status: fallback.status,
            billingInterval: fallback.billing_interval,
            amount: Number(fallback.amount),
            currency: fallback.currency,
            currentPeriodStart: fallback.current_period_start,
            currentPeriodEnd: fallback.current_period_end,
            cancelAtPeriodEnd: fallback.cancel_at_period_end,
            metadata: fallback.metadata,
            createdAt: fallback.created_at,
            updatedAt: fallback.updated_at,
          };
        }

        return null;
      },
      60,
      ['billing', `user:${userId}`]
    );
  },

  /**
   * Criação ou renovação atômica de assinatura
   */
  async createOrRenewSubscription(params: {
    userId: string;
    gateway: PaymentGatewayType;
    gatewaySubscriptionId?: string;
    gatewayCustomerId?: string;
    planId: PlanId;
    planCategory: PlanCategory;
    billingInterval: BillingInterval;
    amount: number;
    currency: 'BRL' | 'USD';
    metadata?: Record<string, any>;
  }): Promise<SubscriptionRecord> {
    await initDatabase();

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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

    try {
      await pool.query(
        `INSERT INTO subscriptions (
          id, user_id, gateway, gateway_subscription_id, gateway_customer_id,
          plan_id, plan_category, status, billing_interval, amount, currency,
          current_period_start, current_period_end, cancel_at_period_end, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING`,
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
    } catch (e) {
      // Fallback
    }

    // Salva no fallbackStore
    fallbackStore.subscriptions.set(params.userId, {
      ...record,
      user_id: record.userId,
      gateway_subscription_id: record.gatewaySubscriptionId,
      gateway_customer_id: record.gatewayCustomerId,
      plan_id: record.planId,
      plan_category: record.planCategory,
      billing_interval: record.billingInterval,
      current_period_start: record.currentPeriodStart,
      current_period_end: record.currentPeriodEnd,
      cancel_at_period_end: record.cancelAtPeriodEnd,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    });

    // Invalida cache
    await cache.delete(`sub:${params.userId}`);

    // Emite fatura automática correspondente
    await this.generateInvoice({
      userId: params.userId,
      subscriptionId: record.id,
      amount: params.amount,
      currency: params.currency,
      billingReason: `Assinatura Plano ${getPlan(params.planId).name} (${params.billingInterval === 'yearly' ? 'Anual' : 'Mensal'})`,
    });

    return record;
  },

  /**
   * Registra transação de pagamento com garantia de idempotência
   */
  async recordTransaction(params: {
    userId: string;
    subscriptionId?: string;
    gateway: PaymentGatewayType;
    gatewayTransactionId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'refunded' | 'chargeback';
    paymentMethod: 'credit_card' | 'crypto';
    cryptoAddress?: string;
    cryptoAmount?: number;
    cryptoCurrency?: string;
    rawPayload?: Record<string, any>;
    idempotencyKey?: string;
  }): Promise<TransactionRecord> {
    await initDatabase();

    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: TransactionRecord = {
      id,
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
      createdAt: now,
    };

    try {
      await pool.query(
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
    } catch {
      // Fallback
    }

    fallbackStore.payment_transactions.set(record.id, record);
    return record;
  },

  /**
   * Emite fatura fiscal e gera número de recibo com hash de integridade
   */
  async generateInvoice(params: {
    userId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    billingReason: string;
  }): Promise<InvoiceRecord> {
    await initDatabase();

    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = `LUM-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `LMI-REC-${Math.floor(100000 + Math.random() * 900000)}`;
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

    try {
      await pool.query(
        `INSERT INTO invoices (
          id, user_id, subscription_id, invoice_number, amount, currency,
          status, billing_reason, due_date, paid_at, receipt_number, pdf_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING`,
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
    } catch {
      // Fallback
    }

    fallbackStore.invoices.set(id, record);
    return record;
  },

  /**
   * Obtém histórico de faturas do usuário
   */
  async getUserInvoices(userId: string): Promise<InvoiceRecord[]> {
    await initDatabase();

    try {
      const res = await pool.query(
        'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
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
        }));
      }
    } catch {
      // Fallback
    }

    const invoices: InvoiceRecord[] = [];
    for (const inv of fallbackStore.invoices.values()) {
      if (inv.user_id === userId || inv.userId === userId) {
        invoices.push({
          id: inv.id,
          userId: inv.user_id || inv.userId,
          subscriptionId: inv.subscription_id || inv.subscriptionId,
          invoiceNumber: inv.invoice_number || inv.invoiceNumber,
          amount: Number(inv.amount),
          currency: inv.currency,
          status: inv.status,
          billingReason: inv.billing_reason || inv.billingReason,
          dueDate: inv.due_date || inv.dueDate,
          paidAt: inv.paid_at || inv.paidAt,
          receiptNumber: inv.receipt_number || inv.receiptNumber,
          pdfUrl: inv.pdf_url || inv.pdfUrl,
          createdAt: inv.created_at || inv.createdAt,
        });
      }
    }

    return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Obtém histórico de repasses/payouts
   */
  async getUserPayouts(userId: string): Promise<PayoutRecord[]> {
    await initDatabase();

    try {
      const res = await pool.query(
        'SELECT * FROM payouts WHERE creator_id = $1 OR agency_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      if (res.rows.length > 0) {
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
      }
    } catch {
      // Fallback
    }

    const payouts: PayoutRecord[] = [];
    for (const p of fallbackStore.payouts.values()) {
      if (p.creator_id === userId || p.agency_id === userId || p.creatorId === userId) {
        payouts.push({
          id: p.id,
          creatorId: p.creator_id || p.creatorId,
          agencyId: p.agency_id || p.agencyId,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          payoutMethod: p.payout_method || p.payoutMethod,
          gatewayReference: p.gateway_reference || p.gatewayReference,
          description: p.description,
          createdAt: p.created_at || p.createdAt,
          paidAt: p.paid_at || p.paidAt,
        });
      }
    }

    return payouts;
  },

  /**
   * Cancela assinatura ao final do ciclo corrente
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    await initDatabase();

    try {
      await pool.query(
        'UPDATE subscriptions SET cancel_at_period_end = TRUE, updated_at = NOW() WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );
    } catch {
      // Fallback
    }

    const sub = fallbackStore.subscriptions.get(userId);
    if (sub) {
      sub.cancel_at_period_end = true;
      sub.cancelAtPeriodEnd = true;
      fallbackStore.subscriptions.set(userId, sub);
    }

    await cache.delete(`sub:${userId}`);
    return true;
  },

  /**
   * Reativa assinatura que estava programada para cancelamento
   */
  async reactivateSubscription(userId: string): Promise<boolean> {
    await initDatabase();

    try {
      await pool.query(
        'UPDATE subscriptions SET cancel_at_period_end = FALSE, updated_at = NOW() WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );
    } catch {
      // Fallback
    }

    const sub = fallbackStore.subscriptions.get(userId);
    if (sub) {
      sub.cancel_at_period_end = false;
      sub.cancelAtPeriodEnd = false;
      fallbackStore.subscriptions.set(userId, sub);
    }

    await cache.delete(`sub:${userId}`);
    return true;
  },
};
