import { NextRequest, NextResponse } from 'next/server';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval } from '@/lib/payments/types';
import { asaasClient } from '@/lib/payments/asaasClient';
import { BillingService } from '@/lib/payments/billingService';
import { StorageService } from '@/services/storageService';
import { CouponService } from '@/services/couponService';
import { sanitizeInput } from '@/lib/security';
import { decodeSession, encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { pool, initDatabase } from '@/lib/db';

function normalizeAsaasError(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('invalid number') || r.includes('card_number_invalid') || r.includes('número do cartão'))
    return 'O número do cartão informado é inválido. Verifique os dados e tente novamente.';
  if (r.includes('invalid expiry') || r.includes('expirymonth') || r.includes('expiryyear') || r.includes('validade'))
    return 'A data de validade do cartão está incorreta. Verifique e tente novamente.';
  if (r.includes('invalid cvv') || r.includes('ccv') || r.includes('código de segurança'))
    return 'O código de segurança (CVV) do cartão é inválido.';
  if (r.includes('insufficient') || r.includes('saldo insuficiente'))
    return 'Transação recusada por saldo insuficiente. Tente outro cartão ou pague via Pix.';
  if (r.includes('not authorized') || r.includes('não autorizado') || r.includes('declined'))
    return 'Transação não autorizada pela emissora do cartão. Verifique os dados ou tente outro cartão.';
  if (r.includes('stolen') || r.includes('lost') || r.includes('furtado') || r.includes('perdido'))
    return 'Transação recusada pela emissora do cartão. Entre em contato com seu banco.';
  if (r.includes('cpf') || r.includes('cnpj') || r.includes('document'))
    return 'O CPF/CNPJ informado não é válido. Verifique os dados do titular do cartão.';
  if (r.includes('phone') || r.includes('contato') || r.includes('telefone'))
    return 'O número de telefone do titular é obrigatório. Tente novamente.';
  if (r.includes('timeout') || r.includes('network') || r.includes('econnreset'))
    return 'Erro de conexão com a operadora. Aguarde alguns instantes e tente novamente.';
  if (r.includes('http 401') || r.includes('unauthorized') || r.includes('api key'))
    return 'Erro interno de configuração do gateway. Por favor, contate o suporte.';
  return 'Transação não autorizada pela emissora do cartão. Verifique os dados ou tente outro cartão / Pix.';
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));

    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const planId = (sanitizeInput(rawBody.planId) || 'glow') as PlanId;
    const interval = (rawBody.interval === 'yearly' || rawBody.billingInterval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const couponCode = rawBody.couponCode ? (sanitizeInput(rawBody.couponCode) as string).trim().toUpperCase() : undefined;

    const plan = getPlan(planId);
    const isYearly = interval === 'yearly';
    const originalAmount = isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;

    let finalPrice = originalAmount;
    let discountAmount = 0;
    let validatedCoupon = null;

    if (couponCode) {
      const couponCheck = await CouponService.validateCoupon(couponCode, originalAmount);
      if (couponCheck.valid) {
        validatedCoupon = couponCheck;
        discountAmount = couponCheck.discountAmount;
        finalPrice = couponCheck.finalPrice;
      } else {
        return NextResponse.json(
          { error: 'Cupom de desconto inválido ou expirado.' },
          { status: 400 }
        );
      }
    }

    if (finalPrice < 5.00) {
      return NextResponse.json(
        { error: 'O valor mínimo exigido pela operadora do cartão é R$ 5,00.' },
        { status: 400 }
      );
    }

    const card = rawBody.cardData;
    if (!card) {
      return NextResponse.json(
        { error: 'Dados do cartão de crédito ausentes no payload.' },
        { status: 400 }
      );
    }

    const userId = session?.id || rawBody.userId || `guest_${Date.now()}`;
    const userEmail = session?.email || rawBody.userEmail || 'membro@lumiardi.com';
    const userName = session?.name || rawBody.userName || 'Membro Lumiardi';

    const cpfCnpjRaw = card.cpf || rawBody.taxId;
    if (!cpfCnpjRaw) {
      return NextResponse.json(
        { error: 'CPF/CNPJ/Passaporte ausente. É obrigatório informar um documento válido.' },
        { status: 400 }
      );
    }

    let cpfCnpj = cpfCnpjRaw.replace(/\D/g, '');
    if (cpfCnpj.length < 11) {
      cpfCnpj = cpfCnpj.padStart(11, '0');
    }

    const today = new Date();
    const dueDate = today.toISOString().split('T')[0];

    let asaasPaymentId = '';

    try {
      const customer = await asaasClient.getOrCreateCustomer({
        name: userName,
        email: userEmail,
        cpfCnpj,
        phone: rawBody.phone,
        externalReference: userId,
      });

      const asaasResponse = await asaasClient.createPayment({
        customerId: customer.id,
        billingType: 'CREDIT_CARD',
        value: finalPrice,
        dueDate,
        description: validatedCoupon
          ? `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) [Cupom ${validatedCoupon.code}]`
          : `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})`,
        externalReference: `${userId}:${plan.id}:${interval}${validatedCoupon ? `:${validatedCoupon.code}` : ''}`,
        creditCard: {
          holderName: card.holderName || userName,
          number: card.number.replace(/\D/g, ''),
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          ccv: card.ccv || card.cvv || '123',
        },
        creditCardHolderInfo: {
          name: card.holderName || userName,
          email: userEmail,
          cpfCnpj,
          postalCode: card.postalCode,
          addressNumber: card.addressNumber,
          phone: rawBody.phone,
        },
        installmentCount: card.installments ? Number(card.installments) : 1,
      });

      asaasPaymentId = asaasResponse.id;

      if (asaasResponse.status === 'OVERDUE' || asaasResponse.status === 'REFUNDED') {
        return NextResponse.json(
          { error: 'Pagamento não aprovado pela operadora do cartão.' },
          { status: 400 }
        );
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      console.error('[API checkout/card Asaas Error]:', rawMsg);
      const friendlyMessage = normalizeAsaasError(rawMsg);
      return NextResponse.json({ error: friendlyMessage }, { status: 400 });
    }

    // Garante usuário no banco
    try {
      await initDatabase();
      await pool.query(`
        INSERT INTO users (id, email, password_hash, role, curation_status, full_name)
        VALUES ($1, $2, '$2b$10$placeholderhashinvalidnotusedforlogin000000000000000000', 'MODELO', 'EM_CURATORIA', $3)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          updated_at = NOW();
      `, [userId, userEmail, userName]);
    } catch (err) {
      console.warn('[API checkout/card] UPSERT de usuário falhou:', err);
    }

    const txId = asaasPaymentId || `asaas_card_${Date.now()}`;

    // Cria assinatura
    const subscription = await BillingService.createOrRenewSubscription({
      userId,
      gateway: 'asaas',
      gatewaySubscriptionId: txId,
      planId: plan.id,
      planCategory: plan.category,
      billingInterval: interval,
      amount: finalPrice,
      currency: 'BRL',
      metadata: {
        paymentMethod: 'credit_card',
        cardLast4: card.number ? card.number.replace(/\s/g, '').slice(-4) : undefined,
        paidAt: new Date().toISOString(),
        userEmail,
        userName,
        asaasPaymentId,
        couponCode: validatedCoupon?.code || undefined,
        discountAmount,
      },
    });

    // Registra transação
    await BillingService.recordTransaction({
      userId,
      subscriptionId: subscription?.id,
      gateway: 'asaas',
      gatewayTransactionId: txId,
      amount: finalPrice,
      currency: 'BRL',
      status: 'success',
      paymentMethod: 'credit_card',
      rawPayload: {
        planId: plan.id,
        planName: plan.name,
        billingInterval: interval,
        gateway: 'asaas',
        paidAt: new Date().toISOString(),
        asaasPaymentId,
        couponCode: validatedCoupon?.code || null,
        discountAmount,
        originalAmount,
      },
      idempotencyKey: `confirm_${txId}`,
    });

    // Incrementa contagem de usos do cupom no banco de dados após confirmação da cobrança
    if (validatedCoupon) {
      try {
        await CouponService.incrementCouponUses(validatedCoupon.code);
      } catch (couponErr) {
        console.warn('[API checkout/card] Erro ao incrementar times_used do cupom:', couponErr);
      }
    }

    // Promove status para APROVADO
    let updatedSession: SessionUser | null = null;
    try {
      await StorageService.updateCurationStatus(userId, 'APROVADO');
      if (session) {
        updatedSession = { ...session, curationStatus: 'APROVADO' };
      }
    } catch (curationErr) {
      console.error('[API checkout/card] Erro ao promover status para APROVADO:', curationErr);
    }

    // Notificação
    try {
      await StorageService.createNotification({
        userId,
        title: 'Acesso Oficial Liberado — Bem-vinda à Lumiardi!',
        desc: `O pagamento do Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) de R$ ${finalPrice.toFixed(2).replace('.', ',')} foi confirmado com sucesso. Sua credencial foi ativada!`,
        category: 'Pagamentos',
        type: 'success',
        link: '/dashboard',
        linkText: 'Acessar Meu Painel',
      });
    } catch (notifErr) {
      console.warn('[API checkout/card] Erro ao criar notificação:', notifErr);
    }

    const response = NextResponse.json({
      success: true,
      subscription,
      paymentId: txId,
      amountPaid: finalPrice,
      originalAmount,
      discountAmount,
      couponCode: validatedCoupon?.code || null,
      currency: 'BRL',
      planName: plan.name,
      message: 'Pagamento confirmado com sucesso via Asaas. Seu acesso ao ecossistema Lumiardi está 100% liberado!',
    });

    if (updatedSession) {
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: encodeSession(updatedSession),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar cartão no Asaas';
    console.error('[API checkout/card] Erro:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

