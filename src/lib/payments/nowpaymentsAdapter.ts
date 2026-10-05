/**
 * LUMIARDI — NOWPAYMENTS ADAPTER
 * Integração Web3/Crypto (USDT TRC20/ERC20/BSC, USDC, BTC, ETH) para pagamentos globais,
 * liquidação sem custódia, geração de faturas instantâneas, verificação HMAC-SHA512 e IPN.
 */

import crypto from 'crypto';
import { safeEqual } from '@/lib/security/secureCompare';
import {
  PaymentGatewayService,
  PaymentGatewayType,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  WebhookResult,
  SubscriptionRecord,
} from './types';
import { getPlan } from './plansConfig';

/** Recusa da API NOWPayments com código tratável pela rota (ex.: valor abaixo do mínimo da moeda). */
export class NowPaymentsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: 'crypto_amount_below_minimum' | 'crypto_gateway_rejected',
    public readonly gatewayCode?: string,
    /** Mínimo aceito para a moeda escolhida, em USD (só em crypto_amount_below_minimum) */
    public readonly minUsd?: number
  ) {
    super(message);
    this.name = 'NowPaymentsApiError';
  }
}

export class NOWPaymentsAdapter implements PaymentGatewayService {
  public readonly gatewayName: PaymentGatewayType = 'nowpayments';

  /** Lidos dinamicamente: sem chave/segredo configurado nada é aceito (sem defaults hardcoded) */
  private get apiKey(): string {
    return (process.env.NOWPAYMENTS_API_KEY || '').trim();
  }

  private get ipnSecret(): string {
    return (process.env.NOWPAYMENTS_IPN_SECRET || '').trim();
  }

  private get isSandbox(): boolean {
    return process.env.NOWPAYMENTS_SANDBOX === 'true';
  }

  private get apiUrl(): string {
    return this.isSandbox ? 'https://api-sandbox.nowpayments.io/v1' : 'https://api.nowpayments.io/v1';
  }

  /** Carteiras simuladas só fora de produção e sem chave real configurada */
  private get mockAllowed(): boolean {
    return process.env.NODE_ENV !== 'production' && !this.apiKey;
  }

