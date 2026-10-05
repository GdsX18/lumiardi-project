import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { withTransaction } from '@/lib/db';
import { cache } from '@/lib/cache';
import { StorageService } from '@/services/storageService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PaymentGatewayType, SubscriptionRecord } from '@/lib/payments/types';
import { SessionUser, setSessionCookie } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { asaasClient, AsaasApiError, AsaasPaymentResponse } from '@/lib/payments/asaasClient';
import { asaasErrorCode, asaasGatewayError, checkoutDebugFields } from '@/lib/payments/asaasErrors';
import { getClientIp } from '@/lib/security/rateLimiter';
import { cleanCpfCnpj, cleanPhoneBR, resolveHolderContact } from '@/lib/payments/document';
import { CouponService, MIN_CHARGE_BRL } from '@/services/couponService';
import { requirePayableUser, ASAAS_PAID_STATUSES, ASAAS_PROCESSING_STATUSES } from '@/lib/payments/checkoutGuard';

export async function POST(request: NextRequest) {
  let reservedCoupon: string | null = null;
  // Etapa em curso: identifica onde uma exceção interna (não-Asaas) ocorreu
  let step = 'parse_body';
  try {
    const rawBody = await request.json().catch(() => ({}));

    // 1. Identidade SEMPRE da sessão assinada + status de curadoria lido do banco
    step = 'load_user';
    const guard = await requirePayableUser(request);
    if (!guard.ok) return guard.response;
    const { id: userId, email: userEmail, name: userName, session } = guard.user;

    const planId = (sanitizeInput(rawBody.planId) || 'glow') as PlanId;
    const billingInterval = (rawBody.billingInterval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const requestedGateway = (rawBody.gateway as string) || 'pix';
    const gateway: PaymentGatewayType =
      requestedGateway === 'nowpayments' ? 'nowpayments' : requestedGateway === 'pix' ? 'pix' : 'asaas';

    const paymentMethod: 'credit_card' | 'crypto' | 'pix' =
      rawBody.paymentMethod === 'credit_card' || rawBody.paymentMethod === 'crypto' || rawBody.paymentMethod === 'pix'
        ? rawBody.paymentMethod
        : rawBody.cardData
        ? 'credit_card'
        : gateway === 'nowpayments'
        ? 'crypto'
        : 'pix';

    step = 'pricing';
    const plan = getPlan(planId);
    const isYearly = billingInterval === 'yearly';
    const couponCode = rawBody.couponCode ? (sanitizeInput(rawBody.couponCode) as string).trim().toUpperCase() : undefined;

    // O cartão é sempre liquidado em BRL no Asaas; Pix/cripto seguem a moeda exibida
    const currency: 'BRL' | 'USD' = paymentMethod === 'credit_card' ? 'BRL' : rawBody.currency === 'USD' ? 'USD' : 'BRL';
    const baseAmount =
      currency === 'USD'
        ? isYearly
          ? plan.priceUSD.yearly * 12
          : plan.priceUSD.monthly
        : isYearly
        ? plan.priceBRL.yearly * 12
        : plan.priceBRL.monthly;

    let finalAmount = baseAmount;
    let couponValidation: { code: string; discountAmount: number; finalPrice: number } | null = null;

    if (couponCode) {
      const v = await CouponService.validateCoupon(couponCode, baseAmount);
      if (!v.valid) {
        return NextResponse.json({ error: 'Cupom de desconto inválido ou expirado.', code: 'coupon_invalid' }, { status: 400 });
      }
      couponValidation = v;
      finalAmount = v.finalPrice;
    }

    // 2. Pix / cripto: a liquidação é confirmada exclusivamente pelo webhook do gateway
    if (paymentMethod !== 'credit_card') {
      step = 'record_instant_payment';
      const txId = `${gateway}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await BillingService.recordTransaction({
        userId,
        gateway: gateway === 'pix' ? 'asaas' : gateway,
        gatewayTransactionId: txId,
        amount: finalAmount,
        currency,
        status: 'pending',
        paymentMethod,
        rawPayload: {
          planId: plan.id,
          planName: plan.name,
          billingInterval,
          couponCode: couponValidation?.code || null,
          discountAmount: couponValidation?.discountAmount || 0,
          note: 'Confirmação manual da usuária — aguardando webhook do gateway',
        },
        idempotencyKey: `confirm_${txId}`,
      });

      try {
        const formattedTotal =
          currency === 'USD' ? `$ ${finalAmount.toFixed(2)}` : `R$ ${finalAmount.toFixed(2).replace('.', ',')}`;
        await StorageService.createNotification({
          userId,
          title: 'Aguardando Compensação',
          desc: `Aguardando a confirmação do pagamento do Plano ${plan.name} de ${formattedTotal} via ${paymentMethod === 'pix' ? 'Pix' : 'Cripto'}. Seu acesso oficial será liberado assim que o pagamento for compensado.`,
          category: 'Pagamentos',
          type: 'info',
          link: '/dashboard/pendente',
          linkText: 'Ver Status',
        });
      } catch (e) {
        console.warn('[Checkout Confirm] Erro ao criar notificação:', e);
      }

      return NextResponse.json({
        success: true,
        pending: true,
        code: 'payment_processing',
        amountPaid: finalAmount,
        originalAmount: baseAmount,
        discountAmount: couponValidation?.discountAmount || 0,
        couponCode: couponValidation?.code || null,
        currency,
        planName: plan.name,
        message: 'Aguardando compensação do pagamento. A assinatura será ativada automaticamente assim que liquidada.',
      });
    }

    // 3. Cartão de crédito via Asaas
    step = 'card_validation';
    const card = rawBody.cardData;
    if (!card || typeof card.number !== 'string' || !card.number.replace(/\D/g, '')) {
      return NextResponse.json({ error: 'Dados do cartão de crédito ausentes no payload.', code: 'invalid_input' }, { status: 400 });
    }

    const cvvCode = String(card.ccv || card.cvv || '').trim();
    const expiryMonth = String(card.expiryMonth ?? '').replace(/\D/g, '').padStart(2, '0').slice(-2);
    const rawExpiryYear = String(card.expiryYear ?? '').replace(/\D/g, '');
    const expiryYear = rawExpiryYear.length === 2 ? `20${rawExpiryYear}` : rawExpiryYear;
    if (!cvvCode) {
      return NextResponse.json({ error: 'O código de segurança (CVV) do cartão é obrigatório.', code: 'invalid_input' }, { status: 400 });
    }

    if (!/^(0[1-9]|1[0-2])$/.test(expiryMonth) || !/^\d{4}$/.test(expiryYear)) {
      return NextResponse.json({ error: 'Validade do cartão inválida. Use o formato MM/AA.', code: 'invalid_input' }, { status: 400 });
    }

    if (finalAmount < MIN_CHARGE_BRL) {
      return NextResponse.json({ error: 'O valor mínimo exigido pela operadora do cartão é R$ 5,00.', code: 'invalid_input' }, { status: 400 });
    }

    // Titular do cartão (pode ser outra pessoa que não a dona da conta, ex.: pai pagando a adesão da filha).
    // O checkout só pede nome e CPF/CNPJ; o Asaas só aceita CPF/CNPJ brasileiro válido, só com dígitos.
    const holderName = String(card.holderName || '').trim() || userName.trim();
    if (!holderName) {
      return NextResponse.json({ error: 'Informe o nome do titular do cartão.', code: 'invalid_input' }, { status: 400 });
    }
    const holderCpfCnpj = cleanCpfCnpj(card.cpf || rawBody.taxId);
    if (!holderCpfCnpj) {
      return NextResponse.json(
        {
          error: 'O CPF/CNPJ do titular do cartão é inválido. Verifique os números digitados (o Asaas aceita apenas CPF/CNPJ brasileiro).',
          code: 'invalid_document',
        },
        { status: 400 }
      );
    }
    // CEP, número e telefone (obrigatórios em creditCardHolderInfo) vêm do cadastro da conta; o que faltar,
    // o formulário pede. Nada é inventado: dados fictícios disparam o antifraude do Asaas.
    const holderContact = resolveHolderContact(guard.user.address, guard.user.phone, {
      postalCode: card.postalCode,
      addressNumber: card.addressNumber,
      phone: card.phone,
    });
    if (holderContact.missing.length > 0) {
      return NextResponse.json(
        {
          error: 'Informe o CEP, o número do endereço e o telefone (com DDD) do titular do cartão.',
          code: 'holder_contact_required',
          missing: holderContact.missing,
        },
        { status: 400 }
      );
    }
    const holderPostalCode = holderContact.postalCode!;
    const holderAddressNumber = holderContact.addressNumber!;
    const holderPhone = holderContact.phone!;
    const holderEmail = userEmail;

    // IP real da pagadora (exigido pelo Asaas para cartão; o antifraude rejeita sem ele)
    const clientIp = getClientIp(request.headers);
    const remoteIp = clientIp !== 'unknown' ? clientIp : undefined;
    if (!remoteIp) {
      console.warn('[Checkout Confirm] IP do cliente ausente nos headers (x-real-ip / x-forwarded-for); remoteIp não enviado ao Asaas.');
    }

    // Cliente Asaas = conta da plataforma. Usa o CPF/CNPJ do cadastro; o do titular só entra se o cadastro não tiver um
    // válido (o Asaas exige documento no cliente) e nunca sobrescreve um documento já salvo no Asaas.
    const customerCpfCnpj = cleanCpfCnpj(guard.user.documentNumber) || holderCpfCnpj;

    // Reserva atômica do cupom antes de cobrar (respeita max_uses com checkouts concorrentes)
    if (couponValidation) {
      step = 'reserve_coupon';
      const reserved = await CouponService.reserveCouponUse(couponValidation.code);
      if (!reserved) {
        return NextResponse.json({ error: 'Cupom de desconto inválido ou esgotado.', code: 'coupon_invalid' }, { status: 400 });
      }
      reservedCoupon = couponValidation.code;
    }

    const installments = Math.min(12, Math.max(1, Math.floor(Number(card.installments) || 1)));
    let asaasPaymentId = '';
    let asaasStatus = '';
    let asaasResponseBody: AsaasPaymentResponse | null = null;

    try {
      step = 'asaas_customer';
      const customer = await asaasClient.getOrCreateCustomer({
        name: userName,
        email: userEmail,
        cpfCnpj: customerCpfCnpj,
        phone: cleanPhoneBR(guard.user.phone),
        externalReference: userId,
      });

      step = 'asaas_payment';
      const asaasResponse = await asaasClient.createPayment({
        customerId: customer.id,
        billingType: 'CREDIT_CARD',
        value: finalAmount,
        dueDate: new Date().toISOString().split('T')[0],
        description: couponValidation
          ? `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) [Cupom ${couponValidation.code}]`
          : `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})`,
        externalReference: `${userId}:${plan.id}:${billingInterval}${couponValidation ? `:${couponValidation.code}` : ''}`,
        creditCard: {
          holderName,
          number: card.number.replace(/\D/g, ''),
          expiryMonth,
          expiryYear,
          ccv: cvvCode,
        },
        creditCardHolderInfo: {
          name: holderName,
          email: holderEmail,
          cpfCnpj: holderCpfCnpj,
          postalCode: holderPostalCode,
          addressNumber: holderAddressNumber,
          phone: holderPhone,
        },
        installmentCount: installments,
        remoteIp,
      });

      if (!asaasResponse?.id) {
        throw new Error(`Cobrança criada sem id na resposta do Asaas: ${JSON.stringify(asaasResponse).slice(0, 300)}`);
      }
      asaasResponseBody = asaasResponse;
      asaasPaymentId = asaasResponse.id;
      asaasStatus = String(asaasResponse.status || '').toUpperCase();
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      // Erro do Asaas: etapa da API; exceção interna: etapa do fluxo em que ocorreu
      const stage = err instanceof AsaasApiError ? err.stage : `internal:${step}`;
      const asaasCode = err instanceof AsaasApiError ? err.code : undefined;
      console.error(
        '[Checkout Confirm Asaas Error]:',
        JSON.stringify({
          stage,
          httpStatus: err instanceof AsaasApiError ? err.status : undefined,
          asaasCode,
          message: rawMsg,
          asaasResponse: err instanceof AsaasApiError ? err.details : undefined,
          stack: err instanceof Error ? err.stack : undefined,
        })
      );
      if (reservedCoupon) await CouponService.releaseCouponUse(reservedCoupon);
      reservedCoupon = null;
      const code = asaasErrorCode(err);
      // Repassa o erro real do Asaas (código + descrição) em vez de presumir recusa da emissora
      const { gatewayCode, gatewayMessage } = asaasGatewayError(err);
      return NextResponse.json(
        {
          error:
            code === 'invalid_document'
              ? 'O CPF/CNPJ do seu cadastro não foi aceito pelo processador de pagamentos. Contate o suporte.'
              : gatewayMessage || 'Não foi possível processar o pagamento com o cartão.',
          code,
          stage,
          gatewayCode,
          gatewayMessage,
          ...checkoutDebugFields(err),
        },
        { status: code === 'payment_unavailable' ? 502 : 400 }
      );
    }

    step = 'activation';
    const isPaid = ASAAS_PAID_STATUSES.has(asaasStatus);
    const isProcessing = ASAAS_PROCESSING_STATUSES.has(asaasStatus);

    if (!isPaid && !isProcessing) {
      // Recusa sem erro HTTP: registra a cobrança devolvida pelo Asaas (status, refusalReason...) sem o token do cartão
      const { creditCard: _creditCard, ...loggedResponse } = asaasResponseBody as unknown as Record<string, unknown>;
      console.error('[Checkout Confirm Asaas Refused]:', JSON.stringify(loggedResponse));
      if (reservedCoupon) await CouponService.releaseCouponUse(reservedCoupon);
      reservedCoupon = null;
      return NextResponse.json(
        {
          error: 'Pagamento não aprovado pela operadora do cartão.',
          code: 'payment_declined',
          gatewayCode: asaasStatus || undefined,
        },
        { status: 400 }
      );
    }

    const cardLast4 = card.number.replace(/\D/g, '').slice(-4);

    // 3a. Em análise: registra como pendente; o webhook PAYMENT_CONFIRMED ativa a assinatura
    //     e contabiliza o cupom, por isso a reserva é devolvida (evita contagem dupla).
    if (!isPaid) {
      if (reservedCoupon) await CouponService.releaseCouponUse(reservedCoupon);
      reservedCoupon = null;
      // A cobrança já existe no Asaas: falhar aqui com 500 levaria a uma nova tentativa (cobrança dupla).
      // O pré-registro é só auxiliar — o webhook PAYMENT_CONFIRMED cria tudo a partir da externalReference.
      await BillingService.recordTransaction({
        userId,
        gateway: 'asaas',
        gatewayTransactionId: asaasPaymentId,
        amount: finalAmount,
        currency: 'BRL',
        status: 'pending',
        paymentMethod: 'credit_card',
        rawPayload: {
          planId: plan.id,
          billingInterval,
          asaasPaymentId,
          asaasStatus,
          cardLast4,
          couponCode: couponValidation?.code || null,
        },
        idempotencyKey: `confirm_${asaasPaymentId}`,
      }).catch((err) => console.error('[Checkout Confirm] Falha ao pré-registrar cartão em análise:', asaasPaymentId, err));
      return NextResponse.json(
        {
          success: true,
          pending: true,
          code: 'payment_processing',
          paymentId: asaasPaymentId,
          amountPaid: finalAmount,
          currency: 'BRL',
          planName: plan.name,
          message: 'Pagamento em análise pela operadora. Seu acesso será liberado assim que for confirmado.',
        },
        { status: 202 }
      );
    }

    // 3b. Pago: assinatura + fatura + transação + liberação do acesso numa única transação
    let subscription: SubscriptionRecord;
    try {
      subscription = await withTransaction(async (client) => {
        const sub = await BillingService.createOrRenewSubscription({
          userId,
          gateway: 'asaas',
          gatewaySubscriptionId: asaasPaymentId,
          planId: plan.id,
          planCategory: plan.category,
          billingInterval,
          amount: finalAmount,
          currency: 'BRL',
          metadata: {
            paymentMethod: 'credit_card',
            cardLast4,
            paidAt: new Date().toISOString(),
            asaasPaymentId,
            couponCode: couponValidation?.code || undefined,
            discountAmount: couponValidation?.discountAmount || undefined,
          },
        }, client);

        await BillingService.recordTransaction({
          userId,
          subscriptionId: sub.id,
          gateway: 'asaas',
          gatewayTransactionId: asaasPaymentId,
          amount: finalAmount,
          currency: 'BRL',
          status: 'success',
          paymentMethod: 'credit_card',
          rawPayload: {
            planId: plan.id,
            planName: plan.name,
            billingInterval,
            paidAt: new Date().toISOString(),
            asaasPaymentId,
            couponCode: couponValidation?.code || null,
            discountAmount: couponValidation?.discountAmount || 0,
            originalAmount: baseAmount,
          },
          idempotencyKey: `confirm_${asaasPaymentId}`,
        }, client);

        // Só promove quem a curadoria aprovou para pagamento (ou renovação de membro)
        await client.query(
          `UPDATE users SET curation_status = 'APROVADO', updated_at = NOW()
           WHERE id = $1 AND curation_status IN ('APROVADA_PAGAMENTO', 'APROVADO')`,
          [userId]
        );
        return sub;
      });
    } catch (err) {
      // A cobrança foi APROVADA no Asaas: nunca responder 500 (a usuária tentaria pagar de novo).
      // Nada foi gravado (ROLLBACK); o webhook PAYMENT_CONFIRMED ativa a assinatura e contabiliza
      // o cupom pela externalReference, por isso a reserva é devolvida (evita contagem dupla).
      console.error('[Checkout Confirm CRITICAL] Cobrança aprovada mas ativação falhou; aguardando webhook:', asaasPaymentId, err);
      if (reservedCoupon) await CouponService.releaseCouponUse(reservedCoupon);
      reservedCoupon = null;
      return NextResponse.json(
        {
          success: true,
          pending: true,
          code: 'payment_processing',
          paymentId: asaasPaymentId,
          amountPaid: finalAmount,
          currency: 'BRL',
          planName: plan.name,
          message: 'Pagamento aprovado. Estamos concluindo a ativação e seu acesso será liberado automaticamente em instantes.',
        },
        { status: 202 }
      );
    }
    reservedCoupon = null; // uso do cupom efetivado junto com a ativação
    await cache.delete(`sub:${userId}`).catch(() => {});
    const updatedSession: SessionUser = { ...session, curationStatus: 'APROVADO' };

    try {
      await StorageService.createNotification({
        userId,
        title: 'Acesso Oficial Liberado — Bem-vinda à Lumiardi!',
        desc: `O pagamento do Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) de R$ ${finalAmount.toFixed(2).replace('.', ',')} foi confirmado com sucesso. Sua credencial foi ativada e o seu acesso ao ecossistema Lumiardi está liberado!`,
        category: 'Pagamentos',
        type: 'success',
        link: '/dashboard',
        linkText: 'Acessar Meu Painel',
      });
    } catch (e) {
      console.warn('[Checkout Confirm] Erro ao criar notificação:', e);
    }

    const response = NextResponse.json({
      success: true,
      subscription,
      paymentId: asaasPaymentId,
      amountPaid: finalAmount,
      originalAmount: baseAmount,
      discountAmount: couponValidation?.discountAmount || 0,
      couponCode: couponValidation?.code || null,
      currency: 'BRL',
      planName: plan.name,
      message: 'Pagamento confirmado com sucesso. Seu acesso ao ecossistema Lumiardi está liberado!',
    });

    setSessionCookie(response, updatedSession);

    return response;
  } catch (err: unknown) {
    if (reservedCoupon) await CouponService.releaseCouponUse(reservedCoupon).catch(() => {});
    console.error(`[Checkout Confirm] Erro interno na etapa "${step}":`, err);
    return NextResponse.json(
      { error: 'Erro ao processar o pagamento.', code: 'generic', stage: `internal:${step}`, ...checkoutDebugFields(err) },
      { status: 500 }
    );
  }
}
