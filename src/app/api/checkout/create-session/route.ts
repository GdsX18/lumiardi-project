import { NextRequest, NextResponse } from 'next/server';
import { paymentFactory } from '@/lib/payments/gatewayFactory';
import { BillingService } from '@/lib/payments/billingService';
import { CreateCheckoutSessionRequest, PaymentGatewayType, PlanId, BillingInterval, CryptoCurrency } from '@/lib/payments/types';
import { sanitizeInput } from '@/lib/security';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

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

    if (!planId) {
      return NextResponse.json(
        { error: 'Parâmetro obrigatório "planId" ausente.' },
        { status: 400 }
      );
    }

    // Verifica sessão do usuário logado se existir
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || rawBody.userId || `guest_${Date.now()}`;
    const userEmail = session?.email || rawBody.userEmail || 'membro@lumiardi.com';
    const userName = session?.name || rawBody.userName || 'Membro Lumiardi';
    const userRole = session?.role === 'agencia' ? 'agencia' : 'criadora';

    const checkoutReq: CreateCheckoutSessionRequest = {
      userId,
      userEmail,
      userName,
      userRole,
      planId,
      interval,
      gateway,
      cryptoCurrency,
      cpfCnpj: rawBody.cpfCnpj || rawBody.cpf,
      phone: rawBody.phone,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?status=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?plan=${planId}&status=canceled`,
    };

    const gatewayAdapter = paymentFactory.getGateway(gateway);
    const sessionResult = await gatewayAdapter.createCheckoutSession(checkoutReq);

    // Se gerou cobrança Pix via Asaas, pré-registra a transação pendente para conciliação no webhook
    if (sessionResult.pixDetails?.paymentId) {
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
    const message = err instanceof Error ? err.message : 'Erro ao inicializar checkout';
    console.error('[API Checkout] Erro:', err);
    return NextResponse.json(
      { error: 'Não foi possível gerar a sessão de pagamento.', details: message },
      { status: 500 }
    );
  }
}