  /**
   * Ordena as chaves do objeto recursivamente para verificação exata de HMAC do NOWPayments
   */
  private sortObjectKeys(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    }
    const record = obj as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce((result: Record<string, unknown>, key: string) => {
        result[key] = this.sortObjectKeys(record[key]);
        return result;
      }, {});
  }

  /**
   * Criação de fatura cripto com endereço de pagamento exclusivo e valor convertido
   */
  async createCheckoutSession(
    req: CreateCheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    const plan = getPlan(req.planId);
    const isYearly = req.interval === 'yearly';
    const priceUSD = isYearly ? plan.priceUSD.yearly * 12 : plan.priceUSD.monthly;

    const cryptoCurrency = (req.cryptoCurrency || 'USDTTRC20').toLowerCase();
    const sessionId = `nowpay_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const orderId = `LUM-${plan.id.toUpperCase()}-${Date.now()}`;
    const orderDescription = `Lumiardi Luxury Membership — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const ipnCallbackUrl = `${appUrl}/api/webhooks/nowpayments`;

    // 1. Integração real com a API NOWPayments. Qualquer falha é propagada: nunca exibimos
    //    um endereço que não foi emitido pelo gateway para esta cobrança.
    if (!this.mockAllowed) {
      if (!this.apiKey) {
        throw new Error('NOWPAYMENTS_API_KEY não configurada.');
      }

      const response = await fetch(`${this.apiUrl}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        // Sem pay_amount: o gateway converte price_amount (USD) para a moeda escolhida
        body: JSON.stringify({
          price_amount: priceUSD,
          price_currency: 'usd',
          pay_currency: cryptoCurrency,
          ipn_callback_url: ipnCallbackUrl,
          order_id: orderId,
          order_description: orderDescription,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let gatewayCode: string | undefined;
        try {
          gatewayCode = JSON.parse(errText)?.code;
        } catch {
          // corpo não-JSON: segue só com o texto
        }
        const message = `Falha ao criar pagamento NOWPayments: HTTP ${response.status} ${errText.slice(0, 300)}`;
        if (gatewayCode === 'AMOUNT_MINIMAL_ERROR') {
          const minUsd = await this.getMinimumUsd(cryptoCurrency);
          throw new NowPaymentsApiError(message, response.status, 'crypto_amount_below_minimum', gatewayCode, minUsd);
        }
        throw new NowPaymentsApiError(message, response.status, 'crypto_gateway_rejected', gatewayCode);
      }

      const data = await response.json();
      if (!data.pay_address || !data.pay_amount || !(data.payment_id || data.id)) {
        throw new Error('Resposta NOWPayments sem endereço, valor ou payment_id.');
      }

      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        data.pay_address
      )}`;

      return {
        success: true,
        gateway: 'nowpayments',
        sessionId,
        cryptoDetails: {
          paymentId: String(data.payment_id || data.id),
          payAddress: data.pay_address,
          payAmount: Number(data.pay_amount),
          payCurrency: (data.pay_currency || cryptoCurrency).toUpperCase(),
          priceAmount: priceUSD,
          priceCurrency: 'USD',
          qrCodeUrl,
          expirationEstimate: '60 minutos',
        },
        orderSummary: {
          planId: plan.id,
          planName: plan.name,
          category: plan.category,
          interval: req.interval,
          amount: priceUSD,
          currency: 'USD',
        },
      };
    }

    // 2. Simulação local (somente fora de produção e sem NOWPAYMENTS_API_KEY)
    console.warn('[NOWPayments] Sem NOWPAYMENTS_API_KEY em ambiente de desenvolvimento: retornando carteira simulada.');
    const mockWalletAddress =
      cryptoCurrency.includes('trc')
        ? 'TLi9ArDi88xU7zP3mKvR9bQwRtY2479XpM'
        : cryptoCurrency.includes('bsc') || cryptoCurrency.includes('erc') || cryptoCurrency.includes('eth')
        ? '0x88F7a3C97A14b98C29dB4a33D15264bA0B4B52b7'
        : 'bc1qlumiardi99x7vault847290m3krtpy9201';

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      mockWalletAddress
    )}`;

    return {
      success: true,
      gateway: 'nowpayments',
      sessionId,
      cryptoDetails: {
        paymentId: `pay_${Date.now()}`,
        payAddress: mockWalletAddress,
        payAmount: priceUSD,
        payCurrency: cryptoCurrency.toUpperCase(),
        priceAmount: priceUSD,
        priceCurrency: 'USD',
        qrCodeUrl,
        expirationEstimate: '60 minutos',
      },
      orderSummary: {
        planId: plan.id,
        planName: plan.name,
        category: plan.category,
        interval: req.interval,
        amount: priceUSD,
        currency: 'USD',
      },
    };
  }

  /** Valor mínimo aceito pelo NOWPayments para a moeda, em USD (oscila com a taxa de rede). */
  private async getMinimumUsd(cryptoCurrency: string): Promise<number | undefined> {
    try {
      const res = await fetch(
        `${this.apiUrl}/min-amount?currency_from=${encodeURIComponent(cryptoCurrency)}&fiat_equivalent=usd`,
        { headers: { 'x-api-key': this.apiKey } }
      );
      if (!res.ok) return undefined;
      const min = Number((await res.json())?.fiat_equivalent);
      return Number.isFinite(min) && min > 0 ? Math.ceil(min * 100) / 100 : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Verificação da assinatura HMAC-SHA512 enviada no cabeçalho x-nowpayments-sig
   */
  async verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<boolean> {
    try {
      const secret = this.ipnSecret;
      const receivedSig = headers['x-nowpayments-sig'];

      // Fail-closed em qualquer ambiente: sem segredo ou sem assinatura, nenhum IPN é aceito
      if (!secret || !receivedSig || typeof receivedSig !== 'string') {
        return false;
      }

      const parsed = JSON.parse(rawBody);
      const jsonString = JSON.stringify(this.sortObjectKeys(parsed));
      const calculatedSig = crypto.createHmac('sha512', secret).update(jsonString).digest('hex');

      return safeEqual(calculatedSig, receivedSig.trim().toLowerCase());
    } catch (err) {
      console.error('[NOWPayments IPN] Erro ao validar assinatura HMAC:', err);
      return false;
    }
  }

  /**
   * Processamento dos status de pagamento da transação Cripto
   */
  async handleWebhook(
    rawBody: string,
    _headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookResult> {
    const payload = JSON.parse(rawBody);
    const paymentStatus = payload.payment_status || payload.status || 'finished';
    const paymentId = String(payload.payment_id || payload.id || `nowpay_${Date.now()}`);
    const userId = payload.order_description?.match(/userId:([a-zA-Z0-9_-]+)/)?.[1];

    // Status de sucesso e confirmação na blockchain
    if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
      return {
        handled: true,
        eventType: paymentStatus,
        subscriptionId: `crypto_sub_${paymentId}`,
        transactionId: paymentId,
        userId,
        status: 'success',
        message: 'Pagamento Cripto confirmado e liquidado na blockchain com sucesso.',
      };
    }

    // Status de confirmação em andamento
    if (paymentStatus === 'confirming' || paymentStatus === 'sending' || paymentStatus === 'waiting') {
      return {
        handled: true,
        eventType: paymentStatus,
        subscriptionId: `crypto_sub_${paymentId}`,
        transactionId: paymentId,
        userId,
        status: 'ignored',
        message: `Transação em processo de validação (${paymentStatus}). Aguardando confirmações da rede.`,
      };
    }

    // Status de falha ou expiração
    if (paymentStatus === 'failed' || paymentStatus === 'expired' || paymentStatus === 'refunded') {
      return {
        handled: true,
        eventType: paymentStatus,
        subscriptionId: `crypto_sub_${paymentId}`,
        transactionId: paymentId,
        userId,
        status: 'failed',
        message: `Transação cripto não concluída: ${paymentStatus}.`,
      };
    }

    return {
      handled: true,
      eventType: paymentStatus,
      subscriptionId: `crypto_sub_${paymentId}`,
      status: 'ignored',
      message: `Status ${paymentStatus} processado sem ação adicional necessária.`,
    };
  }

  /**
   * Polling / Consulta de status de pagamento específico
   */
  async getPaymentStatus(paymentId: string): Promise<string> {
    if (!this.apiKey) {
      return 'waiting';
    }

    try {
      const res = await fetch(`${this.apiUrl}/payment/${paymentId}`, {
        headers: { 'x-api-key': this.apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        return data.payment_status || 'waiting';
      }
    } catch (err) {
      console.error('[NOWPayments] Erro no polling de pagamento:', err);
    }
    return 'waiting';
  }

  async getSubscription(_gatewaySubscriptionId: string): Promise<SubscriptionRecord | null> {
    return null;
  }

  async cancelSubscription(_gatewaySubscriptionId: string): Promise<boolean> {
    return true;
  }
}
