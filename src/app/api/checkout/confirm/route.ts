import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { StorageService } from '@/services/storageService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PaymentGatewayType } from '@/lib/payments/types';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { asaasClient } from '@/lib/payments/asaasClient';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const planId = (sanitizeInput(rawBody.planId) || 'glow') as PlanId;
    const billingInterval = (rawBody.billingInterval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const requestedGateway = rawBody.gateway as string;
    const gateway: PaymentGatewayType =
      requestedGateway === 'nowpayments'
        ? 'nowpayments'
        : requestedGateway === 'pix'
        ? 'pix'
        : 'asaas';

    const paymentMethod = rawBody.paymentMethod || (gateway === 'pix' ? 'pix' : gateway === 'nowpayments' ? 'crypto' : 'credit_card');

    const plan = getPlan(planId);
    const isYearly = billingInterval === 'yearly';
    const currency = (rawBody.currency === 'USD' ? 'USD' : 'BRL') as 'BRL' | 'USD';
    const finalAmount = currency === 'USD'
      ? (isYearly ? plan.priceUSD.yearly * 12 : plan.priceUSD.monthly)
      : (isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly);

    const userId = session?.id || rawBody.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não identificado. Por favor, complete o cadastro antes do pagamento.' },
        { status: 401 }
      );
    }

    const userEmail = session?.email || rawBody.userEmail || 'membro@lumiardi.com';
    const userName = session?.name || rawBody.userName || 'Membro Lumiardi';

    let asaasPaymentId = '';

    // 1. Processamento via Asaas quando for Cartão de Crédito em BRL
    if (paymentMethod === 'credit_card' && currency === 'BRL' && rawBody.cardData) {
      const card = rawBody.cardData;
      const today = new Date();
      const dueDate = today.toISOString().split('T')[0];

      try {
        // Garante cliente no Asaas
        const customer = await asaasClient.getOrCreateCustomer({
          name: userName,
          email: userEmail,
          cpfCnpj: card.cpf || rawBody.taxId,
          phone: rawBody.phone,
          externalReference: userId,
        });

        // Cria e processa cobrança no Asaas
        const asaasPayment = await asaasClient.createPayment({
          customerId: customer.id,
          billingType: 'CREDIT_CARD',
          value: finalAmount,
          dueDate,
          description: `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})`,
          externalReference: `${userId}:${plan.id}:${billingInterval}`,
          creditCard: {
            holderName: card.holderName || userName,
            number: card.number.replace(/\D/g, ''),
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            ccv: card.cvv,
          },
          creditCardHolderInfo: {
            name: card.holderName || userName,
            email: userEmail,
            cpfCnpj: (card.cpf || rawBody.taxId || '00000000000').replace(/\D/g, ''),
            phone: rawBody.phone,
          },
          installmentCount: card.installments ? Number(card.installments) : 1,
        });

        asaasPaymentId = asaasPayment.id;

        // Se o pagamento for recusado imediatamente
        if (asaasPayment.status === 'OVERDUE' || asaasPayment.status === 'REFUNDED') {
          return NextResponse.json(
            { error: 'Pagamento não aprovado pela operadora do cartão.' },
            { status: 400 }
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Falha ao processar cartão com o gateway Asaas.';
        console.error('[Checkout Confirm Asaas Error]:', err);
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
    }

    const txId = asaasPaymentId || `${gateway}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 2. Cria a assinatura no BillingService
    const subscription = await BillingService.createOrRenewSubscription({
      userId,
      gateway: gateway === 'pix' ? 'asaas' : gateway,
      gatewaySubscriptionId: txId,
      planId: plan.id,
      planCategory: plan.category,
      billingInterval,
      amount: finalAmount,
      currency,
      metadata: {
        paymentMethod,
        cardLast4: rawBody.cardLast4 || (rawBody.cardData?.number ? rawBody.cardData.number.slice(-4) : undefined),
        paidAt: new Date().toISOString(),
        userEmail,
        userName,
        asaasPaymentId: asaasPaymentId || undefined,
      },
    });

    // 3. Registra a transação de pagamento
    await BillingService.recordTransaction({
      userId,
      subscriptionId: subscription.id,
      gateway: gateway === 'pix' ? 'asaas' : gateway,
      gatewayTransactionId: txId,
      amount: finalAmount,
      currency,
      status: 'success',
      paymentMethod: paymentMethod === 'crypto' ? 'crypto' : paymentMethod === 'pix' ? 'pix' : 'credit_card',
      rawPayload: {
        planId: plan.id,
        planName: plan.name,
        billingInterval,
        gateway,
        paidAt: new Date().toISOString(),
        asaasPaymentId,
      },
      idempotencyKey: `confirm_${txId}`,
    });

    // 4. Cria notificação para o usuário
    try {
      const formattedTotal = currency === 'USD' ? `$ ${finalAmount.toFixed(2)}` : `R$ ${finalAmount.toFixed(2).replace('.', ',')}`;
      await StorageService.createNotification({
        userId,
        title: 'Pagamento Confirmado',
        desc: `O pagamento do Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) de ${formattedTotal} foi confirmado com sucesso via ${gateway === 'nowpayments' ? 'NOWPayments' : 'Asaas'}. Sua candidatura foi enviada com prioridade para a Mesa de Curadoria.`,
        category: 'Pagamentos',
        type: 'success',
        link: '/dashboard/pendente',
        linkText: 'Ver Status da Curadoria',
      });
    } catch (e) {
      console.warn('[Checkout Confirm] Erro ao criar notificação:', e);
    }

    return NextResponse.json({
      success: true,
      subscription,
      amountPaid: finalAmount,
      currency,
      planName: plan.name,
      message: 'Pagamento confirmado com sucesso via Asaas. Candidatura em análise pela Curadoria VIP.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar confirmação de pagamento';
    console.error('[Checkout Confirm] Erro:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
