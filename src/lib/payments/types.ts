/**
 * LUMIARDI — DEFINIÇÕES DE TIPOS DE PAGAMENTO E ASSINATURAS
 * Módulo de Multi-Gateway (CCBill + NOWPayments) & Gestão de Faturamento
 */

export type PaymentGatewayType = 'ccbill' | 'nowpayments';

export type PlanCategory = 'criadoras' | 'agencias';

export type PlanId = 'glow' | 'radiance' | 'icon' | 'select' | 'signature';

export type BillingInterval = 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trial'
  | 'expired'
  | 'unpaid';

export type TransactionStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'refunded'
  | 'chargeback';

export type InvoiceStatus = 'paid' | 'open' | 'void' | 'uncollectible';

export type CryptoCurrency = 'USDTTRC20' | 'USDTERC20' | 'USDTBSC' | 'USDC' | 'BTC' | 'ETH';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  category: PlanCategory;
  priceBRL: {
    monthly: number;
    yearly: number; // Por mês quando cobrado anualmente
  };
  priceUSD: {
    monthly: number;
    yearly: number;
  };
  badge?: string;
  isPopular?: boolean;
  description: string;
  features: string[];
  limits: {
    maxRosterSlots?: number;
    maxDriveStorageGB: number;
    maxScoutSearchesPerMonth: number | 'unlimited';
    maxDirectProposalsPerMonth: number | 'unlimited';
    priorityPlacement: 'standard' | 'high' | 'exclusive';
    customWatermarking: boolean;
    ndaProtection: boolean;
  };
  gatewayIds: {
    ccbill: {
      subAccountMonthly: string;
      subAccountYearly: string;
      formName: string;
    };
    nowpayments: {
      priceId: string;
    };
  };
}

export interface CreateCheckoutSessionRequest {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'criadora' | 'agencia';
  planId: PlanId;
  interval: BillingInterval;
  gateway: PaymentGatewayType;
  cryptoCurrency?: CryptoCurrency;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  gateway: PaymentGatewayType;
  sessionId: string;
  redirectUrl?: string;
  cryptoDetails?: {
    paymentId: string;
    payAddress: string;
    payAmount: number;
    payCurrency: string;
    priceAmount: number;
    priceCurrency: string;
    qrCodeUrl?: string;
    expirationEstimate: string;
  };
  orderSummary: {
    planId: PlanId;
    planName: string;
    category: PlanCategory;
    interval: BillingInterval;
    amount: number;
    currency: 'BRL' | 'USD';
  };
  error?: string;
}

export interface WebhookResult {
  handled: boolean;
  eventType: string;
  subscriptionId?: string;
  transactionId?: string;
  userId?: string;
  status: 'success' | 'ignored' | 'failed';
  message: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  gateway: PaymentGatewayType;
  gatewaySubscriptionId?: string;
  gatewayCustomerId?: string;
  planId: PlanId;
  planCategory: PlanCategory;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number;
  currency: 'BRL' | 'USD';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  subscriptionId?: string;
  gateway: PaymentGatewayType;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: 'credit_card' | 'crypto';
  cryptoAddress?: string;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  rawPayload?: Record<string, any>;
  idempotencyKey?: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  userId: string;
  subscriptionId?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  billingReason: string;
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface PayoutRecord {
  id: string;
  creatorId: string;
  agencyId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  payoutMethod: 'pix' | 'crypto_usdt' | 'wire_swift';
  gatewayReference?: string;
  description: string;
  createdAt: string;
  paidAt?: string;
}

export interface PaymentGatewayService {
  readonly gatewayName: PaymentGatewayType;
  createCheckoutSession(req: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse>;
  verifyWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<boolean>;
  handleWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<WebhookResult>;
  getSubscription(gatewaySubscriptionId: string): Promise<SubscriptionRecord | null>;
  cancelSubscription(gatewaySubscriptionId: string): Promise<boolean>;
}
