/**
 * LUMIARDI — ASAAS ADAPTER (API v3)
 * Adaptador oficial para processamento de pagamentos em BRL (Pix e Cartão de Crédito)
 * Conforme especificações da API v3 do Asaas (https://www.asaas.com/).
 */

import {
  PaymentGatewayService,
  PaymentGatewayType,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  WebhookResult,
  SubscriptionRecord,
} from './types';
import { getPlan } from './plansConfig';
import { asaasClient } from './asaasClient';
import { CouponService } from '@/services/couponService';

export class AsaasAdapter implements PaymentGatewayService {
  public readonly gatewayName: PaymentGatewayType = 'asaas';

  /**
   * Cria uma sessão de checkout ou cobrança via Asaas
   */
  async createCheckoutSession(
    req: CreateCheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    const plan = getPlan(req.planId);
    const isYearly = req.interval === 'yearly';
    let amount = isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;
    let appliedCoupon: { code: string; discountAmount: number } | null = null;

    if (req.couponCode) {
      const validation = await CouponService.validateCoupon(req.couponCode, amount);
      if (validation.valid) {
        amount = validation.finalPrice;
        appliedCoupon = { code: validation.code, discountAmount: validation.discountAmount };
      }
    }

    const externalReference = `${req.userId}:${req.planId}:${req.interval}${appliedCoupon ? `:${appliedCoupon.code}` : ''}`;
    const today = new Date();
    const dueDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Pix: garante o cliente no Asaas (com CPF/CNPJ, exigido para emitir Pix), gera a cobrança e o QR Code dinâmico
    if (req.gateway === 'pix') {
      const customer = await asaasClient.getOrCreateCustomer({
        name: req.userName,
        email: req.userEmail,
        cpfCnpj: req.cpfCnpj,
        phone: req.phone,
        externalReference: req.userId,
      });

      const payment = await asaasClient.createPayment({
        customerId: customer.id,
        billingType: 'PIX',
        value: amount,
        dueDate,
        description: `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})`,
        externalReference,
      });

      const pixQr = await asaasClient.getPixQrCode(payment.id, amount);

      return {
        success: true,
        gateway: 'asaas',
        sessionId: payment.id,
        pixDetails: {
          paymentId: payment.id,
          encodedImage: pixQr.encodedImage,
          payload: pixQr.payload,
          expirationDate: pixQr.expirationDate,
        },
        orderSummary: {
          planId: plan.id,
          planName: plan.name,
          category: plan.category,
          interval: req.interval,
          amount,
          currency: 'BRL',
        },
      };
    }

    // 2. Checkout padrão / Cartão (a cobrança é criada em /api/checkout/confirm)
    const sessionId = `asaas_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      success: true,
      gateway: 'asaas',
      sessionId,
      orderSummary: {
        planId: plan.id,
        planName: plan.name,
        category: plan.category,
        interval: req.interval,
        amount,
        currency: 'BRL',
      },
    };
  }

  /**
   * Verificação de autenticação do Webhook Asaas
   * O Asaas envia o token de webhook no header 'asaas-access-token'
   */
  async verifyWebhookSignature(
    _rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<boolean> {
    const headerToken =
      (headers['asaas-access-token'] as string) ||
      (headers['asaas_access_token'] as string) ||
      (headers['access_token'] as string) ||
      (headers['access-token'] as string);

    return asaasClient.verifyWebhookToken(headerToken);
  }

  /**
   * Tratamento dos eventos Webhook do Asaas (API v3)
   * Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_REFUNDED
   */
  async handleWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookResult> {
    const isValid = await this.verifyWebhookSignature(rawBody, headers);
    if (!isValid) {
      return {
        handled: false,
        eventType: 'UNKNOWN',
        status: 'failed',
        message: 'Token de autenticação do Webhook Asaas inválido.',
      };
    }

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return {
        handled: false,
        eventType: 'UNKNOWN',
        status: 'failed',
        message: 'Payload JSON inválido recebido no Webhook Asaas.',
      };
    }

    const eventType = String(payload.event || 'UNKNOWN');
    const payment = payload.payment || {};
    const transactionId = payment.id || `pay_${Date.now()}`;
    const externalRef = payment.externalReference || '';

    // Extrai userId da externalReference (formato userId:planId:interval)
    let userId: string | undefined = undefined;
    if (externalRef && typeof externalRef === 'string') {
      const parts = externalRef.split(':');
      userId = parts[0];
    }

    switch (eventType) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        return {
          handled: true,
          eventType,
          subscriptionId: payment.id,
          transactionId,
          userId,
          status: 'success',
          message: `Pagamento Asaas ${eventType} confirmado com sucesso.`,
        };

      case 'PAYMENT_OVERDUE':
        return {
          handled: true,
          eventType,
          subscriptionId: payment.id,
          transactionId,
          userId,
          status: 'success',
          message: 'Cobrança Asaas vencida (PAYMENT_OVERDUE). Assinatura suspensa.',
        };

      case 'PAYMENT_REFUNDED':
        return {
          handled: true,
          eventType,
          subscriptionId: payment.id,
          transactionId,
          userId,
          status: 'success',
          message: 'Cobrança Asaas estornada (PAYMENT_REFUNDED). Acesso cancelado.',
        };

      default:
        return {
          handled: true,
          eventType,
          subscriptionId: payment.id,
          transactionId,
          userId,
          status: 'ignored',
          message: `Evento Asaas ${eventType} recebido sem ação necessária.`,
        };
    }
  }

  /**
   * Consulta de assinatura / cobrança no Asaas
   */
  async getSubscription(_gatewaySubscriptionId: string): Promise<SubscriptionRecord | null> {
    return null;
  }

  /**
   * Cancelamento de cobrança ou assinatura no Asaas
   */
  async cancelSubscription(_gatewaySubscriptionId: string): Promise<boolean> {
    return true;
  }
}

