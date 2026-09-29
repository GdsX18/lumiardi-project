import { NextRequest, NextResponse } from 'next/server';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval } from '@/lib/payments/types';
import { asaasClient } from '@/lib/payments/asaasClient';
import { BillingService } from '@/lib/payments/billingService';
import { CouponService } from '@/services/couponService';
import { sanitizeInput } from '@/lib/security';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));

    const planId = (sanitizeInput(rawBody.planId) || 'glow') as PlanId;
    const interval = (rawBody.interval === 'yearly' || rawBody.billingInterval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const couponCode = rawBody.couponCode ? (sanitizeInput(rawBody.couponCode) as string).trim().toUpperCase() : undefined;

    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || rawBody.userId || `guest_${Date.now()}`;
    const userEmail = session?.email || rawBody.userEmail || 'membro@lumiardi.com';
    const userName = session?.name || rawBody.userName || 'Membro Lumiardi';
    const phone = rawBody.phone;
    const cpfCnpj = rawBody.cpfCnpj || rawBody.cpf;

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

    // 1. Cliente no Asaas
    const customer = await asaasClient.getOrCreateCustomer({
      name: userName,
      email: userEmail,
      cpfCnpj,
      phone,
      externalReference: userId,
    });

    const today = new Date();
    const dueDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const externalReference = `${userId}:${plan.id}:${interval}${validatedCoupon ? `:${validatedCoupon.code}` : ''}`;

    // 2. Cobrança Pix com valor final descontado
    const payment = await asaasClient.createPayment({
      customerId: customer.id,
      billingType: 'PIX',
      value: finalPrice,
      dueDate,
      description: validatedCoupon
        ? `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) [Cupom ${validatedCoupon.code}]`
        : `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})`,
      externalReference,
    });

    // 3. QR Code e Copia-e-Cola
    const pixQr = await asaasClient.getPixQrCode(payment.id, finalPrice);

    // 4. Registra transação pendente para conciliação no webhook
    try {
      await BillingService.recordTransaction({
        userId,
        gateway: 'asaas',
        gatewayTransactionId: payment.id,
        amount: finalPrice,
        currency: 'BRL',
        status: 'pending',
        paymentMethod: 'pix',
        rawPayload: {
          paymentId: payment.id,
          planId: plan.id,
          interval,
          couponCode: validatedCoupon?.code || null,
          discountAmount,
          originalAmount,
        },
        idempotencyKey: `init_pix_${payment.id}`,
      });
    } catch (txErr) {
      console.warn('[API checkout/pix] Aviso ao registrar transação Pix:', txErr);
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      qrCodeUrl: pixQr.encodedImage,
      copiaECola: pixQr.payload,
      expirationDate: pixQr.expirationDate,
      amount: finalPrice,
      originalAmount,
      discountAmount,
      couponCode: validatedCoupon?.code || null,
      currency: 'BRL',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar Pix no Asaas';
    console.error('[API checkout/pix] Erro:', err);
    return NextResponse.json(
      { error: 'Não foi possível gerar a cobrança Pix.', details: message },
      { status: 500 }
    );
  }
}

