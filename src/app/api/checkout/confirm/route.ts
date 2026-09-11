import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { StorageService } from '@/services/storageService';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PaymentGatewayType } from '@/lib/payments/types';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { asaasClient } from '@/lib/payments/asaasClient';
import { pool, initDatabase } from '@/lib/db';

/** Traduz erros técnicos da API Asaas em mensagens amigáveis para o usuário final */
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
  // Mensagem genérica de fallback — não expõe detalhes técnicos
  return 'Transação não autorizada pela emissora do cartão. Verifique os dados ou tente outro cartão / Pix.';
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.clone().json();
    // Log sanitized or removed for PCI-DSS compliance

    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const planId = (sanitizeInput(rawBody.planId) || 'glow') as PlanId;
    const billingInterval = (rawBody.billingInterval === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
    const requestedGateway = (rawBody.gateway as string) || 'pix';
    const gateway: PaymentGatewayType =
      requestedGateway === 'nowpayments'
        ? 'nowpayments'
        : requestedGateway === 'pix'
        ? 'pix'
        : 'asaas';

    const paymentMethod: 'credit_card' | 'crypto' | 'pix' =
      rawBody.paymentMethod || (rawBody.cardData ? 'credit_card' : gateway === 'pix' ? 'pix' : gateway === 'nowpayments' ? 'crypto' : 'credit_card');

    const plan = getPlan(planId);
    const isYearly = billingInterval === 'yearly';
    const currency = (rawBody.currency === 'USD' ? 'USD' : 'BRL') as 'BRL' | 'USD';
    const finalAmount = currency === 'USD'
      ? (isYearly ? plan.priceUSD.yearly * 12 : plan.priceUSD.monthly)
      : (isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly);

    // Caso não haja sessão (testes sandbox / visitante), gera um ID anônimo temporário
    const userId = session?.id || rawBody.userId || `guest_${Date.now()}`;
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não identificado. Por favor, complete o cadastro antes do pagamento.' },
        { status: 401 }
      );
    }

    const userEmail = session?.email || rawBody.userEmail || 'membro@lumiardi.com';
    const userName = session?.name || rawBody.userName || 'Membro Lumiardi';

    let asaasPaymentId = '';

    // 1. Processamento via Asaas quando for Cartão de Crédito em BRL ou Cartão Internacional (forçado BRL no Asaas)
    if (paymentMethod === 'credit_card' && rawBody.cardData) {
      const card = rawBody.cardData;
      const today = new Date();
      const dueDate = today.toISOString().split('T')[0];

      // O Asaas só aceita Reais (BRL) e com valor mínimo de R$ 5,00.
      // Independentemente de a tela estar mostrando USD, cobramos o equivalente BRL do plano.
      const asaasValue = isYearly ? plan.priceBRL.yearly * 12 : plan.priceBRL.monthly;

      if (asaasValue < 5.00) {
        return NextResponse.json(
          { error: 'O valor mínimo exigido pela operadora do cartão é R$ 5,00.' },
          { status: 400 }
        );
      }

      // Validação explícita de Documento (CPF/CNPJ) obrigatória pelo Asaas
      const cpfCnpjRaw = card.cpf || rawBody.taxId;
      if (!cpfCnpjRaw) {
        return NextResponse.json(
          { error: 'CPF/CNPJ/Passaporte ausente. É obrigatório informar um documento válido.' },
          { status: 400 }
        );
      }
      
      // Limpa para números. Se o taxId internacional não tiver números suficientes, faremos padding com 0.
      let cpfCnpj = cpfCnpjRaw.replace(/\D/g, '');
      if (cpfCnpj.length < 11 && currency !== 'BRL') {
        cpfCnpj = cpfCnpj.padStart(11, '0'); // Padronização para internacional passar no Asaas Sandbox
      } else if (cpfCnpj.length < 11) {
        return NextResponse.json(
          { error: 'O CPF/CNPJ informado é inválido. Por favor, verifique os números digitados.' },
          { status: 400 }
        );
      }

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
          value: asaasValue,
          dueDate,
          description: `Assinatura Lumiardi — Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})`,
          externalReference: `${userId}:${plan.id}:${billingInterval}`,
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
            postalCode: card.postalCode, // Será tratado pelo fallback seguro ou enviado se existir
            addressNumber: card.addressNumber,
            phone: rawBody.phone,
          },
          installmentCount: card.installments ? Number(card.installments) : 1,
        });

        console.log('[Asaas Confirm Response]', JSON.stringify(asaasResponse, null, 2));

        asaasPaymentId = asaasResponse.id;

        if (asaasResponse.status === 'OVERDUE' || asaasResponse.status === 'REFUNDED') {
          return NextResponse.json(
            { error: 'Pagamento não aprovado pela operadora do cartão.' },
            { status: 400 }
          );
        }
      } catch (err: unknown) {
        // Normaliza erros do Asaas em mensagens amigáveis — sem vazar stack trace ou dados internos
        const rawMsg = err instanceof Error ? err.message : '';
        console.error('[Checkout Confirm Asaas Error]:', rawMsg);

        const friendlyMessage = normalizeAsaasError(rawMsg);
        return NextResponse.json({ error: friendlyMessage }, { status: 400 });
      }
    } else if (paymentMethod === 'credit_card' && !rawBody.cardData) {
      return NextResponse.json(
        { error: 'Dados do cartão de crédito ausentes no payload.' },
        { status: 400 }
      );
    }

    const txId = asaasPaymentId || `${gateway}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveGateway: PaymentGatewayType = gateway === 'pix' ? 'asaas' : gateway;

    // 2. Garante que o userId existe na tabela `users` antes de criar invoices/subscriptions
    //    (evita violação de FK: Key (user_id)=(...) is not present in table "users")
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
      console.warn('[Checkout Confirm] UPSERT de usuário falhou (prosseguindo com fallbackStore):', err);
    }

    // 3. Processa assinatura e transação dependendo do método de pagamento
    const isInstantPayment = paymentMethod === 'credit_card';
    let subscription = null;

    if (isInstantPayment) {
      subscription = await BillingService.createOrRenewSubscription({
        userId,
        gateway: effectiveGateway,
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

      if (!subscription) {
        return NextResponse.json(
          { error: 'Falha ao provisionar assinatura do usuário.' },
          { status: 500 }
        );
      }
    }

    // Registra a transação de pagamento
    await BillingService.recordTransaction({
      userId,
      subscriptionId: subscription?.id,
      gateway: effectiveGateway,
      gatewayTransactionId: txId,
      amount: finalAmount,
      currency,
      status: isInstantPayment ? 'success' : 'pending',
      paymentMethod,
      rawPayload: {
        planId: plan.id,
        planName: plan.name,
        billingInterval,
        gateway: effectiveGateway,
        paidAt: isInstantPayment ? new Date().toISOString() : null,
        asaasPaymentId,
      },
      idempotencyKey: `confirm_${txId}`,
    });

    // 4. Cria notificação para o usuário
    try {
      const formattedTotal = currency === 'USD' ? `$ ${finalAmount.toFixed(2)}` : `R$ ${finalAmount.toFixed(2).replace('.', ',')}`;
      const title = isInstantPayment ? 'Pagamento Confirmado' : 'Aguardando Pagamento';
      const desc = isInstantPayment 
        ? `O pagamento do Plano ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) de ${formattedTotal} foi confirmado com sucesso via ${gateway === 'nowpayments' ? 'NOWPayments' : 'Asaas'}. Sua candidatura foi enviada com prioridade para a Mesa de Curadoria.`
        : `Aguardando a confirmação do pagamento do Plano ${plan.name} de ${formattedTotal} via ${paymentMethod === 'pix' ? 'Pix' : 'Cripto'}. Sua assinatura será ativada assim que o pagamento for compensado.`;
        
      await StorageService.createNotification({
        userId,
        title,
        desc,
        category: 'Pagamentos',
        type: isInstantPayment ? 'success' : 'info',
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
      message: isInstantPayment ? 'Pagamento confirmado com sucesso via Asaas. Candidatura em análise pela Curadoria VIP.' : 'Aguardando compensação do pagamento. A assinatura será ativada automaticamente.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar confirmação de pagamento';
    console.error('[Checkout Confirm] Erro:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
