import { NextRequest, NextResponse } from 'next/server';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { CreateCheckoutSessionRequest, PaymentGatewayType, PlanId, BillingInterval, CryptoCurrency } from '@/lib/payments/types';
import { sanitizeInput } from '@/lib/security';
import { requirePayableUser } from '@/lib/payments/checkoutGuard';
import { AsaasApiError } from '@/lib/payments/asaasClient';
import { NowPaymentsApiError } from '@/lib/payments/nowpaymentsAdapter';
import { asaasErrorCode, asaasGatewayError, checkoutDebugFields } from '@/lib/payments/asaasErrors';
import { cleanCpfCnpj, cleanPhoneBR } from '@/lib/payments/document';

export async function POST(request: NextRequest) {
  // Etapa em curso: identifica onde uma exceção interna (não-Asaas) ocorreu
  let step = 'parse_body';
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ error: 'Corpo da requisição inválido.', code: 'invalid_input' }, { status: 400 });
    }

    const planId = sanitizeInput(rawBody.planId) as PlanId;
    const interval = (rawBody.interval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const requestedGateway = rawBody.gateway as string;
    const gateway: PaymentGatewayType =
      requestedGateway === 'nowpayments'
        ? 'nowpayments'
        : requestedGateway === 'pix'
        ? 'pix'
        : 'asaas';

    const cryptoCurrency = rawBody.cryptoCurrency ? (sanitizeInput(rawBody.cryptoCurrency) as CryptoCurrency) : undefined;
    const couponCode = rawBody.couponCode ? (sanitizeInput(rawBody.couponCode) as string).trim().toUpperCase() : undefined;

    if (!planId) {
      return NextResponse.json(
        { error: 'Parâmetro obrigatório "planId" ausente.' },
        { status: 400 }
      );
    }

    // Identidade exclusivamente da sessão assinada; só quem foi aprovada pela curadoria pode gerar cobrança
    step = 'load_user';
    const guard = await requirePayableUser(request);
    if (!guard.ok) return guard.response;
    const { id: userId, email: userEmail, name: userName } = guard.user;
    const userRole = guard.user.role === 'agencia' ? 'agencia' : 'criadora';

    // O Asaas só emite Pix para cliente com CPF/CNPJ válido (só dígitos): o digitado no checkout ou o do cadastro
    const typedDocument = rawBody.cpfCnpj || rawBody.cpf;
    const cpfCnpj = cleanCpfCnpj(typedDocument) || (typedDocument ? undefined : cleanCpfCnpj(guard.user.documentNumber));
    if (gateway === 'pix' && !cpfCnpj) {
      return NextResponse.json(
        {
          error: typedDocument
            ? 'O CPF/CNPJ informado é inválido. Verifique os números digitados.'
            : 'Informe o CPF do pagador para gerar o Pix.',
          code: typedDocument ? 'invalid_document' : 'pix_document_required',
        },
        { status: 400 }
      );
    }

    const checkoutReq: CreateCheckoutSessionRequest = {
      userId,
      userEmail,
      userName,
      userRole,
      planId,
      interval,
      gateway,
      cryptoCurrency,
      cpfCnpj,
      phone: cleanPhoneBR(rawBody.phone) || cleanPhoneBR(guard.user.phone),
      couponCode,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?status=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?plan=${planId}&status=canceled`,
    };

    step = `gateway_${gateway}`;
    const gatewayAdapter = paymentFactory.getGateway(gateway);
    const sessionResult = await gatewayAdapter.createCheckoutSession(checkoutReq);

    // Se gerou cobrança Pix via Asaas, pré-registra a transação pendente para conciliação no webhook
    if (sessionResult.pixDetails?.paymentId) {
      step = 'record_pix';
      try {
        await BillingService.recordTransaction({
          userId,
          gateway: 'asaas',
          gatewayTransactionId: sessionResult.pixDetails.paymentId,
          amount: sessionResult.orderSummary.amount,
          currency: 'BRL',
          status: 'pending',
          paymentMethod: 'pix',
          rawPayload: {
            pixDetails: sessionResult.pixDetails,
            planId,
            interval,
            couponCode,
            orderSummary: sessionResult.orderSummary,
          },
          idempotencyKey: `init_pix_${sessionResult.pixDetails.paymentId}`,
        });
      } catch (err) {
        console.warn('[Create Checkout Session] Aviso ao pré-registrar transação Pix:', err);
      }
    }

    return NextResponse.json(sessionResult);
  } catch (err: unknown) {
    if (err instanceof AsaasApiError) {
      console.error('[API Checkout] Erro Asaas:', JSON.stringify({ stage: err.stage, status: err.status, asaasCode: err.code, message: err.message, asaasResponse: err.details }));
      const code = asaasErrorCode(err);
      return NextResponse.json(
        {
          error:
            code === 'invalid_document'
              ? 'O CPF/CNPJ informado não foi aceito pelo Asaas. Verifique os números digitados.'
              : 'Não foi possível gerar a sessão de pagamento.',
          code,
          stage: err.stage,
          ...asaasGatewayError(err),
          ...checkoutDebugFields(err),
        },
        { status: code === 'payment_unavailable' ? 502 : 400 }
      );
    }
    if (err instanceof NowPaymentsApiError) {
      console.error('[API Checkout] Erro NOWPayments:', JSON.stringify({ status: err.status, code: err.code, gatewayCode: err.gatewayCode, minUsd: err.minUsd, message: err.message }));
      return NextResponse.json(
        {
          error:
            err.code === 'crypto_amount_below_minimum'
              ? 'O valor deste plano está abaixo do mínimo aceito para pagamento com esta criptomoeda.'
              : 'O processador de criptomoedas (NOWPayments) recusou a cobrança.',
          code: err.code,
          stage: 'nowpayments',
          ...(err.minUsd ? { minUsd: err.minUsd } : {}),
          ...checkoutDebugFields(err),
        },
        { status: 400 }
      );
    }
    console.error(`[API Checkout] Erro interno na etapa "${step}":`, err);
    return NextResponse.json(
      {
        error: 'Não foi possível gerar a sessão de pagamento.',
        code: 'payment_unavailable',
        stage: `internal:${step}`,
        ...checkoutDebugFields(err),
      },
      { status: 500 }
    );
  }
}
